const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuário admin...');
  
  const senhaHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@demaepramaebrecho.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@demaepramaebrecho.com.br',
      senha: senhaHash,
      tipo: 'admin',
      ativo: true
    }
  });
  
  console.log('✅ Admin criado:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
