import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { UserDto } from './dto/user.dto';

@Injectable()
export class PeerWriter {
  constructor(private readonly configService: ConfigService) {}

  async writePeers(users: UserDto[]) {
    const content = users.map((user) => this.generatePeerConfig(user)).join('\n');
    await writeFile(join(this.configService.get('ASTERISK_CONFIG')!, 'pjsip-peers.conf'), content);
  }

  private generatePeerConfig(user: UserDto): string {
    return `
;=============== ENDPOINT: ${user.id}
[${user.id}]
type=endpoint
transport=transport-wss
webrtc=yes
context=VIP-PEERS
callerid=${user.name} <${user.id}>
language=pt_BR
named_call_group=${user.controlNumber}
named_pickup_group=${user.controlNumber}
dtmf_mode=rfc4733
disallow=all
allow=alaw
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

  private generatePassword(user: UserDto): string {
    return createHash('md5').update(`${user.id}:asterisk:IASMIN_WEBPHONE_${user.id}`).digest('hex');
  }
}
