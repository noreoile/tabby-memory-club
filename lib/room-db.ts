import {env} from 'cloudflare:workers';
export function roomDb(){if(!env.DB)throw Error('遊戲暫時無法連線，請稍後重試');return env.DB.withSession('first-primary')}
