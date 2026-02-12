import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateStudySessionDto } from './dto/create-study-session.dto';

@ApiTags('planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('planning')
export class PlanningController {
    constructor(private planningService: PlanningService) { }

    @Post('schedules')
    @ApiOperation({ summary: 'Créer un nouvel événement' })
    async createSchedule(
        @CurrentStudent() student: { id: string },
        @Body() dto: CreateScheduleDto,
    ) {
        return this.planningService.createSchedule(student.id, dto);
    }

    @Get('schedules')
    @ApiOperation({ summary: 'Obtenir tous les événements' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async getSchedules(
        @CurrentStudent() student: { id: string },
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.planningService.getSchedules(
            student.id,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('schedules/today')
    @ApiOperation({ summary: 'Obtenir le planning du jour' })
    async getTodaySchedule(@CurrentStudent() student: { id: string }) {
        return this.planningService.getTodaySchedule(student.id);
    }

    @Get('schedules/week')
    @ApiOperation({ summary: 'Obtenir le planning de la semaine' })
    async getWeekSchedule(@CurrentStudent() student: { id: string }) {
        return this.planningService.getWeekSchedule(student.id);
    }

    @Get('schedules/:id')
    @ApiOperation({ summary: 'Obtenir un événement par ID' })
    async getScheduleById(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        return this.planningService.getScheduleById(id, student.id);
    }

    @Put('schedules/:id')
    @ApiOperation({ summary: 'Mettre à jour un événement' })
    async updateSchedule(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
        @Body() dto: UpdateScheduleDto,
    ) {
        return this.planningService.updateSchedule(id, student.id, dto);
    }

    @Delete('schedules/:id')
    @ApiOperation({ summary: 'Supprimer un événement' })
    async deleteSchedule(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        await this.planningService.deleteSchedule(id, student.id);
        return { message: 'Événement supprimé' };
    }

    // Study Sessions
    @Post('sessions')
    @ApiOperation({ summary: 'Démarrer une session d\'étude' })
    async createStudySession(
        @CurrentStudent() student: { id: string },
        @Body() dto: CreateStudySessionDto,
    ) {
        return this.planningService.createStudySession(student.id, dto);
    }

    @Get('sessions')
    @ApiOperation({ summary: 'Obtenir l\'historique des sessions' })
    async getStudySessions(@CurrentStudent() student: { id: string }) {
        return this.planningService.getStudySessions(student.id);
    }

    @Put('sessions/:id/complete')
    @ApiOperation({ summary: 'Terminer une session d\'étude' })
    async completeStudySession(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
        @Body('score') score?: number,
    ) {
        return this.planningService.completeStudySession(id, student.id, score);
    }

    // Recommendations
    @Get('recommendations')
    @ApiOperation({ summary: 'Obtenir des recommandations de révision' })
    async getRecommendations(@CurrentStudent() student: { id: string }) {
        return this.planningService.getStudyRecommendations(student.id);
    }
}
