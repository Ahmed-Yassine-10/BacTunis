import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, Matches } from 'class-validator';

export class CreateTimetableSlotDto {
    @ApiProperty({ description: 'ID de la matière' })
    @IsString()
    subjectId: string;

    @ApiProperty({ description: 'Jour de la semaine (0=Lundi, 5=Samedi)', minimum: 0, maximum: 5 })
    @IsInt()
    @Min(0)
    @Max(5)
    dayOfWeek: number;

    @ApiProperty({ description: 'Heure de début (HH:mm)', example: '08:00' })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Format HH:mm requis' })
    startTime: string;

    @ApiProperty({ description: 'Heure de fin (HH:mm)', example: '09:00' })
    @IsString()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Format HH:mm requis' })
    endTime: string;

    @ApiPropertyOptional({ description: 'Salle de cours' })
    @IsString()
    room?: string;

    @ApiPropertyOptional({ description: 'Nom du professeur' })
    @IsString()
    teacher?: string;
}
