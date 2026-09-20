export const DECKS = {
 abyssinian: {name:'阿比西尼亞貓', image:'/abyssinian-cats-v2.png', description:'花色、姿勢、表情更好認', edition:'03',difficulty:'簡單'},
 tabby: {name:'狸花貓', image:'/cats-v2.png', description:'細緻虎斑，經典挑戰', edition:'01',difficulty:'中等'},
 orange: {name:'橘貓', image:'/orange-cats-v1.png', description:'暖橘毛色，新的考驗', edition:'02',difficulty:'難'},
 // Keep the persisted slot ID so existing rooms and next-round selections remain valid.
 otters: {name:'黑白貓', image:'/tuxedo-cats-v1.png', description:'黑白小差別，細看鼻斑與白毛邊界', edition:'04',difficulty:'難'},
} as const;
export type DeckSet = keyof typeof DECKS;
export function isDeckSet(value:unknown):value is DeckSet {return value==='tabby'||value==='orange'||value==='abyssinian'||value==='otters'}
export function resolveDeckSet(value:unknown):DeckSet {return isDeckSet(value)?value:'tabby'}
