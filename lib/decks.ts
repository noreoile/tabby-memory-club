export const DECKS = {
 tabby: {name:'狸花貓', image:'/cats-v2.png', description:'細緻虎斑，經典挑戰', edition:'01',difficulty:'中等'},
 orange: {name:'橘貓', image:'/orange-cats-v1.png', description:'暖橘毛色，新的考驗', edition:'02',difficulty:'困難'},
 abyssinian: {name:'阿比西尼亞貓', image:'/abyssinian-cats-v2.png', description:'花色、姿勢、表情更好認', edition:'03',difficulty:'簡單'},
 otters: {name:'水獺＋海獺', image:'/otters-v1.png', description:'兩種水獺，細看臉型與毛色', edition:'04',difficulty:'中等'},
} as const;
export type DeckSet = keyof typeof DECKS;
export function isDeckSet(value:unknown):value is DeckSet {return value==='tabby'||value==='orange'||value==='abyssinian'||value==='otters'}
export function resolveDeckSet(value:unknown):DeckSet {return isDeckSet(value)?value:'tabby'}
