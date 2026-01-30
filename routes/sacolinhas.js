const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todas as sacolinhas (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sacolinhas = await prisma.sacolinha.findMany({
      include: {
        cliente: true,
        pecas: {
          include: {
            peca: {
              include: {
                marca: true,
                tamanho: true,
                parceiro: {
                  include: {
                    usuario: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(sacolinhas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar sacolinhas' });
  }
});

// Buscar sacolinha por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sacolinha = await prisma.sacolinha.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        cliente: true,
        pecas: {
          include: {
            peca: {
              include: {
                marca: true,
                tamanho: true,
                parceiro: {
                  include: {
                    usuario: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!sacolinha) {
      return res.status(404).json({ erro: 'Sacolinha não encontrada' });
    }
    
    res.json(sacolinha);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar sacolinha' });
  }
});

// Adicionar peça à sacolinha (ao fazer venda)
router.post('/:clienteId/adicionar-peca', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { pecaId } = req.body;
    const clienteId = parseInt(req.params.clienteId);
    
    // Buscar ou criar sacolinha aguardando envio
    let sacolinha = await prisma.sacolinha.findFirst({
      where: {
        clienteId,
        status: 'aguardando_envio'
      }
    });
    
    if (!sacolinha) {
      sacolinha = await prisma.sacolinha.create({
        data: { clienteId }
      });
    }
    
    // Adicionar peça à sacolinha
    await prisma.sacolinhaPeca.create({
      data: {
        sacolinhaId: sacolinha.id,
        pecaId: parseInt(pecaId)
      }
    });
    
    res.json({ mensagem: 'Peça adicionada à sacolinha', sacolinha });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao adicionar peça à sacolinha' });
  }
});

// Remover peça da sacolinha
router.delete('/:id/pecas/:pecaId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sacolinhaId = parseInt(req.params.id);
    const pecaId = parseInt(req.params.pecaId);
    
    await prisma.sacolinhaPeca.deleteMany({
      where: {
        sacolinhaId,
        pecaId
      }
    });
    
    res.json({ mensagem: 'Peça removida da sacolinha' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao remover peça' });
  }
});

// Enviar sacolinha
router.post('/:id/enviar', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { valorFrete, dataEnvio, codigoRastreio, observacoes } = req.body;
    
    const sacolinha = await prisma.sacolinha.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'enviada',
        valorFrete: parseFloat(valorFrete),
        dataEnvio: new Date(dataEnvio),
        codigoRastreio,
        observacoes
      }
    });
    
    res.json({ mensagem: 'Sacolinha enviada com sucesso', sacolinha });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao enviar sacolinha' });
  }
});

module.exports = router;
