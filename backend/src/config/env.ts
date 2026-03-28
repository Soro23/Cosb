import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  return value;
}

export const env = {
  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),
  JWT_SECRET: required('JWT_SECRET'),
  APP_USERNAME: required('APP_USERNAME'),
  APP_PASSWORD: required('APP_PASSWORD'),
  PORT: process.env['PORT'] ?? '3000',
  VAULT_PATH: process.env['VAULT_PATH'] ?? '/vault',
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
} as const;
