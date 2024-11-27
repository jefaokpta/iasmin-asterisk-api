/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/27/24
 */

import { Injectable, Logger } from '@nestjs/common';
import { Invader } from '../models/invader';
import { exec, execSync } from 'node:child_process';
import { readFileSync, writeFile } from 'node:fs';
import { threadId } from 'node:worker_threads';

@Injectable()
export class AntiInvasionService {
  constructor() {}

  private readonly invaders = new Map<string, Invader>();
  private readonly blockedInvaders = new Map<string, Invader>();

  public antiInvasion(invader: Invader) {
    if (this.invaders.has(invader.ip)) {
      this.blockOrSumInvader(this.invaders.get(invader.ip)!);
    } else {
      this.invaders.set(invader.ip, invader);
    }
  }
  
  private blockOrSumInvader(invader: Invader) {
    if (invader.attempts > 5) {
      if (new Date().getTime() - invader.timestamp.getTime() < 60_000) {
        this.blockedInvaders.set(invader.ip, invader);
        return;
      }
      this.invaders.delete(invader.ip);
      return
    }
    this.invaders.set(invader.ip, {
      ...invader,
      attempts: invader.attempts + 1,
      timestamp: new Date(),
    });
  }

  public writeBlockedInvadersFile() {
    if (this.blockedInvaders.size === 0) return;
    Logger.log('Verificando invasores bloqueados...', `AntiInvasionService.writeBlockedInvadersFile-${threadId}`);
    const blockedInvadersList = Array.from(this.blockedInvaders.keys());
    if (JSON.stringify(blockedInvadersList) === JSON.stringify(this.getBlockedInvadersFromFile())){
      Logger.log('Nenhum invasor novo bloqueado', `AntiInvasionService.writeBlockedInvadersFile-${threadId}`);
      return;
    }
    writeFile('/tmp/blockedInvadersCandidates.json', JSON.stringify(blockedInvadersList), (error) => {
      if (error) Logger.error(error.message);
      this.blockInvadersIptables(blockedInvadersList);
    })
  }

  public resetBlockedInvaders() {
    this.blockedInvaders.clear();
    this.invaders.clear();
    try {
      exec('iptables -F INPUT');
    } catch (e) {
      Logger.error(e.message, 'AntiInvasionService.resetBlockedInvaders');
    }
  }

  private getBlockedInvadersFromFile(): string[] {
    try {
      return JSON.parse(readFileSync('/tmp/blockedInvadersCandidates.json').toString());
    } catch (error) {
      Logger.error(error.message, 'AntiInvasionService.getBlockedInvadersFromFile');
      return [];
    }
  }

  private blockInvadersIptables(blockedInvaders: string[]) {
    Logger.log(`Bloqueando invasores... ${blockedInvaders}`, `AntiInvasionService.blockInvadersIptables-${threadId}`);
    try{
      execSync('iptables -F INPUT')
      blockedInvaders.forEach((ip) => {
        exec(`iptables -I INPUT -s ${ip} -j DROP`, (error) => {
          if (error) Logger.error(error.message);
        })
      });
    } catch (e) {
      Logger.error(e.message, 'AntiInvasionService.blockInvadersIptables');
    }
  }


  
}