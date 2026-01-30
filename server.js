require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sacolinhasRoutes = require('./routes/sacolinhas');
const clientesRoutes = require('./routes/clientes');


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/sacolinhas', sacolinhasRoutes);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/parceiros', require('./routes/parceiros'));
app.use('/api/marcas', require('./routes/marcas'));
app.use('/api/tamanhos', require('./routes/tamanhos'));
app.use('/api/pecas', require('./routes/pecas'));
app.use('/api/vendas', require('./routes/vendas'));
app.use('/api/pagamentos', require('./routes/pagamentos'));
app.use('/api/clientes', clientesRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Mãe pra Mãe funcionando!' });
});

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

// Adicione no topo com as outras importações
const clientesRoutes = require('./routes/clientes');

// Adicione com as outras rotas
app.use('/api/clientes', clientesRoutes);

