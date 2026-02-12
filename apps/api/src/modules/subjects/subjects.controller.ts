import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
    constructor(private subjectsService: SubjectsService) { }

    @Get()
    @ApiOperation({ summary: 'Obtenir toutes les matières' })
    async getAllSubjects() {
        return this.subjectsService.getAllSubjects();
    }

    @Get('my-subjects')
    @ApiOperation({ summary: 'Obtenir les matières de l\'élève selon sa filière' })
    async getMySubjects(@CurrentStudent() student: { branch: string }) {
        return this.subjectsService.getSubjectsByBranch(student.branch);
    }

    @Get('branch/:branch')
    @ApiOperation({ summary: 'Obtenir les matières par filière' })
    async getSubjectsByBranch(@Param('branch') branch: string) {
        return this.subjectsService.getSubjectsByBranch(branch);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtenir une matière avec ses chapitres' })
    async getSubject(@Param('id') id: string) {
        return this.subjectsService.getSubject(id);
    }

    @Get('chapters/:id')
    @ApiOperation({ summary: 'Obtenir un chapitre avec ses exercices' })
    async getChapter(@Param('id') id: string) {
        return this.subjectsService.getChapter(id);
    }

    @Get('chapters/:id/exercises')
    @ApiOperation({ summary: 'Obtenir les exercices d\'un chapitre' })
    @ApiQuery({ name: 'difficulty', required: false, enum: ['EASY', 'MEDIUM', 'HARD'] })
    async getExercises(
        @Param('id') chapterId: string,
        @Query('difficulty') difficulty?: string,
    ) {
        return this.subjectsService.getExercisesByChapter(chapterId, difficulty);
    }

    @Get('exercises/:id')
    @ApiOperation({ summary: 'Obtenir un exercice' })
    async getExercise(@Param('id') id: string) {
        return this.subjectsService.getExercise(id);
    }

    @Post('seed')
    @ApiOperation({ summary: 'Initialiser les matières du bac tunisien' })
    async seedSubjects() {
        return this.subjectsService.seedSubjects();
    }

    @Post('seed-chapters')
    @ApiOperation({ summary: 'Initialiser les chapitres du programme tunisien pour toutes les matières' })
    async seedChapters() {
        return this.subjectsService.seedChapters();
    }
}
