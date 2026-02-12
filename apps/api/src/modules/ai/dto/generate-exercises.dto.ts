import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export class GenerateExercisesDto {
    @ApiProperty({ example: 'Les dérivées en mathématiques' })
    @IsString()
    topic: string;

    @ApiProperty({ enum: Difficulty, default: 'MEDIUM' })
    @IsOptional()
    @IsEnum(Difficulty)
    difficulty?: Difficulty = Difficulty.MEDIUM;

    @ApiProperty({ default: 3, minimum: 1, maximum: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    count?: number = 3;
}
