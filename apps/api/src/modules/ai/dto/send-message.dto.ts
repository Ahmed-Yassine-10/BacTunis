import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    conversationId?: string;

    @ApiProperty({ example: 'Explique-moi les dérivées en maths' })
    @IsString()
    content: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    isVoice?: boolean;

    @ApiProperty({ required: false, description: 'IDs of attached documents to include in context' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    documentIds?: string[];
}
