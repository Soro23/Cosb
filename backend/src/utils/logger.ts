const isDev = process.env['NODE_ENV'] !== 'production';

function format(level: string, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${message}${metaStr}`;
}

export const logger = {
  info: (message: string, meta?: unknown) => console.log(format('INFO', message, meta)),
  warn: (message: string, meta?: unknown) => console.warn(format('WARN', message, meta)),
  error: (message: string, meta?: unknown) => console.error(format('ERROR', message, meta)),
  debug: (message: string, meta?: unknown) => {
    if (isDev) console.debug(format('DEBUG', message, meta));
  },
};
