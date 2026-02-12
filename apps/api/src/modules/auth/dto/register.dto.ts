import { IsEmail, IsString, MinLength, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Grade {
    BAC = 'BAC',
    PREMIERE = 'PREMIERE',
    SECONDE = 'SECONDE',
}

enum Branch {
    SCIENCES = 'SCIENCES',
    LETTRES = 'LETTRES',
    ECONOMIE = 'ECONOMIE',
    TECHNIQUE = 'TECHNIQUE',
    INFORMATIQUE = 'INFORMATIQUE',
    SPORT = 'SPORT',
}

export class RegisterDto {
    @ApiProperty({ example: 'ahmed@example.com' })
    @IsEmail({}, { message: 'Veuillez entrer un email valide' })
    email: string;

    @ApiProperty({ example: 'motdepasse123' })
    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    password: string;

    @ApiProperty({ example: 'Ahmed' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Ben Ali' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: '2007-05-15' })
    @IsDateString()
    birthDate: string;

    @ApiProperty({ enum: Grade, example: 'BAC' })
    @IsEnum(Grade)
    grade: Grade;

    @ApiProperty({ enum: Branch, example: 'SCIENCES' })
    @IsEnum(Branch)
    branch: Branch;

    @ApiProperty({ example: 'Lycée Pilote Ariana', required: false })
    @IsOptional()
    @IsString()
    school?: string;
}
