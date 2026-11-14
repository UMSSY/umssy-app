import { Module } from '@nestjs/common';
import { DocumentTextExtractorService } from './services/document-text-extractor.service.js';
@Module({
  providers: [DocumentTextExtractorService],
  exports: [DocumentTextExtractorService],
})
export class DocumentOcrModule {}
