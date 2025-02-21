import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "./model/user.model";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
@Injectable()
export class PeerWriter {

    constructor(private readonly configService: ConfigService) {}

    writePeers(users: User[]) {
        const content = users.map(user => this.generatePeerConfig(user)).join('\n');
        writeFile(join(this.configService.get('ASTERISK_CONFIG')!, 'pjsip-peers.conf'), content);
    }

    private generatePeerConfig(user: User): string {
        return `
;=============== ENDPOINT: ${user.id}
[${user.id}]
type=endpoint
transport=transport-wss
webrtc=yes
context=VIP-PEERS
callerid=${user.name} <${user.id}>
language=pt_BR
call_group=${user.controlNumber}
pickup_group=${user.controlNumber}
dtmf_mode=rfc4733
disallow=all
allow=g722
auth=${user.id}
aors=${user.id}
set_var=CDR(company)=${user.controlNumber}
set_var=CDR(peer)=${user.id}
set_var=CALL_LIMIT=2
set_var=GROUP()=${user.id}
set_var=__TRANSFER_CONTEXT=TRANSFERING

;=============== AORS: ${user.id}
[${user.id}]
type=aor
qualify_frequency=0
max_contacts=2

;=============== AUTH: ${user.id}
[${user.id}]
type=auth
auth_type=md5
username=${user.id}
md5_cred=${this.generatePassword(user)}
;=============== FIM: ${user.id}

`.trim();
    }

    private generatePassword(user: User): string {
        const SECRET_PEER_KEY = this.configService.get('SECRET_PEER_KEY')!;
        return createHash('md5').update(`${user.id}:asterisk:${SECRET_PEER_KEY}:${user.id}:${user.controlNumber}`).digest('hex');
    }

}

/**
 * 
 * ;=============== ENDPOINT: 10
[10]
type=endpoint
transport=transport-wss
webrtc=yes
context=VIP-PEERS
callerid=Iasmin Jefones <10>
language=pt_BR
call_group=22 CN
pickup_group=1 CN
dtmf_mode=rfc4733
disallow=all
allow=g722
auth=10
aors=10
set_var=CDR(company)=100023 CN
set_var=CDR(peer)=10
set_var=CALL_LIMIT=2
set_var=GROUP()=10
set_var=__TRANSFER_CONTEXT=TRANSFERING
;=============== AORS: 10
[10]
type=aor
qualify_frequency=0
max_contacts=2
;=============== AUTH: 1001004
[10]
type=auth
auth_type=md5
username=10
md5_cred=2a29c5184840f41a09ebb1e6c46affbe
;=============== FIM: 1001004
 * 
 */
