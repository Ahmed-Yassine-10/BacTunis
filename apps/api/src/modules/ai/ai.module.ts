import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DocumentsService } from './documents.service';

@Module({
    controllers: [AiController],
    providers: [AiService, DocumentsService],
    exports: [AiService],
})
export class AiModule { }
