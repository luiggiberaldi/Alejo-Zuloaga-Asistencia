type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, context?: unknown): void {
  if (!__DEV__) return;

  const prefix = `[${level.toUpperCase()}]`;
  if (context !== undefined) {
    console[level](prefix, message, context);
  } else {
    console[level](prefix, message);
  }
}

export const logger = {
  info: (message: string, context?: unknown) => log('info', message, context),
  warn: (message: string, context?: unknown) => log('warn', message, context),
  error: (message: string, context?: unknown) => log('error', message, context),
};
