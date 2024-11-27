/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/27/24
 */

export class Invader {
  readonly ip: string;
  readonly attempts: number;
  readonly timestamp: Date;

  constructor(invalidAccountId: any) {
    this.ip = invalidAccountId.remoteaddress.split("/")[2]
    this.attempts = 0
    this.timestamp = new Date();
  }

}