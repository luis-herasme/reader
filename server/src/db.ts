import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const adapter = new PrismaPg(env.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });
