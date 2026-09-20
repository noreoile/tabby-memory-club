import {validAvatar} from '@/lib/avatars';
import {isDeckSet} from '@/lib/decks';
import {roomDb} from '@/lib/room-db';
import {type Room,type Player,settle,start,flip,view,sendChat,sendReaction,configure} from '@/lib/game';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('')}
function validateName(n:unknown){if(typeof n!=='string'||!n.trim()||n.trim().length>16)throw Error('請輸入 1–16 個字的名字');return n.trim()}
async function player(name:unknown,avatar:unknown,token:string):Promise<Player>{return {id:crypto.randomUUID(),secret:await hash(token),name:validateName(name),avatar:validAvatar(avatar)?avatar:0,score:0,seen:Date.now(),left:false}}
function code(){const a=new Uint8Array(6);crypto.getRandomValues(a);return Array.from(a,x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('')}
async function handle(request:Request,body:any){const db=roomDb();const now=Date.now();
 if(body.action==='create'){
 const deckSet=body.deckSet??'tabby';if(!isDeckSet(deckSet))throw Error('請選擇有效的貓咪牌組');
 const token=crypto.randomUUID()+crypto.randomUUID();const p=await player(body.name,body.avatar,token);
 for(let n=0;n<5;n++){const c=code();const r:Room={deckSet,code:c,players:[p],host:p.id,rows:4,cols:4,deck:[],matched:[],flipped:[],turn:p.id,phase:'lobby',resolveAt:0,deadline:0,round:0,last:'等待朋友加入',actions:[]};const added=await db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,expires_at) VALUES(?,?,0,?)').bind(c,JSON.stringify(r),now+86400000).run();if(added.meta.changes)return json({room:view(r,p.id,0,now),token})}throw Error('建立房間失敗，請再試一次')}
 const c=String(body.code||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(c))return json({error:'請輸入正確的 6 位房間代碼'},400);
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'');const secret=supplied?await hash(supplied):'';
 const joining=body.action==='join';const newToken=joining&&!supplied?crypto.randomUUID()+crypto.randomUUID():null;const candidate=joining?await player(body.name,body.avatar,supplied||newToken!):null;
 for(let attempt=0;attempt<10;attempt++){
 const row=await db.prepare('SELECT state,version,expires_at FROM rooms WHERE code=?').bind(c).first<{state:string;version:number;expires_at:number}>();if(!row||row.expires_at<now)return json({error:'找不到房間，或房間已超過 24 小時',expired:true},404);
 const r:Room=JSON.parse(row.state);const before=JSON.stringify(r);let p=r.players.find(p=>p.secret===secret);
 if(joining){if(p){p.left=false;p.seen=now}else{r.players=r.players.filter(p=>!p.left&&now-p.seen<45000);if(r.players.length>=8)throw Error('房間已滿，最多 8 人');p=candidate!;p.spectator=r.phase!=='lobby';r.players.push(p)}}
 if(!p)return json({error:'請先加入這個房間',expired:true},401);
 if(body.action!=='leave'){if(p.left)return json({error:'你已離開房間，請重新加入',expired:true},401);if(now-p.seen>8000)p.seen=now}
 settle(r,now);
 const key=typeof body.requestId==='string'?p.id+':'+body.requestId:null;
 if(body.action!=='read'&&!joining&&!key)throw Error('操作缺少識別碼，請重試');
 if(!key||!r.actions.includes(key)){
 if(body.action==='start'){if(r.host!==p.id)throw Error('只有房主可以開始');if(r.phase==='playing')throw Error('請先完成這局');const setup=r.nextSetup??{deckSet:r.deckSet??'tabby',rows:body.rows,cols:body.cols};start(r,setup.rows,setup.cols,now);r.deckSet=setup.deckSet}
 else if(body.action==='configure')configure(r,p.id,body.deckSet,body.rows,body.cols);
 else if(body.action==='avatar'){if(!validAvatar(body.avatar))throw Error('頭像無效');p.avatar=body.avatar}
 else if(body.action==='flip'){if(body.deadline!==r.deadline||body.round!==r.round)throw Error('輪次已更新，請重新選牌');flip(r,p.id,body.index,now)}
 else if(body.action==='chat')sendChat(r,p,body.text,body.messageId,now);
 else if(body.action==='reaction')sendReaction(r,p,body.emoji,body.reactionId,now);
 else if(body.action==='leave'){p.left=true;settle(r,now)}
 else if(!['join','read'].includes(body.action))throw Error('不支援的操作');
 if(key){r.actions.push(key);r.actions=r.actions.slice(-80)}}
 if(before===JSON.stringify(r))return json({room:view(r,p.id,row.version,now)});
 const result=await db.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(r),c,row.version).run();if(result.meta.changes)return json({room:view(r,p.id,row.version+1,now),...(newToken?{token:newToken}:{})});
 }
 return json({error:'有人正在操作，請再試一次'},409);
}
export async function GET(request:Request){try{return await handle(request,{action:'read',code:new URL(request.url).searchParams.get('code')})}catch(error){console.error('game read',error);return json({error:'連線暫時中斷，正在重新連線'},503)}}
export async function POST(request:Request){try{const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'不允許此來源'},403);const text=await request.text();if(text.length>4096)return json({error:'資料過大'},413);return await handle(request,JSON.parse(text))}catch(error){const msg=error instanceof Error?error.message:'操作失敗';if(/D1|SQLITE|binding|database/i.test(msg)){console.error('game write',error);return json({error:'遊戲服務暫時無法使用，請稍後重試'},503)}return json({error:msg},400)}}
