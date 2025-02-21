import { IsNotEmpty, IsNumber } from "class-validator";

export class UserDto {
    @IsNumber()
    readonly id: number;
    @IsNotEmpty()
    readonly name: string;
    @IsNumber()
    readonly controlNumber: number;
}