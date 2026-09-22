import {useEffect,useRef,useState} from 'react';
import {REACTIONS} from '@/lib/game';

export function RoomReactions({disabled,onReact}:{disabled:boolean;onReact:(reaction:string)=>Promise<boolean>}){
 const[feedback,setFeedback]=useState<{reaction:string;ok:boolean;key:number}|null>(null);
 const[open,setOpen]=useState(false);
 const clearTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const menuRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  function close(event:MouseEvent){if(!menuRef.current?.contains(event.target as Node))setOpen(false)}
  function escape(event:KeyboardEvent){if(event.key==='Escape')setOpen(false)}
  document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);if(clearTimer.current)clearTimeout(clearTimer.current)};
 },[]);
 async function react(reaction:string){
  setOpen(false);
  setFeedback({reaction,ok:true,key:Date.now()});
  const ok=await onReact(reaction);
  setFeedback({reaction,ok,key:Date.now()});
  if(clearTimer.current)clearTimeout(clearTimer.current);
  clearTimer.current=setTimeout(()=>setFeedback(null),1600);
 }
 return <div className="reaction-controls" ref={menuRef}>
  <button type="button" className="reaction-menu-trigger" disabled={disabled} aria-haspopup="true" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><span>表情</span><small>{REACTIONS.length}</small></button>
  {open?<div className="reaction-panel" aria-label="選擇圖片表情"><div className="reaction-panel-heading"><strong>選一個表情</strong><span>會顯示在你的頭像旁</span></div><div className="reaction-grid">{REACTIONS.map((reaction,index)=><button type="button" className={'meme-reaction-button '+(feedback?.reaction===reaction.id?'reaction-selected':'')} key={reaction.id} disabled={disabled} aria-label={`傳送第 ${index+1} 張表情圖片`} onClick={()=>{void react(reaction.id)}}><img src={reaction.image} alt=""/></button>)}</div></div>:null}
  {feedback?<span key={feedback.key} className={'reaction-feedback '+(feedback.ok?'sent':'failed')} role="status">{feedback.ok?'表情已送出':'未送出'}</span>:null}
 </div>
}
