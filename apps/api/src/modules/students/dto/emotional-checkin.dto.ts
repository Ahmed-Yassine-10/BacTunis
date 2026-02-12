import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum EmotionalState {
    GREAT = 'GREAT',
    GOOD = 'GOOD',
    OKAY = 'OKAY',
    STRESSED = 'STRESSED',
    OVERWHELMED = 'OVERWHELMED',
}

export class EmotionalCheckInDto {
    @ApiProperty({ enum: EmotionalState, example: 'GOOD' })
    @IsEnum(EmotionalState)
    state: EmotionalState;

    @ApiProperty({ required: false, example: 'Je me sens bien préparé pour le contrôle de demain' })
    @IsOptional()
    @IsString()
    note?: string;
}
