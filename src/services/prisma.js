const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
// Primeira vez rodando
// npx prisma generate
// npx prisma migrate dev --name init