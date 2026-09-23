import assert from 'node:assert/strict';

const origin='http://localhost:5173';
async function game(action,token,extra={}){
 const response=await fetch(origin+'/api/game',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({action,requestId:crypto.randomUUID(),...extra})});
 const data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data));
 return data;
}
async function voice(method,code,token,body,status=200){
 const response=await fetch(origin+'/api/voice'+(method==='GET'?`?code=${code}`:''),{method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify({code,...body}):undefined});
 const data=await response.json();
 assert.equal(response.status,status,JSON.stringify(data));
 return data;
}

const host=await game('create',null,{name:'Voice Host',avatar:0,deckSet:'tabby'});
const code=host.room.code,hostId=host.room.you;
const guest=await game('join',null,{code,name:'Voice Guest',avatar:1});
const guestId=guest.room.you;

const passivePresence=await voice('GET',code,host.token);
assert.equal(passivePresence.members.length,0,'checking voice presence must not join the microphone room');
await voice('POST',code,host.token,{action:'join'});
await voice('POST',code,guest.token,{action:'join'});
const presence=await voice('GET',code,host.token);
assert.deepEqual(new Set(presence.members.map(member=>member.id)),new Set([hostId,guestId]));

const offer='v=0\r\ns=voice-integration-test';
await voice('POST',code,host.token,{action:'signal',signalId:crypto.randomUUID(),targetId:guestId,kind:'offer',payload:offer});
const inbox=await voice('GET',code,guest.token);
assert.equal(inbox.signals.length,1);
assert.equal(inbox.signals[0].senderId,hostId);
assert.equal(inbox.signals[0].kind,'offer');
assert.equal(inbox.signals[0].payload,offer);

await voice('POST',code,null,{action:'join'},400);
await voice('POST',code,host.token,{action:'signal',signalId:crypto.randomUUID(),targetId:'missing-player',kind:'offer',payload:offer},400);
await voice('POST',code,guest.token,{action:'leave'});
const afterLeave=await voice('GET',code,host.token);
assert.equal(afterLeave.members.some(member=>member.id===guestId),false);

console.log('PASS authenticated voice presence, signaling and leave cleanup');
