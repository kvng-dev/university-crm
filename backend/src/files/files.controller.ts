// src/modules/files/files.controller.ts
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadFile(file);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Download a file' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getFile(filename);
    const fileInfo = await this.filesService.getFileInfo(filename);

    res.set({
      'Content-Type': fileInfo.mimetype,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  @Get(':filename/info')
  @ApiOperation({ summary: 'Get file information' })
  @ApiResponse({ status: 200, description: 'File info retrieved successfully' })
  async getFileInfo(@Param('filename') filename: string) {
    return this.filesService.getFileInfo(filename);
  }

  @Get(':filename/text')
  @ApiOperation({ summary: 'Extract text from document' })
  @ApiResponse({ status: 200, description: 'Text extracted successfully' })
  @ApiResponse({ status: 400, description: 'Unsupported file type' })
  async extractText(@Param('filename') filename: string) {
    const text = await this.filesService.extractTextFromDocument(filename);
    return { text };
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('filename') filename: string) {
    await this.filesService.deleteFile(filename);
    return { message: 'File deleted successfully' };
  }
}
