import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SecurityService {
  constructor(private readonly jwtService: JwtService) {}

  private readonly logger = new Logger(SecurityService.name);

  generateToken(): string {
    return this.jwtService.sign({
      roles: ['super'],
    });
  }

  validateToken(token: string): boolean {
    try {
      this.jwtService.verify(token);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao validar token: ${error}`);
      return false;
    }
  }
}



