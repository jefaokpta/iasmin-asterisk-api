/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/19/24
 */

export class Cdr {
  readonly peer: string;
  readonly src: string;
  readonly destination: string;
  readonly callerId: string;
  readonly duration: number;
  readonly billableSeconds: number;
  readonly uniqueId: string;
  readonly disposition: string;
  readonly company: string;
  readonly startTime: string;
  readonly callRecord: string;
  readonly channel: string;
  readonly userfield: string;
  readonly destinationChannel: string;

  constructor(cdr: any) {
    this.peer = cdr.peer
    this.src = cdr.source;
    this.destination = cdr.destination;
    this.callerId = cdr.callerid;
    this.duration = Number(cdr.duration);
    this.billableSeconds = Number(cdr.billableseconds);
    this.uniqueId = cdr.uniqueid;
    this.disposition = cdr.disposition;
    this.company = cdr.company;
    this.startTime = cdr.starttime;
    this.callRecord = cdr.callrecord
    this.channel = cdr.channel
    this.userfield = cdr.userfield
    this.destinationChannel = cdr.destinationchannel
  }
}