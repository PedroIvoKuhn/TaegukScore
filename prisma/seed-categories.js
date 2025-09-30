const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'Faixa Branca - Infantil',
  'Faixa Branca - Juvenil',
  'Faixa Amarela - Infantil',
  'Faixa Azul',
  'Faixa Preta - Adulto - Masculino',
  'Faixa Preta - Adulto - Feminino',
  'Faixa Preta - Master 1 - Masculino',
];

async function main() {
  console.log('Iniciando o seed de categorias...');
  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    });
  }
  console.log('Seed de categorias finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });