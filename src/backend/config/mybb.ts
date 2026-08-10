/**
 * MyBB Bridge Configuration — Forum bridge credentials (optional).
 */
import { env } from './env';

export const mybbConfig = {
  botPassword: env.MYBB_BOT_PASSWORD ?? null,
  bridgeSecret: env.MIST_BRIDGE_SECRET ?? null,
};