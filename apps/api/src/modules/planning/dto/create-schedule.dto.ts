import { IsString, IsEnum, IsDateString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ScheduleType {
    SCHOOL = 'SCHOOL',
    REVISION = 'REVISION',
    PERSONAL = 'PERSONAL',
    LEISURE = 'LEISURE',
    EXAM = 'EXAM',
}

export class CreateScheduleDto {
    @ApiProperty({ example: 'Cours de Mathématiques' })
    @IsString()
    title: string;

    @ApiProperty({ required: false, example: 'Chapitre 5: Les intégrales' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: ScheduleType, example: 'SCHOOL' })
    @IsEnum(ScheduleType)
    type: ScheduleType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subjectId?: string;

    @ApiProperty({ example: '2024-02-10T08:00:00Z' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ example: '2024-02-10T10:00:00Z' })
    @IsDateString()
    endTime: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    @IsBoolean()
    recurring?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsObject()
    recurrence?: Record<string, any>;

    @ApiProperty({ required: false, example: '#3b82f6' })
    @IsOptional()
    @IsString()
    color?: string;
}
