import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const decks=moduleUrl(await readFile(new URL('../lib/decks.ts',import.meta.url),'utf8'));
const {isDeckSet,resolveDeckSet}=await import(decks);
assert.equal(isDeckSet('black'),true);assert.equal(resolveDeckSet('black'),'black');assert.equal(isDeckSet('gray'),false);
const gameSource=(await readFile(new URL('../lib/game.ts',import.meta.url),'utf8')).replace("'./decks'",JSON.stringify(decks));
const {flip,settle,view,start,next,sendReaction}=await import(moduleUrl(gameSource));
const now=100000;
function room(){return {code:'ABCDEF',players:[0,1,2].map(i=>({id:'p'+i,name:'Player '+i,secret:'secret',avatar:i,score:0,seen:now,left:false})),host:'p0',rows:2,cols:3,deck:[0,0,1,1,2,2],matched:[],flipped:[],turn:'p0',phase:'playing',resolveAt:0,deadline:now+35000,round:1,last:'',actions:[]}}
function pair(r,a,b,t=now){flip(r,r.turn,a,t);flip(r,r.turn,b,t)}
let r=room();pair(r,0,1);assert.equal(r.players[0].score,1);assert.throws(()=>flip(r,'p0',2,now+100));settle(r,now+1700);assert.equal(r.turn,'p0');assert.equal(r.deadline,now+1700+35000);assert.deepEqual(r.flipped,[]);assert.deepEqual(view(r,'p0',1,now+1700).deck,[0,0,null,null,null,null]);assert.throws(()=>flip(r,'p1',2,now+1700));assert.throws(()=>flip(r,'p0',0,now+1700));
pair(r,2,3,now+1800);settle(r,now+3500);assert.equal(r.turn,'p0');assert.equal(r.players[0].score,2);pair(r,4,5,now+3600);settle(r,now+5300);assert.equal(r.phase,'finished');assert.equal(r.players[0].score,3);
r=room();pair(r,0,2);settle(r,now+1700);assert.equal(r.turn,'p1');assert.deepEqual(r.flipped,[]);assert.equal(r.players[0].score,0);
r=room();pair(r,0,1);r.players[0].left=true;settle(r,now+1700);assert.equal(r.turn,'p1');assert.equal(r.host,'p1');
r=room();pair(r,0,1);r.players[1].seen=now+46000;settle(r,now+46000);assert.notEqual(r.turn,'p0');
r=room();flip(r,'p0',0,now);settle(r,now+35000);assert.equal(r.turn,'p1');assert.deepEqual(r.flipped,[]);
r=room();pair(r,0,1,now+34900);settle(r,now+36600);assert.equal(r.turn,'p0');assert.equal(r.deadline,now+71600);
r=room();r.players[1].left=true;pair(r,0,2);settle(r,now+1700);assert.equal(r.turn,'p2');
r=room();const watcher={id:'watcher',name:'Watcher',secret:'secret',avatar:4,score:0,seen:now,left:false,spectator:true};r.players.push(watcher);assert.throws(()=>flip(r,'watcher',0,now),/還沒輪到你/);r.turn='p2';pair(r,0,2);settle(r,now+1700);assert.equal(r.turn,'p0');start(r,2,2,now+1800);assert.equal(r.players.find(p=>p.id==='watcher').spectator,false);
r=room();sendReaction(r,r.players[0],'reaction-1','reaction-1',now);assert.equal(r.reactions.at(-1).kind,'reaction-1');assert.throws(()=>sendReaction(r,r.players[0],'nope','reaction-2',now+800),/不支援/);assert.throws(()=>sendReaction(r,r.players[0],'reaction-2','reaction-3',now+500),/太快/);settle(r,now+9000);assert.deepEqual(r.reactions,[]);
r=room();r.rows=3;r.cols=3;r.deck=[0,1,2,3,-2,4,5,6,7];const beforeBomb=[...r.deck];flip(r,'p0',4,now);assert.equal(r.effects.at(-1).kind,'bomb');assert.equal(r.effects.at(-1).affected.length,4);assert.ok(r.matched.includes(4));assert.notDeepEqual(r.deck,beforeBomb);
r=room();r.players[0].bananaPending=true;r.turn='p2';next(r,now+10);assert.equal(r.turn,'p0');assert.equal(r.flipped.length,1);assert.equal(r.effects.at(-1).kind,'banana');assert.equal(r.players[0].bananaPending,false);
r=room();r.players[0].freezePending=true;r.turn='p2';next(r,now+10);assert.equal(r.turn,'p1');assert.equal(r.effects.at(-1).kind,'freeze');assert.equal(r.effects.at(-1).playerId,'p0');assert.equal(r.players[0].freezePending,false);
r=room();start(r,3,3,now+1800,['bomb','banana','freeze']);assert.equal(r.deck.length,9);assert.equal(r.deck.filter(v=>v===-1).length,0);assert.equal(r.deck.filter(v=>v===-2).length,1);assert.equal(r.deck.filter(v=>v===-3).length,1);assert.equal(r.deck.filter(v=>v===-4).length,1);assert.equal(r.deck.filter(v=>v>=0).length,6);const hidden=view(r,'p0',1,now+1800).deck;assert.equal(hidden.filter(v=>v===null).length,9);
console.log('PASS turns, privacy, spectator promotion, reactions and item cards');
