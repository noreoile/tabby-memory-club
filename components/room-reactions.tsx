import {REACTION_EMOJIS} from '@/lib/game';

export function RoomReactions({disabled,onReact}:{disabled:boolean;onReact:(emoji:string)=>void}){
 return <div className="reaction-controls" aria-label="快速表情">
  <span>打氣</span>
  {REACTION_EMOJIS.map(emoji=><button type="button" key={emoji} disabled={disabled} aria-label={`傳送 ${emoji} 表情`} onClick={()=>onReact(emoji)}>{emoji}</button>)}
 </div>
}
