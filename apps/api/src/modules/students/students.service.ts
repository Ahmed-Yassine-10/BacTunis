import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmotionalCheckInDto } from './dto/emotional-checkin.dto';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    async getProfile(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                profile: true,
            },
        });

        if (!student) {
            throw new NotFoundException('Élève non trouvé');
        }

        const { password, ...result } = student;
        return result;
    }

    async updateProfile(studentId: string, dto: UpdateProfileDto) {
        // Ensure profile exists
        await this.prisma.studentProfile.upsert({
            where: { studentId },
            create: {
                studentId,
                learningStyle: dto.learningStyle,
                strengths: JSON.stringify(dto.strengths || []),
                weaknesses: JSON.stringify(dto.weaknesses || []),
                goals: JSON.stringify(dto.goals || []),
                studyRhythm: dto.studyRhythm,
                stressLevel: dto.stressLevel,
            },
            update: {
                learningStyle: dto.learningStyle,
                strengths: dto.strengths ? JSON.stringify(dto.strengths) : undefined,
                weaknesses: dto.weaknesses ? JSON.stringify(dto.weaknesses) : undefined,
                goals: dto.goals ? JSON.stringify(dto.goals) : undefined,
                studyRhythm: dto.studyRhythm,
                stressLevel: dto.stressLevel,
            },
        });

        return this.getProfile(studentId);
    }

    async createEmotionalCheckIn(studentId: string, dto: EmotionalCheckInDto) {
        const checkIn = await this.prisma.emotionalCheckIn.create({
            data: {
                studentId,
                state: dto.state,
                note: dto.note,
            },
        });

        // Update stress level in profile based on emotional state
        const stressMapping: Record<string, number> = {
            GREAT: 2,
            GOOD: 4,
            OKAY: 5,
            STRESSED: 7,
            OVERWHELMED: 9,
        };

        await this.prisma.studentProfile.upsert({
            where: { studentId },
            create: {
                studentId,
                stressLevel: stressMapping[dto.state] || 5,
                strengths: '[]',
                weaknesses: '[]',
                goals: '[]',
            },
            update: {
                stressLevel: stressMapping[dto.state] || 5,
            },
        });

        return checkIn;
    }

    async getEmotionalHistory(studentId: string, limit = 30) {
        return this.prisma.emotionalCheckIn.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getStudyStats(studentId: string) {
        const sessions = await this.prisma.studySession.findMany({
            where: { studentId },
            include: {
                subject: true,
            },
            orderBy: { startTime: 'desc' },
            take: 100,
        });

        const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
        const completedSessions = sessions.filter((s) => s.completed).length;
        const averageScore =
            sessions.filter((s) => s.score).reduce((sum, s) => sum + (s.score || 0), 0) /
            sessions.filter((s) => s.score).length || 0;

        // Group by subject
        const bySubject = sessions.reduce((acc, session) => {
            const subjectName = session.subject?.name || 'Autre';
            if (!acc[subjectName]) {
                acc[subjectName] = { duration: 0, sessions: 0 };
            }
            acc[subjectName].duration += session.duration;
            acc[subjectName].sessions += 1;
            return acc;
        }, {} as Record<string, { duration: number; sessions: number }>);

        return {
            totalDuration,
            totalSessions: sessions.length,
            completedSessions,
            averageScore: Math.round(averageScore),
            bySubject,
        };
    }
}
