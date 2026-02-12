import { IsString, IsDateString, IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudySessionDto {
    @ApiProperty()
    @IsString()
    subjectId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    chapterId?: string;

    @ApiProperty({ example: '2024-02-10T14:00:00Z' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty({ required: false, default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    duration?: number;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @ApiProperty({ required: false, minimum: 0, maximum: 100 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    score?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
