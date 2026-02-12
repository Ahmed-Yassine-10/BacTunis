import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmotionalCheckInDto } from './dto/emotional-checkin.dto';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
    constructor(private studentsService: StudentsService) { }

    @Get('profile')
    @ApiOperation({ summary: 'Obtenir le profil de l\'élève connecté' })
    async getProfile(@CurrentStudent() student: { id: string }) {
        return this.studentsService.getProfile(student.id);
    }

    @Put('profile')
    @ApiOperation({ summary: 'Mettre à jour le profil' })
    async updateProfile(
        @CurrentStudent() student: { id: string },
        @Body() dto: UpdateProfileDto,
    ) {
        return this.studentsService.updateProfile(student.id, dto);
    }

    @Post('checkin')
    @ApiOperation({ summary: 'Enregistrer un check-in émotionnel' })
    async createCheckIn(
        @CurrentStudent() student: { id: string },
        @Body() dto: EmotionalCheckInDto,
    ) {
        return this.studentsService.createEmotionalCheckIn(student.id, dto);
    }

    @Get('checkin/history')
    @ApiOperation({ summary: 'Historique des check-ins émotionnels' })
    async getCheckInHistory(@CurrentStudent() student: { id: string }) {
        return this.studentsService.getEmotionalHistory(student.id);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Statistiques d\'étude' })
    async getStats(@CurrentStudent() student: { id: string }) {
        return this.studentsService.getStudyStats(student.id);
    }
}
