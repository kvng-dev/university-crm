// src/modules/files/files.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as mammoth from 'mammoth';

@Injectable()
export class FilesService {
  private readonly uploadPath = './uploads';

  async uploadFile(file: Express.Multer.File): Promise<{
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
  }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join(this.uploadPath, filename);
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    }
  }

  async getFile(filename: string): Promise<Buffer> {
    try {
      const filePath = join(this.uploadPath, filename);
      return await fs.readFile(filePath);
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  async extractTextFromDocument(filename: string): Promise<string> {
    try {
      const filePath = join(this.uploadPath, filename);
      const buffer = await fs.readFile(filePath);

      if (filename.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else if (filename.endsWith('.txt')) {
        return buffer.toString('utf-8');
      } else {
        throw new BadRequestException(
          'Unsupported file type for text extraction',
        );
      }
    } catch (error) {
      throw new BadRequestException(`Failed to extract text: ${error.message}`);
    }
  }

  async getFileInfo(filename: string): Promise<{
    filename: string;
    size: number;
    createdAt: Date;
    mimetype: string;
  }> {
    try {
      const filePath = join(this.uploadPath, filename);
      const stats = await fs.stat(filePath);

      // Determine mimetype based on extension
      let mimetype = 'application/octet-stream';
      if (filename.endsWith('.pdf')) mimetype = 'application/pdf';
      else if (filename.endsWith('.docx'))
        mimetype =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (filename.endsWith('.doc')) mimetype = 'application/msword';
      else if (filename.endsWith('.txt')) mimetype = 'text/plain';
      else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg'))
        mimetype = 'image/jpeg';
      else if (filename.endsWith('.png')) mimetype = 'image/png';

      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime,
        mimetype,
      };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}
