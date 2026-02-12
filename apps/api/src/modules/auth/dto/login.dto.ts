import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'ahmed@example.com' })
    @IsEmail({}, { message: 'Veuillez entrer un email valide' })
    email: string;

    @ApiProperty({ example: 'motdepasse123' })
    @IsString()
    @MinLength(1, { message: 'Le mot de passe est requis' })
    password: string;
}
