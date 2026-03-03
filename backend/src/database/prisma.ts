import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST as string,
  user: process.env.DATABASE_USER as string,
  password: process.env.DATABASE_PASSWORD as string,
  database: process.env.DATABASE_NAME as string,
  port: Number(process.env.DATABASE_PORT),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export { prisma };