/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 4/3/25
 */
import { IsArray, IsNumberString } from 'class-validator';

export class Company {
  @IsNumberString()
  readonly controlNumber: string;

  @IsNumberString()
  readonly phone: string;

  @IsArray()
  readonly attendantCallUsers: string[];
}