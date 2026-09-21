"use client";
import {DECKS,type DeckSet,resolveDeckSet,cardPhotoStyle} from '@/lib/decks';
import {ITEM_CARDS,type ItemCard} from '@/lib/game';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Checkbox} from '@/components/ui/checkbox';
import {AvatarImage} from '@/components/avatar-picker';

export type Setup={deckSet:DeckSet;rows:number;cols:number;itemCards:ItemCard[]};
type ResultPlayer={id:string;name:string;avatar:number;score:number;spectator?:boolean};

export function ItemCardPicker({value,onChange,disabled=false,compact=false}:{value:ItemCard[];onChange:(value:ItemCard[])=>void;disabled?:boolean;compact?:boolean}){
 function toggle(kind:ItemCard,checked:boolean){onChange(checked?[...value,kind]:value.filter(item=>item!==kind))}
 return <div className={'item-picker '+(compact?'compact':'')} role="group" aria-label="選擇道具卡">{(Object.keys(ITEM_CARDS) as ItemCard[]).map(kind=>{const item=ITEM_CARDS[kind],checked=value.includes(kind);return <label key={kind} className={'item-option '+(checked?'selected':'')}><Checkbox checked={checked} disabled={disabled} onCheckedChange={state=>toggle(kind,state===true)} aria-label={`加入${item.name}`}/><img src={item.image} alt=""/><span><strong>{item.name}</strong><small>{item.description}</small></span></label>})}</div>
}

export function RoomSetup({setup,isHost,finished,online,busy,connected,results=[],onChange,onStart}:{setup:Setup;isHost:boolean;finished:boolean;online:number;busy:boolean;connected:boolean;results?:ResultPlayer[];onChange:(setup:Setup)=>void;onStart:()=>void}){
 const disabled=!isHost||busy||!connected;
 const ranked=[...results].filter(player=>!player.spectator).sort((a,b)=>b.score-a.score),totalScore=ranked.reduce((sum,player)=>sum+player.score,0);
 const cells=setup.rows*setup.cols,pairs=Math.floor((cells-setup.itemCards.length)/2),hasRest=(cells-setup.itemCards.length)%2===1;
 return <div className="round-setup">{finished?<section className="round-results" aria-label="本局排行榜"><div className="results-summary"><span>本局總分</span><strong>{totalScore}</strong><small>分</small></div><div className="podium">{ranked.slice(0,3).map((player,index)=><div className={'podium-place place-'+(index+1)} key={player.id}><span className="rank-number">{index+1}</span><div className="podium-avatar"><AvatarImage id={player.avatar}/></div><strong>{player.name}</strong><span>{player.score} 分</span></div>)}</div>{ranked.length>3?<div className="remaining-results">{ranked.slice(3).map((player,index)=><span key={player.id}>{index+4}. {player.name} · {player.score} 分</span>)}</div>:null}</section>:null}<div className="setup-heading"><div><h2>{finished?'下一局，換個挑戰':'準備開始遊戲'}</h2><p>{isHost?'選好牌組、牌數和道具，就能直接開始。':'房主正在選擇牌組、牌數和道具，準備好就會開始。'}</p></div></div>
 <div className="setup-start"><button className="primary" disabled={disabled||online<2} onClick={onStart}>{!isHost?'等待房主開始':online<2?'等待朋友加入（至少 2 人）':busy?'正在同步…':finished?'開始下一局':'開始遊戲'}</button><span>{online} 人在線 · {setup.rows} × {setup.cols} · {DECKS[setup.deckSet].name}（{DECKS[setup.deckSet].difficulty}）</span></div>
 <label>這局使用的牌組</label><RadioGroup className="setup-decks" value={setup.deckSet} disabled={disabled} onValueChange={v=>onChange({...setup,deckSet:resolveDeckSet(v)})} aria-label="下一局牌組">{(Object.keys(DECKS) as DeckSet[]).map(key=><label key={key} className={'deck-option '+(key===setup.deckSet?'selected':'')}><RadioGroupItem value={key} aria-label={DECKS[key].name+'，'+DECKS[key].difficulty}/><div className="deck-thumbnail"><div className="cat" style={cardPhotoStyle(key,0)}/></div><span><strong>{DECKS[key].name}</strong><small className="difficulty">{DECKS[key].difficulty}</small></span></label>)}</RadioGroup>
 <label>加入道具卡（可複選）</label><ItemCardPicker value={setup.itemCards} disabled={disabled} onChange={itemCards=>onChange({...setup,itemCards})}/>
 <div className="setup-size"><label>棋盤大小</label>{(['rows','cols'] as const).map((key,i)=><Select key={key} value={String(setup[key])} disabled={disabled} onValueChange={v=>onChange({...setup,[key]:Number(v)})}><SelectTrigger aria-label={i?'下一局列數':'下一局行數'}><SelectValue/></SelectTrigger><SelectContent>{Array.from({length:7},(_,i)=><SelectItem key={i} value={String(i+2)}>{i+2} {key==='rows'?'行':'列'}</SelectItem>)}</SelectContent></Select>)}</div><p className="note">{pairs} 組配對{setup.itemCards.length?` · ${setup.itemCards.length} 張道具`:''}{hasRest?' · 1 格休息':''} · 配對成功可繼續翻牌</p></div>
}
