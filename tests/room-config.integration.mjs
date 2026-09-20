import assert from 'node:assert/strict';
const base='http://localhost:5173/api/game';let room;const tokens={};
async function call(action,token,extra={},status=200){const res=await fetch(base,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({action,code:room?.code,round:room?.round,deadline:room?.deadline,requestId:crypto.randomUUID(),...extra})});const d=await res.json();assert.equal(res.status,status,JSON.stringify(d));if(d.room)room=d.room;return d}
const h=await call('create',null,{name:'Host',avatar:35,deckSet:'tabby'});tokens[room.you]=h.token;assert.equal(room.players[0].avatar,35);const code=room.code;
const g=await call('join',null,{name:'Guest',avatar:18});tokens[room.you]=g.token;
await call('configure',g.token,{deckSet:'otters',rows:2,cols:2},400);
await call('configure',h.token,{deckSet:'unknown',rows:2,cols:2},400);
await call('configure',h.token,{deckSet:'otters',rows:2,cols:2});assert.equal(room.nextSetup.deckSet,'otters');
await call('read',g.token);assert.equal(room.nextSetup.deckSet,'otters');
await call('start',h.token,{rows:4,cols:4});assert.equal(room.deckSet,'otters');assert.equal(room.deck.length,4);
const w=await call('join',null,{name:'Watcher',avatar:7});tokens[room.you]=w.token;assert.equal(room.players.find(p=>p.id===room.you).spectator,true);
await call('flip',w.token,{index:0},400);
await call('reaction',w.token,{reaction:'laugh',reactionId:crypto.randomUUID()});assert.equal(room.reactions.at(-1).kind,'laugh');
await call('read',g.token);assert.equal(room.reactions.at(-1).kind,'laugh','another player should receive the reaction');
await new Promise(r=>setTimeout(r,750));await call('reaction',w.token,{reaction:'not-allowed',reactionId:crypto.randomUUID()},400);
await call('configure',h.token,{deckSet:'orange',rows:6,cols:7},400);
await call('avatar',g.token,{avatar:24});assert.equal(room.players.find(p=>p.id===room.you).avatar,24);
await call('avatar',g.token,{avatar:36},400);
await call('chat',g.token,{text:'Same room',messageId:crypto.randomUUID()});assert.equal(room.messages.at(-1).avatar,24);
const memory={};let turns=0;
while(room.phase==='playing'&&turns++<12){const token=tokens[room.turn];const free=[0,1,2,3].filter(i=>!room.matched.includes(i));let pair=[];for(const i of free){const j=free.find(j=>j!==i&&memory[i]!==undefined&&memory[i]===memory[j]);if(j!==undefined){pair=[i,j];break}}const a=pair[0]??free.find(i=>memory[i]===undefined)??free[0];await call('flip',token,{index:a});memory[a]=room.deck[a];const b=pair[1]??free.find(i=>i!==a&&memory[i]===memory[a])??free.find(i=>i!==a&&memory[i]===undefined)??free.find(i=>i!==a);await call('flip',token,{index:b});memory[b]=room.deck[b];await new Promise(r=>setTimeout(r,1750));await call('read',token)}
assert.equal(room.phase,'finished');const previousDeck=[...room.deck],previousScores=room.players.map(p=>p.score);
await call('configure',h.token,{deckSet:'abyssinian',rows:6,cols:7});assert.equal(room.deckSet,'otters');assert.deepEqual(room.deck,previousDeck);assert.deepEqual(room.players.map(p=>p.score),previousScores);
await call('start',h.token);assert.equal(room.code,code);assert.equal(room.deckSet,'abyssinian');assert.equal(room.deck.length,42);assert.equal(room.players.length,3);assert.equal(room.players.find(p=>p.name==='Watcher').spectator,false);assert.equal(room.messages.at(-1).text,'Same room');assert.ok(room.players.every(p=>p.score===0));
console.log('PASS setup, chat, reactions, midgame spectating and next-round promotion');
