/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client } from 'ari-client';
import { Logger } from '@nestjs/common';

export async function externalMediaCall(ari: Client, channel: Channel) {
  await ari.start("externalMedia");

  function closeAllResources(){
    if (bridge) bridge.destroy();
    if (channel) channel.hangup();
    if (externalMediaChannel) externalMediaChannel.hangup();
  }

  const bridge = ari.Bridge();
  try{
    await bridge.create({type: 'mixing'});
    Logger.log(`Bridge ${bridge.id} criada`, 'RouterCallAppService');
  }catch (e) {
    Logger.error('Erro ao criar bridge', e.message, 'RouterCallAppService');
  }
  bridge.on('BridgeDestroyed', (bridgeDestroyed, bridge) => {
    closeAllResources();
  })

  channel.answer()
  bridge.addChannel({channel: channel.id})
    .catch((err) => Logger.error(`Adicionando canal ${channel.name} ao bridge`, err.message, 'RouterCallAppService'));

  const externalMediaChannel = ari.Channel();

  externalMediaChannel.on('StasisStart', (stasisStart, externalMediaChannel) => {
    bridge.addChannel({channel: externalMediaChannel.id})
      .catch((err) => Logger.error(`Adicionando canal ${externalMediaChannel.name} ao bridge`, err.message, 'RouterCallAppService'));
  })
  externalMediaChannel.on('StasisEnd', (stasisEnd, externalMediaChannel) => {
    closeAllResources();
  })

  externalMediaChannel.externalMedia({
    app: 'externalMedia',
    external_host: '127.0.0.1:9999',
    format: 'slin16',
  })
    .then(() => Logger.log('Chamada para externalMedia parece q foi', 'RouterCallAppService'))
    .catch((err) => Logger.error(`Erro ao chamar externalMedia`, err.message, 'RouterCallAppService'));

}
