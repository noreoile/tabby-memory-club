import {DECKS} from './decks';
export const AVATAR_COUNT=36;
export function validAvatar(id:unknown):id is number{return typeof id==='number'&&Number.isInteger(id)&&id>=0&&id<AVATAR_COUNT}
export function avatarPhoto(value:number){const id=validAvatar(value)?value:0;const theme=(['tabby','orange','abyssinian'] as const)[Math.floor(id/12)];return {id:id%12,...DECKS[theme]}}
