const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas
const authRoutes = require('./routes/auth');
const pecasRoutes = require('./routes/pecas');
const parceirosRoutes = require('./routes/parceiros');
const marcasRoutes = require('./routes/marcas');
const tamanhosRoutes = require('./routes/tamanhos');
const vendasRoutes = require('./routes/vendas');
const pagamentosRoutes = require('./routes/pagamentos');
const clientesRoutes = require('./routes/clientes');

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/pecas', pecasRoutes);
app.use('/api/parceiros', parceirosRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/tamanhos', tamanhosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/clientes', clientesRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API Mãe pra Mãe funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Mãe pra Mãe - Brechó Infantil',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      pecas: '/api/pecas',
      parceiros: '/api/parceiros',
      marcas: '/api/marcas',
      tamanhos: '/api/tamanhos',
      tiposPeca: '/api/tipos-peca',
      vendas: '/api/vendas',
      pagamentos: '/api/pagamentos',
      clientes: '/api/clientes'
    }
  });
});

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ 
    erro: 'Rota não encontrada',
    path: req.path
  });
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({ 
    erro: err.message || 'Erro interno do servidor'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recebido, encerrando servidor...');
  process.exit(0);
});
