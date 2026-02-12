import { IsEnum, IsOptional, IsArray, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum LearningStyle {
    VISUAL = 'VISUAL',
    AUDITORY = 'AUDITORY',
    READING = 'READING',
    KINESTHETIC = 'KINESTHETIC',
}

enum StudyRhythm {
    SLOW = 'SLOW',
    MODERATE = 'MODERATE',
    INTENSIVE = 'INTENSIVE',
}

export class UpdateProfileDto {
    @ApiProperty({ enum: LearningStyle, required: false })
    @IsOptional()
    @IsEnum(LearningStyle)
    learningStyle?: LearningStyle;

    @ApiProperty({ type: [String], required: false, example: ['Mathématiques', 'Physique'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    strengths?: string[];

    @ApiProperty({ type: [String], required: false, example: ['Philosophie', 'Arabe'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    weaknesses?: string[];

    @ApiProperty({ type: [String], required: false, example: ['Avoir 16 au bac'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    goals?: string[];

    @ApiProperty({ enum: StudyRhythm, required: false })
    @IsOptional()
    @IsEnum(StudyRhythm)
    studyRhythm?: StudyRhythm;

    @ApiProperty({ required: false, minimum: 1, maximum: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    stressLevel?: number;
}
