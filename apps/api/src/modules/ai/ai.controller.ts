import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AiService } from './ai.service';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentStudent } from '../auth/decorators/current-student.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { GenerateExercisesDto } from './dto/generate-exercises.dto';
import { GenerateSummaryDto } from './dto/generate-summary.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(
        private aiService: AiService,
        private documentsService: DocumentsService,
    ) { }

    // Chat
    @Post('chat')
    @ApiOperation({ summary: 'Envoyer un message à l\'assistant IA' })
    async sendMessage(
        @CurrentStudent() student: { id: string },
        @Body() dto: SendMessageDto,
    ) {
        return this.aiService.sendMessage(student.id, dto, this.documentsService);
    }

    @Get('conversations')
    @ApiOperation({ summary: 'Obtenir la liste des conversations' })
    async getConversations(@CurrentStudent() student: { id: string }) {
        return this.aiService.getConversations(student.id);
    }

    @Get('conversations/:id')
    @ApiOperation({ summary: 'Obtenir une conversation' })
    async getConversation(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        return this.aiService.getConversation(id, student.id);
    }

    @Delete('conversations/:id')
    @ApiOperation({ summary: 'Supprimer une conversation' })
    async deleteConversation(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        await this.aiService.deleteConversation(id, student.id);
        return { message: 'Conversation supprimée' };
    }

    // Content Generation
    @Post('generate/summary')
    @ApiOperation({ summary: 'Générer un résumé' })
    async generateSummary(
        @CurrentStudent() student: { id: string; branch: string },
        @Body() dto: GenerateSummaryDto,
    ) {
        const summary = await this.aiService.generateSummary(dto.content, student.branch);
        return { summary };
    }

    @Post('generate/exercises')
    @ApiOperation({ summary: 'Générer des exercices' })
    async generateExercises(@Body() dto: GenerateExercisesDto) {
        return this.aiService.generateExercises(
            dto.topic,
            dto.difficulty || 'MEDIUM',
            dto.count || 3
        );
    }

    @Post('generate/mindmap')
    @ApiOperation({ summary: 'Générer une carte mentale' })
    async generateMindMap(@Body('topic') topic: string) {
        return this.aiService.generateMindMap(topic);
    }

    @Post('generate/course-support')
    @ApiOperation({ summary: 'Générer un support de cours détaillé pour un chapitre' })
    async generateCourseSupport(
        @CurrentStudent() student: { id: string; branch: string },
        @Body() body: { subjectName: string; chapterTitle: string },
    ) {
        const content = await this.aiService.generateCourseSupport(
            body.subjectName,
            body.chapterTitle,
            student.branch,
        );
        return { content };
    }

    // Documents
    @Post('documents/upload')
    @ApiOperation({ summary: 'Uploader un document' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'uploads'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, uniqueSuffix + extname(file.originalname));
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
            fileFilter: (req, file, cb) => {
                const allowedTypes = [
                    'application/pdf',
                    'text/plain',
                    'image/png',
                    'image/jpeg',
                    'image/jpg',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                ];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new BadRequestException('Type de fichier non supporté. Formats acceptés: PDF, TXT, DOCX, PPTX, PNG, JPG'), false);
                }
            },
        }),
    )
    async uploadDocument(
        @CurrentStudent() student: { id: string },
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }
        return this.documentsService.uploadDocument(
            student.id,
            file.originalname,
            file.mimetype,
            `/uploads/${file.filename}`,
            file.size,
        );
    }

    @Get('documents')
    @ApiOperation({ summary: 'Obtenir les documents de l\'élève' })
    async getDocuments(@CurrentStudent() student: { id: string }) {
        return this.documentsService.getDocuments(student.id);
    }

    @Get('documents/:id')
    @ApiOperation({ summary: 'Obtenir un document' })
    async getDocument(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        return this.documentsService.getDocument(id, student.id);
    }

    @Get('documents/:id/content')
    @ApiOperation({ summary: 'Extraire le contenu texte d\'un document' })
    async getDocumentContent(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        return this.documentsService.getDocumentContent(id, student.id);
    }

    @Post('documents/:id/analyze')
    @ApiOperation({ summary: 'Analyser un document' })
    async analyzeDocument(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        return this.documentsService.analyzeDocument(id, student.id);
    }

    @Post('documents/:id/exercises')
    @ApiOperation({ summary: 'Générer des exercices à partir d\'un document' })
    async generateExercisesFromDocument(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
        @Query('difficulty') difficulty: string = 'MEDIUM',
    ) {
        return this.documentsService.generateExercisesFromDocument(id, student.id, difficulty);
    }

    @Delete('documents/:id')
    @ApiOperation({ summary: 'Supprimer un document' })
    async deleteDocument(
        @CurrentStudent() student: { id: string },
        @Param('id') id: string,
    ) {
        await this.documentsService.deleteDocument(id, student.id);
        return { message: 'Document supprimé' };
    }
}
