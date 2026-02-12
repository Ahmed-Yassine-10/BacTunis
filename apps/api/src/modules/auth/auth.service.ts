import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if email exists
        const existingStudent = await this.prisma.student.findUnique({
            where: { email: dto.email },
        });

        if (existingStudent) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create student
        const student = await this.prisma.student.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: dto.firstName,
                lastName: dto.lastName,
                birthDate: new Date(dto.birthDate),
                grade: dto.grade,
                branch: dto.branch,
                school: dto.school,
                profile: {
                    create: {
                        strengths: '[]',
                        weaknesses: '[]',
                        goals: '[]',
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                grade: true,
                branch: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(student.id);

        return {
            student,
            ...tokens,
        };
    }

    async login(dto: LoginDto) {
        const student = await this.prisma.student.findUnique({
            where: { email: dto.email },
        });

        if (!student) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, student.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        const tokens = await this.generateTokens(student.id);

        return {
            student: {
                id: student.id,
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                grade: student.grade,
                branch: student.branch,
            },
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { student: true },
        });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new UnauthorizedException('Token invalide ou expiré');
        }

        // Delete old refresh token
        await this.prisma.refreshToken.delete({
            where: { id: tokenRecord.id },
        });

        // Generate new tokens
        return this.generateTokens(tokenRecord.studentId);
    }

    async logout(refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }

    private async generateTokens(studentId: string) {
        const payload = { sub: studentId };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        // Store refresh token
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                studentId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return { accessToken, refreshToken };
    }

    async validateStudent(studentId: string) {
        return this.prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                grade: true,
                branch: true,
            },
        });
    }
}
