export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  jobId?: string;
  message: string;
  details?: any;
}

export class ImportLoggerService {
  private static logs: LogEntry[] = [];
  private static listeners: ((logs: LogEntry[]) => void)[] = [];

  public static log(level: LogEntry['level'], message: string, jobId?: string, details?: any): LogEntry {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      jobId,
      message,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > 500) {
      this.logs.pop();
    }

    console.log(`[ImportLogger] [${level.toUpperCase()}] ${message}`, details || '');
    this.notify();
    return entry;
  }

  public static info(message: string, jobId?: string, details?: any) {
    return this.log('info', message, jobId, details);
  }

  public static warn(message: string, jobId?: string, details?: any) {
    return this.log('warn', message, jobId, details);
  }

  public static error(message: string, jobId?: string, details?: any) {
    return this.log('error', message, jobId, details);
  }

  public static success(message: string, jobId?: string, details?: any) {
    return this.log('success', message, jobId, details);
  }

  public static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public static clearLogs() {
    this.logs = [];
    this.notify();
  }

  public static subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }
}
