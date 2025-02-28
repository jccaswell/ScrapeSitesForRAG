import fs from 'fs';
import path from 'path';
import { ScrapingResult } from './types';

export class FileManager {
  private baseDir: string;

  constructor(baseDir: string = 'output') {
    this.baseDir = path.join(process.cwd(), baseDir);
    this.initializeDirectory();
  }

  private initializeDirectory(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private createCategoryDirectory(category: string): string {
    const categoryPath = path.join(this.baseDir, this.sanitizeFilename(category));
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }
    return categoryPath;
  }

  public saveContent(result: ScrapingResult): string {
    const { metadata, content } = result;
    
    // Create category directory if it exists
    const directory = metadata.category 
      ? this.createCategoryDirectory(metadata.category)
      : this.baseDir;

    // Create filename from title
    const filename = this.sanitizeFilename(metadata.title) + '.md';
    const filepath = path.join(directory, filename);

    // Create metadata section
    const metadataSection = [
      '---',
      `title: ${metadata.title}`,
      `url: ${metadata.url}`,
      metadata.lastModified ? `lastModified: ${metadata.lastModified}` : null,
      metadata.category ? `category: ${metadata.category}` : null,
      '---\n\n'
    ].filter(Boolean).join('\n');

    // Write file
    fs.writeFileSync(filepath, metadataSection + content);
    
    return filepath;
  }

  public getContentStructure(): object {
    const structure: any = {};

    function readDirectory(dir: string, obj: any) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          obj[item] = {};
          readDirectory(fullPath, obj[item]);
        } else {
          if (!obj.files) obj.files = [];
          obj.files.push(item);
        }
      });
    }

    readDirectory(this.baseDir, structure);
    return structure;
  }
}
