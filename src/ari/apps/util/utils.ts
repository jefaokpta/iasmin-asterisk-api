/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 4/7/25
 */
import { ChannelLeg } from './enus/channel-leg.enum';

export function recordName(channelId: string, channelLeg: ChannelLeg) {
  return `${channelId.replace('.', '-')}-${channelLeg}`;
}