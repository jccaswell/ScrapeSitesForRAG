import fs from 'fs';
import path from 'path';

export class Logger {
  private logDir: string;
  private errorLogPath: string;
  private infoLogPath: string;

  constructor(baseDir: string = 'logs') {
    this.logDir = path.join(process.cwd(), baseDir);
    this.errorLogPath = path.join(this.logDir, 'error.log');
    this.infoLogPath = path.join(this.logDir, 'info.log');
    this.initializeLogDirectory();
  }

  private initializeLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `\nMetadata: ${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
  }

  public error(message: string, meta?: any): void {
    const logMessage = this.formatLogMessage('ERROR', message, meta);
    fs.appendFileSync(this.errorLogPath, logMessage);
    console.error(logMessage);
  }

  public info(message: string, meta?: any): void {
    const logMessage = this.formatLogMessage('INFO', message, meta);
    fs.appendFileSync(this.infoLogPath, logMessage);
    console.log(logMessage);
  }

  public warn(message: string, meta?: any): void {
    const logMessage = this.formatLogMessage('WARN', message, meta);
    fs.appendFileSync(this.infoLogPath, logMessage);
    console.warn(logMessage);
  }

  public getLogStats(): { errors: number; info: number } {
    try {
      const errorContent = fs.readFileSync(this.errorLogPath, 'utf-8');
      const infoContent = fs.readFileSync(this.infoLogPath, 'utf-8');

      return {
        errors: errorContent.split('\n').length - 1,
        info: infoContent.split('\n').length - 1
      };
    } catch {
      return { errors: 0, info: 0 };
    }
  }

  public clearLogs(): void {
    fs.writeFileSync(this.errorLogPath, '');
    fs.writeFileSync(this.infoLogPath, '');
  }
}
