import { IsArray, IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';

export class User {
  @IsNumber()
  readonly id: number;

  @IsNotEmpty()
  readonly name: string;

  @IsNumberString()
  readonly controlNumber: string;

  @IsArray()
  readonly roles: string[];
}