"use client";
import {DECKS,type DeckSet,resolveDeckSet,cardPhotoStyle} from '@/lib/decks';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
export type Setup={deckSet:DeckSet;rows:number;cols:number};
export function RoomSetup({setup,isHost,finished,online,busy,connected,onChange,onStart}:{setup:Setup;isHost:boolean;finished:boolean;online:number;busy:boolean;connected:boolean;onChange:(setup:Setup)=>void;onStart:()=>void}){
 const disabled=!isHost||busy||!connected;
 return <div className="round-setup"><div className="setup-heading"><div><h2>{finished?'下一局，換個挑戰':'準備開始遊戲'}</h2><p>{isHost?'選好牌組和牌數，就能直接開始。':'房主正在選擇牌組與牌數，準備好就會開始。'}</p></div></div>
 <div className="setup-start"><button className="primary" disabled={disabled||online<2} onClick={onStart}>{!isHost?'等待房主開始':online<2?'等待朋友加入（至少 2 人）':busy?'正在同步…':finished?'開始下一局':'開始遊戲'}</button><span>{online} 人在線 · {setup.rows} × {setup.cols} · {DECKS[setup.deckSet].name}（{DECKS[setup.deckSet].difficulty}）</span></div>
 <label>這局使用的牌組</label><RadioGroup className="setup-decks" value={setup.deckSet} disabled={disabled} onValueChange={v=>onChange({...setup,deckSet:resolveDeckSet(v)})} aria-label="下一局牌組">{(Object.keys(DECKS) as DeckSet[]).map(key=><label key={key} className={'deck-option '+(key===setup.deckSet?'selected':'')}><RadioGroupItem value={key} aria-label={DECKS[key].name+'，'+DECKS[key].difficulty}/><div className="deck-thumbnail"><div className="cat" style={cardPhotoStyle(key,0)}/></div><span><strong>{DECKS[key].name}</strong><small className="difficulty">{DECKS[key].difficulty}</small></span></label>)}</RadioGroup>
 <div className="setup-size"><label>棋盤大小</label>{(['rows','cols'] as const).map((key,i)=><Select key={key} value={String(setup[key])} disabled={disabled} onValueChange={v=>onChange({...setup,[key]:Number(v)})}><SelectTrigger aria-label={i?'下一局列數':'下一局行數'}><SelectValue/></SelectTrigger><SelectContent>{Array.from({length:7},(_,i)=><SelectItem key={i} value={String(i+2)}>{i+2} {key==='rows'?'行':'列'}</SelectItem>)}</SelectContent></Select>)}</div><p className="note">{Math.floor(setup.rows*setup.cols/2)} 組配對{setup.rows*setup.cols%2?' · 中央 1 格休息':''} · 配對成功可繼續翻牌</p></div>
}
