const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  'WTA – G1 - Individual Infantil Feminino',
  'WTA – G1 - Individual Infantil Masculino',
  'WTA – G1 - Individual Cadete Feminino',
  'WTA – G1 - Individual Junior Masculino',
  'WTA – G1 - Par Infantil',
  'WTA – G2- Individual Infantil Masculino',
  'WTA – G2- Individual Cadete Feminino',
  'WTA – G2- Individual S30 Feminino',
  'WTA – G2- Individual S30 Masculino',
  'WTA – G3 - Individual Infantil Masculino',
  'WTA – G3 - Individual Cadete Feminino',
  'WTA – G3 - Individual S45 Masculino',
  'WTA – Faixa Preta - Individual Infantil Masculino',
  'WTA – Faixa Preta - Individual Cadete Feminino',
  'WTA – Faixa Preta - Individual Junior Feminino',
  'WTA – Faixa Preta - Individual Junior Masculino',
  'WTA – Faixa Preta - Individual S30 Masculino',
  'WTA – Faixa Preta - Individual S45 Masculino',
  'WTA – Faixa Preta - Individual A45 Masculino',
  'WTA – Faixa Preta - Par Subcadete',
  'WTA – Faixa Preta - Par Livre',
  'WTA – Faixa Preta - Equipe Livre',
  'WT - Individual Infantil Masculino',
  'WT - Individual Cadete Feminino',
  'WT - Individual Junior Feminino',
  'WT - Individual Junior Masculino',
  'WT - Individual S30 Masculino',
  'WT - Individual S40 Masculino',
  'WT - Individual S50 Masculino',
  'WT - Par Junior',
  'WT - Par S30',
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