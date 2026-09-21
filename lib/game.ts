import {type DeckSet,resolveDeckSet,isDeckSet} from './decks';

export const REACTIONS=Array.from({length:7},(_,index)=>({id:`reaction-${index+1}`,image:`/reactions/reaction-${index+1}.png`})) as readonly {id:string;image:string}[];
export const ITEM_CARDS={
 bomb:{name:'炸彈卡',image:'/items/bomb.png',description:'翻到後交換附近 4 張牌的位置',value:-2},
 banana:{name:'香蕉卡',image:'/items/banana.png',description:'下次輪到你時自動翻開 1 張牌',value:-3},
 freeze:{name:'冰凍卡',image:'/items/freeze.png',description:'下次輪到你時直接跳過一次',value:-4},
} as const;
export type ItemCard=keyof typeof ITEM_CARDS;
export type ItemEffect={id:string;kind:ItemCard;playerId:string;cardIndex:number;affected:number[];createdAt:number};
export type Player={id:string;secret:string;name:string;avatar:number;score:number;seen:number;left:boolean;spectator?:boolean;bananaPending?:boolean;freezePending?:boolean};
export type ChatMessage={id:string;playerId:string;name:string;avatar:number;text:string;sentAt:number};
export type Reaction={id:string;playerId:string;name:string;kind:string;sentAt:number};
export type Room={
 nextSetup?:{deckSet:DeckSet;rows:number;cols:number;itemCards?:ItemCard[]};deckSet?:DeckSet;itemCards?:ItemCard[];effects?:ItemEffect[];messages?:ChatMessage[];reactions?:Reaction[];
 code:string;players:Player[];host:string;rows:number;cols:number;deck:number[];matched:number[];flipped:number[];turn:string;phase:'lobby'|'playing'|'finished';resolveAt:number;deadline:number;round:number;last:string;actions:string[];
};

export function isItemCard(value:unknown):value is ItemCard{return typeof value==='string'&&Object.prototype.hasOwnProperty.call(ITEM_CARDS,value)}
export function parseItemCards(value:unknown):ItemCard[]{
 if(value==null)return [];
 if(!Array.isArray(value))throw Error('道具卡設定無效');
 const unique=[...new Set(value)];
 if(unique.length>3||!unique.every(isItemCard))throw Error('請選擇有效的道具卡');
 return unique as ItemCard[];
}
export function itemCardFromValue(value:number){return (Object.keys(ITEM_CARDS) as ItemCard[]).find(key=>ITEM_CARDS[key].value===value)}
export function configure(r:Room,pid:string,deckSet:unknown,rows:unknown,cols:unknown,itemCards?:unknown){
 if(r.host!==pid)throw Error('只有房主可以更換牌組與牌數');
 if(r.phase==='playing')throw Error('請等這局結束再更換');
 if(!isDeckSet(deckSet))throw Error('請選擇有效的牌組');
 if(typeof rows!=='number'||typeof cols!=='number'||!Number.isInteger(rows)||!Number.isInteger(cols)||rows<2||rows>8||cols<2||cols>8)throw Error('行列數需為 2–8');
 const selected=itemCards===undefined?[...(r.nextSetup?.itemCards??r.itemCards??[])]:parseItemCards(itemCards);
 if(rows*cols-selected.length<2)throw Error('這個棋盤太小，請減少道具卡或增加牌數');
 r.nextSetup={deckSet,rows,cols,itemCards:selected};
}
export function present(r:Room,now:number){return r.players.filter(p=>!p.left&&now-p.seen<45000)}
export function live(r:Room,now:number){return present(r,now).filter(p=>!p.spectator)}
function addEffect(r:Room,kind:ItemCard,playerId:string,cardIndex:number,affected:number[],now:number){
 const recent=(r.effects??[]).filter(effect=>now-effect.createdAt<7000);
 recent.push({id:crypto.randomUUID(),kind,playerId,cardIndex,affected,createdAt:now});
 r.effects=recent.slice(-12);
}
function beginTurn(r:Room,p:Player,now:number){
 r.turn=p.id;r.deadline=now+35000;r.flipped=[];
 if(!p.bananaPending)return;
 p.bananaPending=false;
 const choices=r.deck.map((value,index)=>value>=0&&!r.matched.includes(index)?index:-1).filter(index=>index>=0);
 if(!choices.length)return;
 const index=choices[random(choices.length)];r.flipped=[index];
 addEffect(r,'banana',p.id,index,[index],now);r.last=`香蕉卡發動！系統已替 ${p.name} 隨機翻開一張貓咪牌，現在可以再選一張。`;
}
export function next(r:Room,now:number){
 const online=live(r,now);if(!online.length)return;
 const current=Math.max(0,r.players.findIndex(p=>p.id===r.turn));
 for(let i=1;i<=r.players.length;i++){
  const p=r.players[(current+i)%r.players.length];
  if(!online.some(o=>o.id===p.id))continue;
  if(p.freezePending){p.freezePending=false;addEffect(r,'freeze',p.id,-1,[],now);r.last=`冰凍效果發動！${p.name} 這回合無法行動，已自動跳到下一位玩家。`;continue}
  beginTurn(r,p,now);return;
 }
 beginTurn(r,online[0],now);
}
function normalCardsFinished(r:Room){return r.deck.every((value,index)=>value<0||r.matched.includes(index))}
export function settle(r:Room,now:number){
 r.reactions=(r.reactions??[]).filter(reaction=>now-reaction.sentAt<8000);
 r.effects=(r.effects??[]).filter(effect=>now-effect.createdAt<7000);
 const presentPlayers=present(r,now),online=live(r,now);if(!presentPlayers.some(p=>p.id===r.host)&&presentPlayers.length)r.host=(online[0]??presentPlayers[0]).id;
 if(r.phase!=='playing')return;
 if(r.resolveAt&&now>=r.resolveAt){
  const earnedExtraTurn=r.flipped.length===2&&r.flipped.every(index=>r.deck[index]>=0&&r.matched.includes(index));
  r.flipped=[];r.resolveAt=0;
  if(normalCardsFinished(r)){r.phase='finished';r.last='全部配對完成！';return}
  if(earnedExtraTurn&&online.some(p=>p.id===r.turn)){r.deadline=now+35000;r.last='配對成功，繼續翻牌！'}
  else{const previousEffect=r.effects.at(-1)?.id;next(r,now);if(previousEffect===r.effects.at(-1)?.id)r.last='已換下一位玩家'}
 }
 if(!r.resolveAt&&(now>=r.deadline||!online.some(p=>p.id===r.turn))){r.flipped=[];const previousEffect=r.effects.at(-1)?.id;next(r,now);if(previousEffect===r.effects.at(-1)?.id)r.last='已換下一位玩家'}
}
function random(n:number){const a=new Uint32Array(1);const limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
export function shuffle<T>(a:T[]){for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
export function start(r:Room,rows:number,cols:number,now:number,itemCards:unknown=r.itemCards??[]){
 if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<2||rows>8||cols<2||cols>8)throw Error('行列數需為 2–8');
 const online=present(r,now);if(online.length<2)throw Error('至少需要 2 位在線玩家');
 const selected=parseItemCards(itemCards),count=rows*cols;if(count-selected.length<2)throw Error('這個棋盤太小，請減少道具卡或增加牌數');
 const pairCount=Math.floor((count-selected.length)/2),cats=shuffle(Array.from({length:36},(_,i)=>i)).slice(0,pairCount);
 r.deck=shuffle([...cats.flatMap(value=>[value,value]),...selected.map(kind=>ITEM_CARDS[kind].value)]);
 if(r.deck.length<count)r.deck.splice(Math.floor(count/2),0,-1);
 r.rows=rows;r.cols=cols;r.itemCards=selected;r.matched=[];r.flipped=[];r.effects=[];
 r.players=r.players.filter(p=>online.some(o=>o.id===p.id));r.players.forEach(p=>{p.score=0;p.spectator=false;p.bananaPending=false;p.freezePending=false});
 r.turn=r.players[0].id;r.phase='playing';r.resolveAt=0;r.deadline=now+35000;r.round++;r.last='新的一局，開始！';
}
function bombTargets(r:Room,index:number){
 const row=Math.floor(index/r.cols),col=index%r.cols;
 return r.deck.map((value,target)=>({target,distance:Math.abs(Math.floor(target/r.cols)-row)+Math.abs(target%r.cols-col),value}))
  .filter(entry=>entry.target!==index&&entry.value!==-1&&!r.matched.includes(entry.target)&&!r.flipped.includes(entry.target))
  .sort((a,b)=>a.distance-b.distance||a.target-b.target).slice(0,4).map(entry=>entry.target);
}
function activateItem(r:Room,p:Player,kind:ItemCard,index:number,now:number){
 r.matched.push(index);let affected:number[]=[];
 if(kind==='bomb'){
  affected=bombTargets(r,index);
  if(affected.length>1){const values=affected.map(target=>r.deck[target]),shift=random(affected.length-1)+1;affected.forEach((target,i)=>{r.deck[target]=values[(i+shift)%values.length]})}
  r.last=`炸彈卡啟動！${p.name} 附近的 ${affected.length} 張蓋牌正在交換位置，記住它們的新位置！`;
 }else if(kind==='banana'){p.bananaPending=true;r.last=`香蕉卡已生效！${p.name} 下次輪到時，系統會先隨機翻開一張貓咪牌。`}
 else{p.freezePending=true;r.last=`冰凍卡已生效！${p.name} 下次輪到時會被冰凍，並跳過一次行動。`}
 addEffect(r,kind,p.id,index,affected,now);r.resolveAt=now+2200;
}
export function flip(r:Room,pid:string,index:number,now:number){
 if(r.phase!=='playing')throw Error('這局還沒開始');if(live(r,now).length<2)throw Error('等待另一位玩家重新連線');if(r.turn!==pid)throw Error('還沒輪到你');if(r.resolveAt)throw Error('請等這回合翻牌結束');
 if(!Number.isInteger(index)||index<0||index>=r.deck.length||r.deck[index]===-1||r.flipped.includes(index)||r.matched.includes(index))throw Error('這張牌不能翻');
 r.flipped.push(index);const kind=itemCardFromValue(r.deck[index]);if(kind){activateItem(r,r.players.find(p=>p.id===pid)!,kind,index,now);return}
 if(r.flipped.length===2){const[a,b]=r.flipped;if(r.deck[a]===r.deck[b]){r.matched.push(a,b);r.players.find(p=>p.id===pid)!.score++;r.last='找到同一隻貓！＋1 分，再翻一次'}else r.last='差一點！再記住牠們的位置';r.resolveAt=now+1700}
}
export function view(r:Room,pid:string,version:number,now:number){return {...r,deckSet:resolveDeckSet(r.deckSet),itemCards:parseItemCards(r.itemCards),players:r.players.filter(p=>!p.left||r.phase!=='lobby').map(({secret,...p})=>({...p,online:!p.left&&now-p.seen<45000})),deck:r.deck.map((value,index)=>value===-1?-1:r.flipped.includes(index)||r.matched.includes(index)?value:null),actions:undefined,you:pid,version,serverTime:now}}

export function sendChat(r:Room,p:Player,text:unknown,id:unknown,now:number){
 if(typeof text!=='string'||!text.trim()||text.trim().length>300)throw Error('訊息需為 1–300 個字');if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(id))throw Error('訊息識別碼無效');
 const messages=r.messages??=[],messageId=p.id+':'+id;if(messages.some(m=>m.id===messageId))return;const previous=[...messages].reverse().find(m=>m.playerId===p.id);if(previous&&now-previous.sentAt<800)throw Error('傳送太快，請稍等一下');
 messages.push({id:messageId,playerId:p.id,name:p.name,avatar:p.avatar,text:text.trim(),sentAt:now});r.messages=messages.slice(-100);
}
export function sendReaction(r:Room,p:Player,kind:unknown,id:unknown,now:number){
 if(typeof kind!=='string'||!REACTIONS.some(reaction=>reaction.id===kind))throw Error('不支援這個反應');if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,64}$/.test(id))throw Error('表情識別碼無效');
 const reactions=r.reactions??=[],reactionId=p.id+':'+id;if(reactions.some(reaction=>reaction.id===reactionId))return;const previous=[...reactions].reverse().find(reaction=>reaction.playerId===p.id);if(previous&&now-previous.sentAt<700)throw Error('表情傳送太快，請稍等一下');
 reactions.push({id:reactionId,playerId:p.id,name:p.name,kind,sentAt:now});r.reactions=reactions.filter(reaction=>now-reaction.sentAt<8000).slice(-24);
}
