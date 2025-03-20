import { Injectable, Logger } from "@nestjs/common";
import { Bridge, Channel, Client } from 'ari-client';

@Injectable()
export class CallAction {

    answerChannel(channel: Channel) {
        channel.answer()
            .catch((err) => Logger.error(`Erro ao atender canal ${channel.name} ${err.message}`, 'CallAction.answerChannel'));
    }

    ringChannel(channel: Channel) {
        channel.ring()
            .catch((err) => Logger.error(`Erro ao iniciar ring do canal ${channel.name} ${err.message}`, 'CallAction.ringChannel'));
    }

    hangupChannel(channel: Channel) {
        channel.hangup()
            .catch((err) => Logger.error(`Erro ao desligar canal ${channel.name} ${err.message}`, 'CallAction.hangupChannel'));
    }

    stasisEndChannelA(channelA: Channel, channelB: Channel) {
        Logger.log(`Canal A ${channelA.name} finalizou a chamada`, 'CallAction.stasisEndChannelA');
        this.hangupChannel(channelB);
    }
    
    stasisEndChannelB(channelA: Channel, channelB: Channel, bridge: Bridge) {
        Logger.log(`Canal B ${channelB.name} finalizou a chamada`, 'CallAction.stasisEndChannelB');
        this.hangupChannel(channelA);
        this.bridgeDestroy(bridge, channelB);
    }

    async createBridgeForChannels(ari: Client, channelA: Channel, channelB: Channel) {
        const bridge = ari.Bridge();

        this.answerChannel(channelA);

        channelB.on('StasisEnd', (event, channelB) => {
            this.stasisEndChannelB(channelA, channelB, bridge);
        })

        await bridge.create({type: 'mixing'})
            .catch((err) => {Logger.error('Erro ao criar bridge', err.message, 'CallAction.createBridgeForChannels')});

        this.addChannelsToBridge(channelA, channelB, bridge);

        bridge.record({
            name: 'nao_nomeia_a_gravacao',
            format: 'sln',
        }, ari.LiveRecording(channelA.id.replace('.', '-')))
            .catch((err) => Logger.error('Erro ao gravar chamada', err.message, 'CallAction.createBridgeForChannels'));
    }
    
    private bridgeDestroy(bridge: Bridge, channel: Channel) {
        bridge.destroy()
            .catch((err) => Logger.error(`Erro ao destruir bridge do canal ${channel.name} ${err.message}`, 'CallAction.bridgeDestroy'));
    }

    private addChannelsToBridge(channelA: Channel, channelB: Channel, bridge: Bridge) {
        bridge.addChannel({ channel: [channelA.id, channelB.id] })
            .catch((err) => Logger.error(`Erro ao adicionar canais ${channelA.name} e ${channelB.name} à bridge ${bridge.id} ${err.message}`, 'CallAction.addChannelsToBridge'));
    }

}