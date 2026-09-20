import {useRef,useState} from 'react';
import {REACTIONS} from '@/lib/game';

export function RoomReactions({disabled,onReact}:{disabled:boolean;onReact:(reaction:string)=>Promise<boolean>}){
 const[feedback,setFeedback]=useState<{reaction:string;ok:boolean;key:number}|null>(null);
 const clearTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 async function react(reaction:string){
  setFeedback({reaction,ok:true,key:Date.now()});
  const ok=await onReact(reaction);
  setFeedback({reaction,ok,key:Date.now()});
  if(clearTimer.current)clearTimeout(clearTimer.current);
  clearTimer.current=setTimeout(()=>setFeedback(null),1600);
 }
 return <div className="reaction-controls" aria-label="迷因反應">
  <span>迷因</span>
  {REACTIONS.map(reaction=><button type="button" className={'meme-reaction-button '+(feedback?.reaction===reaction.id?'reaction-selected':'')} key={reaction.id} disabled={disabled} aria-label={`傳送「${reaction.label}」迷因`} onClick={()=>{void react(reaction.id)}}><img src={reaction.image} alt=""/><b>{reaction.label}</b></button>)}
  {feedback?<span key={feedback.key} className={'reaction-feedback '+(feedback.ok?'sent':'failed')} role="status">{feedback.ok?'迷因已送出':'未送出'}</span>:null}
 </div>
}
