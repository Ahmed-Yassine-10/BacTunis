import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { PlanningModule } from './modules/planning/planning.module';
import { AiModule } from './modules/ai/ai.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),
        PrismaModule,
        AuthModule,
        StudentsModule,
        PlanningModule,
        AiModule,
        SubjectsModule,
        TimetableModule,
    ],
})
export class AppModule { }
