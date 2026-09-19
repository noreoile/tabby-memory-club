export const DECKS = {
 tabby: {name:'狸花貓', image:'/cats-v2.png', description:'細緻虎斑，經典挑戰', edition:'01'},
 orange: {name:'橘貓', image:'/orange-cats-v1.png', description:'暖橘毛色，新的考驗', edition:'02'},
} as const;
export type DeckSet = keyof typeof DECKS;
export function isDeckSet(value:unknown):value is DeckSet {return value==='tabby'||value==='orange'}
export function resolveDeckSet(value:unknown):DeckSet {return isDeckSet(value)?value:'tabby'}
