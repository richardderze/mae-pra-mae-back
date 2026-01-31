const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de tipos de peça...');
  
  const tipos = [
    'Body',
    'Conjunto',
    'Calça',
    'Bermuda',
    'Short',
    'Saia',
    'Vestido',
    'Camiseta',
    'Blusa',
    'Casaco',
    'Jaqueta',
    'Macacão',
    'Pijama',
    'Sapato',
    'Tênis',
    'Sandália',
    'Chinelo',
    'Meia',
    'Boné',
    'Chapéu',
    'Luva',
    'Cachecol',
    'Acessório'
  ];

  let criados = 0;
  let existentes = 0;

  for (const nome of tipos) {
    const tipo = await prisma.tipoPeca.upsert({
      where: { nome },
      update: {},
      create: { nome }
    });
    
    if (tipo) {
      const jaExistia = await prisma.tipoPeca.findFirst({
        where: { nome, criadoEm: { lt: new Date(Date.now() - 1000) } }
      });
      
      if (jaExistia) {
        existentes++;
      } else {
        criados++;
      }
    }
  }

  console.log(`✅ Seed concluído!`);
  console.log(`   📦 ${criados} tipos criados`);
  console.log(`   ♻️  ${existentes} tipos já existiam`);
  console.log(`   📊 Total: ${tipos.length} tipos de peça`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
