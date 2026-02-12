import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { UpdateTimetableSlotDto } from './dto/update-timetable-slot.dto';

@ApiTags('timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timetable')
export class TimetableController {
    constructor(private timetableService: TimetableService) {}

    @Get()
    @ApiOperation({ summary: 'Obtenir l\'emploi du temps hebdomadaire' })
    async getWeeklyTimetable(@CurrentStudent() student: { id: string }) {
        return this.timetableService.getWeeklyTimetable(student.id);
    }

    @Post()
    @ApiOperation({ summary: 'Ajouter un créneau à l\'emploi du temps' })
    async createSlot(
        @CurrentStudent() student: { id: string },
        @Body() dto: CreateTimetableSlotDto,
    ) {
        return this.timetableService.createSlot(student.id, dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Modifier un créneau' })
    async updateSlot(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
        @Body() dto: UpdateTimetableSlotDto,
    ) {
        return this.timetableService.updateSlot(student.id, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un créneau' })
    async deleteSlot(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        await this.timetableService.deleteSlot(student.id, id);
        return { message: 'Créneau supprimé' };
    }

    @Get('recommendations')
    @ApiOperation({ summary: 'Obtenir les recommandations de révision du jour' })
    async getRecommendations(@CurrentStudent() student: { id: string }) {
        return this.timetableService.getTodayRecommendations(student.id);
    }

    @Get('subject/:id/chapters')
    @ApiOperation({ summary: 'Obtenir les chapitres d\'une matière' })
    async getSubjectChapters(@Param('id') id: string) {
        return this.timetableService.getSubjectChapters(id);
    }
}
