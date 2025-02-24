import { Injectable } from "@nestjs/common";
import { AntiInvasionService } from "./anti-invasion.service";
import { AmiConnectionService } from "./ami.connection.service";

@Injectable()
export class AmiService {
  constructor(
    private readonly antiInvasionService: AntiInvasionService,
    private readonly amiConnectionService: AmiConnectionService
  ) {}

  writeBlockedInvadersFile() {
    this.antiInvasionService.writeBlockedInvadersFile();
  }

  resetBlockedInvaders() {
    this.antiInvasionService.resetBlockedInvaders();
  }

  pjsipReload() {
    this.amiConnectionService.pjsipReload();
  }
  
}
