export interface Logger {
  info(event: string, context?: Record<string, unknown>): void;
  error(event: string, context?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  info: (event, context) => console.info(JSON.stringify({ level: 'info', event, ...context })),
  error: (event, context) => console.error(JSON.stringify({ level: 'error', event, ...context })),
};
