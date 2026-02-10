import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // API
  API_URL: Joi.string().default('http://localhost:3001'),
  PORT: Joi.number().default(3001),

  // Platform
  PLATFORM_NAME: Joi.string().default('Steeze'),
  PLATFORM_URL: Joi.string().default('https://steeze.com'),
  ADMIN_URL: Joi.string().default('https://admin.steeze.com'),

  // Open Tailor
  OPEN_TAILOR_API_URL: Joi.string().default('http://localhost:3000'),

  // Paystack
  PAYSTACK_SECRET_KEY: Joi.string().optional(),
  PAYSTACK_PUBLIC_KEY: Joi.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: Joi.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),

  // Email
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().default('noreply@steeze.com'),

  // Firebase
  FIREBASE_PROJECT_ID: Joi.string().optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().optional(),

  // MinIO
  MINIO_ENDPOINT: Joi.string().optional(),
  MINIO_PORT: Joi.number().optional(),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),
  MINIO_BUCKET: Joi.string().optional(),
});
