import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { UpdateTimetableSlotDto } from './dto/update-timetable-slot.dto';

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

@Injectable()
export class TimetableService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get all timetable slots for a student (grouped by day)
     */
    async getWeeklyTimetable(studentId: string) {
        const slots = await this.prisma.timetableSlot.findMany({
            where: { studentId },
            include: {
                subject: {
                    include: {
                        chapters: {
                            orderBy: { order: 'asc' },
                        },
                    },
                },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });

        // Group by day
        const weeklySchedule = DAY_NAMES.map((dayName, index) => ({
            day: index,
            dayName,
            slots: slots.filter((s) => s.dayOfWeek === index),
        }));

        return weeklySchedule;
    }

    /**
     * Create a new timetable slot
     */
    async createSlot(studentId: string, dto: CreateTimetableSlotDto) {
        // Verify subject exists
        const subject = await this.prisma.subject.findUnique({
            where: { id: dto.subjectId },
        });
        if (!subject) {
            throw new NotFoundException('Matière non trouvée');
        }

        // Check for time conflicts on same day
        const existingSlots = await this.prisma.timetableSlot.findMany({
            where: { studentId, dayOfWeek: dto.dayOfWeek },
        });

        const hasConflict = existingSlots.some((slot) => {
            return dto.startTime < slot.endTime && dto.endTime > slot.startTime;
        });

        if (hasConflict) {
            throw new BadRequestException(
                'Conflit d\'horaire: un autre cours est déjà programmé à cette heure',
            );
        }

        return this.prisma.timetableSlot.create({
            data: {
                studentId,
                subjectId: dto.subjectId,
                dayOfWeek: dto.dayOfWeek,
                startTime: dto.startTime,
                endTime: dto.endTime,
                room: dto.room,
                teacher: dto.teacher,
            },
            include: {
                subject: true,
            },
        });
    }

    /**
     * Update a timetable slot
     */
    async updateSlot(studentId: string, slotId: string, dto: UpdateTimetableSlotDto) {
        const slot = await this.prisma.timetableSlot.findFirst({
            where: { id: slotId, studentId },
        });
        if (!slot) {
            throw new NotFoundException('Créneau non trouvé');
        }

        // Check for time conflicts if time changed
        if (dto.startTime || dto.endTime || dto.dayOfWeek !== undefined) {
            const dayToCheck = dto.dayOfWeek ?? slot.dayOfWeek;
            const startToCheck = dto.startTime ?? slot.startTime;
            const endToCheck = dto.endTime ?? slot.endTime;

            const existingSlots = await this.prisma.timetableSlot.findMany({
                where: { studentId, dayOfWeek: dayToCheck, NOT: { id: slotId } },
            });

            const hasConflict = existingSlots.some((s) => {
                return startToCheck < s.endTime && endToCheck > s.startTime;
            });

            if (hasConflict) {
                throw new BadRequestException(
                    'Conflit d\'horaire: un autre cours est déjà programmé à cette heure',
                );
            }
        }

        return this.prisma.timetableSlot.update({
            where: { id: slotId },
            data: dto,
            include: { subject: true },
        });
    }

    /**
     * Delete a timetable slot
     */
    async deleteSlot(studentId: string, slotId: string) {
        const slot = await this.prisma.timetableSlot.findFirst({
            where: { id: slotId, studentId },
        });
        if (!slot) {
            throw new NotFoundException('Créneau non trouvé');
        }

        return this.prisma.timetableSlot.delete({ where: { id: slotId } });
    }

    /**
     * Get today's schedule + AI recommendations for revision
     */
    async getTodayRecommendations(studentId: string) {
        // Get today's day (0=Monday in JS after conversion)
        const jsDay = new Date().getDay(); // 0=Sunday
        const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert: 0=Lundi, 5=Samedi, 6=Dimanche

        // Get today's slots
        const todaySlots = await this.prisma.timetableSlot.findMany({
            where: { studentId, dayOfWeek },
            include: {
                subject: {
                    include: {
                        chapters: { orderBy: { order: 'asc' } },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        // Get tomorrow's slots for preparation
        const tomorrowDay = (dayOfWeek + 1) % 6; // Wrap around (no Sunday)
        const tomorrowSlots = await this.prisma.timetableSlot.findMany({
            where: { studentId, dayOfWeek: tomorrowDay },
            include: {
                subject: {
                    include: {
                        chapters: { orderBy: { order: 'asc' } },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        // Count hours per subject this week
        const allSlots = await this.prisma.timetableSlot.findMany({
            where: { studentId },
            include: { subject: true },
        });

        const subjectHours: Record<string, { name: string; hours: number; coefficient: number }> = {};
        for (const slot of allSlots) {
            const [sh, sm] = slot.startTime.split(':').map(Number);
            const [eh, em] = slot.endTime.split(':').map(Number);
            const hours = (eh * 60 + em - sh * 60 - sm) / 60;

            if (!subjectHours[slot.subjectId]) {
                subjectHours[slot.subjectId] = {
                    name: slot.subject.name,
                    hours: 0,
                    coefficient: slot.subject.coefficient,
                };
            }
            subjectHours[slot.subjectId].hours += hours;
        }

        // Build recommendations: prioritize high-coefficient subjects with most class hours
        const recommendations = Object.entries(subjectHours)
            .map(([subjectId, data]) => ({
                subjectId,
                name: data.name,
                weeklyHours: Math.round(data.hours * 10) / 10,
                coefficient: data.coefficient,
                priority: data.coefficient * data.hours, // Higher = needs more revision
            }))
            .sort((a, b) => b.priority - a.priority);

        return {
            today: {
                dayName: DAY_NAMES[dayOfWeek] || 'Dimanche',
                slots: todaySlots,
            },
            tomorrow: {
                dayName: DAY_NAMES[tomorrowDay] || 'Dimanche',
                slots: tomorrowSlots,
            },
            recommendations,
            subjectHours: Object.values(subjectHours),
        };
    }

    /**
     * Get subject details with chapters for a specific subject from the timetable
     */
    async getSubjectChapters(subjectId: string) {
        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                chapters: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!subject) {
            throw new NotFoundException('Matière non trouvée');
        }

        return subject;
    }
}
