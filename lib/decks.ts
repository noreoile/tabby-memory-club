export const DECKS = {
 tabby: {name:'狸花貓', image:'/cats-v2.png', description:'細緻虎斑，經典挑戰', edition:'01'},
 orange: {name:'橘貓', image:'/orange-cats-v1.png', description:'暖橘毛色，新的考驗', edition:'02'},
 abyssinian: {name:'阿比西尼亞貓', image:'/abyssinian-cats-v1.png', description:'大耳細臉，細看每個差別', edition:'03'},
} as const;
export type DeckSet = keyof typeof DECKS;
export function isDeckSet(value:unknown):value is DeckSet {return value==='tabby'||value==='orange'||value==='abyssinian'}
export function resolveDeckSet(value:unknown):DeckSet {return isDeckSet(value)?value:'tabby'}
