import {useRef,useState} from 'react';
import {REACTION_EMOJIS} from '@/lib/game';

export function RoomReactions({disabled,onReact}:{disabled:boolean;onReact:(emoji:string)=>Promise<boolean>}){
 const[feedback,setFeedback]=useState<{emoji:string;ok:boolean;key:number}|null>(null);
 const clearTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 async function react(emoji:string){
  setFeedback({emoji,ok:true,key:Date.now()});
  const ok=await onReact(emoji);
  setFeedback({emoji,ok,key:Date.now()});
  if(clearTimer.current)clearTimeout(clearTimer.current);
  clearTimer.current=setTimeout(()=>setFeedback(null),1600);
 }
 return <div className="reaction-controls" aria-label="快速表情">
  <span>打氣</span>
  {REACTION_EMOJIS.map(emoji=><button type="button" className={feedback?.emoji===emoji?'reaction-selected':''} key={emoji} disabled={disabled} aria-label={`傳送 ${emoji} 表情`} onClick={()=>{void react(emoji)}}>{emoji}</button>)}
  {feedback?<span key={feedback.key} className={'reaction-feedback '+(feedback.ok?'sent':'failed')} role="status">{feedback.ok?`${feedback.emoji} 已送出`:'未送出'}</span>:null}
 </div>
}
