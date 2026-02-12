import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSummaryDto {
    @ApiProperty({ example: 'Contenu du chapitre sur les intégrales...' })
    @IsString()
    content: string;
}
