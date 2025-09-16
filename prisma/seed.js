const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // Use uma senha mais forte em produção!

  console.log('Verificando se o usuário admin já existe...');
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log('Usuário admin já existe. Nada a fazer.');
    return;
  }

  console.log('Criando usuário admin...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Usuário admin criado com sucesso!');
  console.log(`Login: ${adminUsername} / Senha: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });