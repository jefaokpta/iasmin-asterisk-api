import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SecurityService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(): string {
    return this.jwtService.sign({
      roles: ['super'],
    });
  }
}



