import {type DeckSet,resolveDeckSet} from './decks';
export type Player={id:string;secret:string;name:string;avatar:number;score:number;seen:number;left:boolean};
export type ChatMessage={id:string;playerId:string;name:string;avatar:number;text:string;sentAt:number};
export type Room={deckSet?:DeckSet;messages?:ChatMessage[];code:string;players:Player[];host:string;rows:number;cols:number;deck:number[];matched:number[];flipped:number[];turn:string;phase:'lobby'|'playing'|'finished';resolveAt:number;deadline:number;round:number;last:string;actions:string[]};
export function live(r:Room,now:number){return r.players.filter(p=>!p.left&&now-p.seen<45000)}
export function next(r:Room,now:number){const online=live(r,now);const current=r.players.findIndex(p=>p.id===r.turn);for(let i=1;i<=r.players.length;i++){const p=r.players[(current+i)%r.players.length];if(online.some(o=>o.id===p.id)){r.turn=p.id;break}}r.deadline=now+35000}
export function settle(r:Room,now:number){
 const online=live(r,now);if(!online.some(p=>p.id===r.host)&&online.length)r.host=online[0].id;
 if(r.phase!=='playing')return;
 if(r.resolveAt&&now>=r.resolveAt){r.flipped=[];r.resolveAt=0;if(r.matched.length===r.deck.filter(v=>v>=0).length){r.phase='finished';r.last='全部配對完成！';return}next(r,now)}
 if(!r.resolveAt&&(now>=r.deadline||!online.some(p=>p.id===r.turn))){r.flipped=[];next(r,now);r.last='已換下一位玩家'}
}
function random(n:number){const a=new Uint32Array(1);const limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
export function shuffle<T>(a:T[]){for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
export function start(r:Room,rows:number,cols:number,now:number){if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<2||rows>8||cols<2||cols>8)throw Error('行列數需為 2–8');const online=live(r,now);if(online.length<2)throw Error('至少需要 2 位在線玩家');const count=rows*cols;const cats=shuffle(Array.from({length:36},(_,i)=>i)).slice(0,Math.floor(count/2));r.deck=shuffle(cats.flatMap(x=>[x,x]));if(count%2)r.deck.splice(Math.floor(count/2),0,-1);r.rows=rows;r.cols=cols;r.matched=[];r.flipped=[];r.players=r.players.filter(p=>online.some(o=>o.id===p.id));r.players.forEach(p=>p.score=0);r.turn=r.players[0].id;r.phase='playing';r.resolveAt=0;r.deadline=now+35000;r.round++;r.last='新的一局，開始！'}
export function flip(r:Room,pid:string,index:number,now:number){if(r.phase!=='playing')throw Error('這局還沒開始');if(live(r,now).length<2)throw Error('等待另一位玩家重新連線');if(r.turn!==pid)throw Error('還沒輪到你');if(r.resolveAt)throw Error('請等這回合翻牌結束');if(!Number.isInteger(index)||index<0||index>=r.deck.length||r.deck[index]<0||r.flipped.includes(index)||r.matched.includes(index))throw Error('這張牌不能翻');r.flipped.push(index);if(r.flipped.length===2){const[a,b]=r.flipped;if(r.deck[a]===r.deck[b]){r.matched.push(a,b);r.players.find(p=>p.id===pid)!.score++;r.last='找到同一隻貓！＋1 分'}else r.last='差一點！再記住牠們的位置';r.resolveAt=now+1700}}
export function view(r:Room,pid:string,version:number,now:number){return {...r,deckSet:resolveDeckSet(r.deckSet),players:r.players.filter(p=>!p.left||r.phase!=='lobby').map(({secret,...p})=>({...p,online:!p.left&&now-p.seen<45000})),deck:r.deck.map((v,i)=>v===-1?-1:r.flipped.includes(i)||r.matched.includes(i)?v:null),actions:undefined,you:pid,version,serverTime:now}}

export function sendChat(r:Room,p:Player,text:unknown,id:unknown,now:number){
 if(typeof text!=='string'||!text.trim()||text.trim().length>300)throw Error('訊息需為 1–300 個字');
 if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(id))throw Error('訊息識別碼無效');
 const messages=r.messages??=[];const messageId=p.id+':'+id;
 if(messages.some(m=>m.id===messageId))return;
 const previous=[...messages].reverse().find(m=>m.playerId===p.id);
 if(previous&&now-previous.sentAt<800)throw Error('傳送太快，請稍等一下');
 messages.push({id:messageId,playerId:p.id,name:p.name,avatar:p.avatar,text:text.trim(),sentAt:now});
 r.messages=messages.slice(-100);
}
