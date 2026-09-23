import {roomDb} from '@/lib/room-db';
import type {Room,Player} from '@/lib/game';

export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const ACTIVE_MS=18000,SIGNAL_MS=60000;
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('')}
async function member(request:Request,code:string){
 if(!/^[A-Z2-9]{6}$/.test(code))throw Error('房間代碼無效');
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)throw Error('請先加入房間');
 const db=roomDb(),row=await db.prepare('SELECT state,expires_at FROM rooms WHERE code=?').bind(code).first<{state:string;expires_at:number}>();
 if(!row||row.expires_at<Date.now())throw Error('找不到房間，或房間已過期');
 const room:Room=JSON.parse(row.state),secret=await hash(token),player=room.players.find(item=>item.secret===secret&&!item.left);
 if(!player)throw Error('請先加入房間');return {db,room,player};
}
async function heartbeat(db:D1Database,code:string,playerId:string,now:number){
 await db.prepare('INSERT INTO voice_members(room_code,player_id,updated_at) VALUES(?,?,?) ON CONFLICT(room_code,player_id) DO UPDATE SET updated_at=excluded.updated_at').bind(code,playerId,now).run();
 await cleanup(db,code,now);
}
async function cleanup(db:D1Database,code:string,now:number){
 await db.prepare('DELETE FROM voice_members WHERE room_code=? AND updated_at<?').bind(code,now-ACTIVE_MS).run();
 await db.prepare('DELETE FROM voice_signals WHERE room_code=? AND created_at<?').bind(code,now-SIGNAL_MS).run();
}
function visibleMembers(room:Room,ids:string[]){const active=new Set(ids);return room.players.filter(player=>!player.left&&active.has(player.id)).map(({id,name,avatar}:Player)=>({id,name,avatar}))}

export async function GET(request:Request){try{
 const code=(new URL(request.url).searchParams.get('code')||'').trim().toUpperCase(),now=Date.now(),{db,room,player}=await member(request,code),joined=await db.prepare('SELECT player_id FROM voice_members WHERE room_code=? AND player_id=?').bind(code,player.id).first();if(joined)await heartbeat(db,code,player.id,now);else await cleanup(db,code,now);
 const memberRows=await db.prepare('SELECT player_id FROM voice_members WHERE room_code=? AND updated_at>=?').bind(code,now-ACTIVE_MS).all<{player_id:string}>();
 const signalRows=await db.prepare('SELECT id,sender_id,kind,payload,created_at FROM voice_signals WHERE room_code=? AND target_id=? AND created_at>=? ORDER BY created_at ASC LIMIT 100').bind(code,player.id,now-SIGNAL_MS).all<{id:string;sender_id:string;kind:string;payload:string;created_at:number}>();
 return json({members:visibleMembers(room,memberRows.results.map(row=>row.player_id)),signals:signalRows.results.map(row=>({id:row.id,senderId:row.sender_id,kind:row.kind,payload:row.payload,createdAt:row.created_at})),serverTime:now});
 }catch(error){return json({error:error instanceof Error?error.message:'語音服務暫時無法使用'},400)}}

export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'不允許此來源'},403);
 const text=await request.text();if(text.length>20000)return json({error:'語音訊號過大'},413);const body=JSON.parse(text),code=String(body.code||'').trim().toUpperCase(),now=Date.now(),{db,room,player}=await member(request,code);
 if(body.action==='leave'){await db.prepare('DELETE FROM voice_members WHERE room_code=? AND player_id=?').bind(code,player.id).run();await db.prepare('DELETE FROM voice_signals WHERE room_code=? AND (sender_id=? OR target_id=?)').bind(code,player.id,player.id).run();return json({ok:true})}
 await heartbeat(db,code,player.id,now);
 if(body.action==='join'||body.action==='heartbeat')return json({ok:true});
 if(body.action!=='signal')throw Error('不支援的語音操作');
 const id=String(body.signalId||''),targetId=String(body.targetId||''),kind=String(body.kind||''),payload=body.payload;
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(id)||!['offer','answer'].includes(kind)||typeof payload!=='string'||!payload||payload.length>16000)throw Error('語音訊號無效');
 if(targetId===player.id||!room.players.some(item=>item.id===targetId&&!item.left))throw Error('語音接收者無效');
 const target=await db.prepare('SELECT player_id FROM voice_members WHERE room_code=? AND player_id=? AND updated_at>=?').bind(code,targetId,now-ACTIVE_MS).first();if(!target)throw Error('對方尚未加入語音');
 await db.prepare('INSERT OR IGNORE INTO voice_signals(id,room_code,sender_id,target_id,kind,payload,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,code,player.id,targetId,kind,payload,now).run();return json({ok:true});
 }catch(error){return json({error:error instanceof Error?error.message:'語音服務暫時無法使用'},400)}}
