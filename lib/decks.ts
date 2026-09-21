export const DECKS = {
 abyssinian: {name:'阿比西尼亞貓', image:'/abyssinian-cats-v2.png', description:'花色、姿勢、表情更好認', edition:'03',difficulty:'簡單'},
 tabby: {name:'狸花貓', image:'/cats-v2.png', description:'細緻虎斑，經典挑戰', edition:'01',difficulty:'中等'},
 // Keep the persisted slot ID so existing rooms and next-round selections remain valid.
 otters: {name:'黑白貓', image:'/tuxedo-cats-v2.png', description:'黑臉白胸，從幼貓到年長貓', edition:'04',difficulty:'中等'},
 calico: {name:'三花貓', image:'/calico-cats-v1.png', description:'三色花紋，表情有點鬧', edition:'05',difficulty:'中等'},
 orange: {name:'橘貓', image:'/orange-cats-v1.png', description:'暖橘毛色，新的考驗', edition:'02',difficulty:'難'},
 black: {name:'黑貓', image:'/black-cats-v1.png', description:'黑得很像，偶爾偷偷搞笑', edition:'06',difficulty:'難'},
} as const;
export type DeckSet = keyof typeof DECKS;
export function isDeckSet(value:unknown):value is DeckSet {return value==='tabby'||value==='orange'||value==='abyssinian'||value==='otters'||value==='calico'||value==='black'}
export function resolveDeckSet(value:unknown):DeckSet {return isDeckSet(value)?value:'tabby'}
// The reference-based sheet has unequal row heights; crop a square inside each
// portrait so card faces and enlarged views never show the adjacent photo.
export function cardPhotoStyle(deckSet:DeckSet,id:number){
 const image={backgroundImage:`url(${DECKS[deckSet].image})`};
 if(deckSet!=='otters')return {...image,backgroundSize:'600% 600%',backgroundPosition:`${id%6*20}% ${Math.floor(id/6)*20}%`};
 const boundaries=[0,202,402,604,805,1010,1254],row=Math.floor(id/6);
 const height=boundaries[row+1]-boundaries[row],size=Math.min(209,height)-6;
 const x=(id%6)*209+(209-size)/2,y=boundaries[row]+(height-size)/2;
 return {...image,backgroundSize:`${1254/size*100}% ${1254/size*100}%`,backgroundPosition:`${x/(1254-size)*100}% ${y/(1254-size)*100}%`};
}
