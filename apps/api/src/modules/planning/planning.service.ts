import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateStudySessionDto } from './dto/create-study-session.dto';

@Injectable()
export class PlanningService {
    constructor(private prisma: PrismaService) { }

    async createSchedule(studentId: string, dto: CreateScheduleDto) {
        return this.prisma.schedule.create({
            data: {
                studentId,
                title: dto.title,
                description: dto.description,
                type: dto.type,
                subjectId: dto.subjectId,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                recurring: dto.recurring || false,
                recurrence: dto.recurrence ? JSON.stringify(dto.recurrence) : null,
                color: dto.color,
            },
            include: {
                subject: true,
            },
        });
    }

    async getSchedules(studentId: string, startDate?: Date, endDate?: Date) {
        const where: any = { studentId };

        if (startDate && endDate) {
            where.startTime = {
                gte: startDate,
                lte: endDate,
            };
        }

        return this.prisma.schedule.findMany({
            where,
            include: {
                subject: true,
            },
            orderBy: { startTime: 'asc' },
        });
    }

    async getScheduleById(id: string, studentId: string) {
        const schedule = await this.prisma.schedule.findFirst({
            where: { id, studentId },
            include: { subject: true },
        });

        if (!schedule) {
            throw new NotFoundException('Planning non trouvé');
        }

        return schedule;
    }

    async updateSchedule(id: string, studentId: string, dto: UpdateScheduleDto) {
        await this.getScheduleById(id, studentId);

        return this.prisma.schedule.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type,
                subjectId: dto.subjectId,
                startTime: dto.startTime ? new Date(dto.startTime) : undefined,
                endTime: dto.endTime ? new Date(dto.endTime) : undefined,
                recurring: dto.recurring,
                recurrence: dto.recurrence ? JSON.stringify(dto.recurrence) : undefined,
                color: dto.color,
            },
            include: { subject: true },
        });
    }

    async deleteSchedule(id: string, studentId: string) {
        await this.getScheduleById(id, studentId);
        await this.prisma.schedule.delete({ where: { id } });
    }

    async getTodaySchedule(studentId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getSchedules(studentId, today, tomorrow);
    }

    async getWeekSchedule(studentId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return this.getSchedules(studentId, today, nextWeek);
    }

    // Study Sessions
    async createStudySession(studentId: string, dto: CreateStudySessionDto) {
        return this.prisma.studySession.create({
            data: {
                studentId,
                subjectId: dto.subjectId,
                chapterId: dto.chapterId,
                startTime: new Date(dto.startTime),
                endTime: dto.endTime ? new Date(dto.endTime) : null,
                duration: dto.duration || 0,
                completed: dto.completed || false,
                score: dto.score,
                notes: dto.notes,
            },
            include: {
                subject: true,
                chapter: true,
            },
        });
    }

    async getStudySessions(studentId: string, limit = 50) {
        return this.prisma.studySession.findMany({
            where: { studentId },
            include: {
                subject: true,
                chapter: true,
            },
            orderBy: { startTime: 'desc' },
            take: limit,
        });
    }

    async completeStudySession(id: string, studentId: string, score?: number) {
        const session = await this.prisma.studySession.findFirst({
            where: { id, studentId },
        });

        if (!session) {
            throw new NotFoundException('Session non trouvée');
        }

        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 60000);

        return this.prisma.studySession.update({
            where: { id },
            data: {
                endTime,
                duration,
                completed: true,
                score,
            },
            include: {
                subject: true,
                chapter: true,
            },
        });
    }

    // Recommendation for next study session based on spaced repetition
    async getStudyRecommendations(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: { profile: true },
        });

        if (!student) {
            throw new NotFoundException('Élève non trouvé');
        }

        // Get subjects for student's branch
        const subjects = await this.prisma.subject.findMany({
            where: {
                branches: { contains: student.branch },
            },
            include: { chapters: true },
        });

        // Get recent study sessions
        const recentSessions = await this.prisma.studySession.findMany({
            where: {
                studentId,
                startTime: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
            },
            include: { subject: true },
        });

        // Calculate study time per subject
        const studyTimeBySubject: Record<string, number> = {};
        recentSessions.forEach((session) => {
            const subjectId = session.subjectId;
            studyTimeBySubject[subjectId] = (studyTimeBySubject[subjectId] || 0) + session.duration;
        });

        // Prioritize weaknesses and less studied subjects
        const weaknessesStr = student.profile?.weaknesses || '[]';
        const weaknesses: string[] = typeof weaknessesStr === 'string' ? JSON.parse(weaknessesStr) : weaknessesStr;
        const recommendations = subjects
            .map((subject) => {
                let priority = 50;

                // Higher priority for weaknesses
                if (weaknesses.includes(subject.name)) {
                    priority += 30;
                }

                // Higher priority for less studied subjects
                const studyTime = studyTimeBySubject[subject.id] || 0;
                priority += Math.max(0, 20 - studyTime / 60);

                // Higher coefficient = higher priority
                priority += subject.coefficient * 5;

                return {
                    type: 'REVISION' as const,
                    title: `Réviser ${subject.name}`,
                    description: `Session de révision recommandée pour ${subject.name}`,
                    subject,
                    priority: Math.round(priority),
                    estimatedDuration: 45,
                };
            })
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5);

        return recommendations;
    }
}
