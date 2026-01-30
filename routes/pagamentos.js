const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todos os pagamentos
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      include: {
        venda: {
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
            },
            cliente: true
          }
        },
        parceiro: {
          include: {
            usuario: true
          }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    
    res.json(pagamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar pagamentos' });
  }
});

// Marcar múltiplos pagamentos como pagos
router.post('/marcar-pago', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ erro: 'IDs inválidos' });
    }
    
    // Atualizar todos os pagamentos de uma vez
    await prisma.pagamento.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        pago: true,
        dataPagamento: new Date()
      }
    });
    
    res.json({ mensagem: `${ids.length} pagamento(s) marcado(s) como pago(s)` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao marcar pagamentos como pagos' });
  }
});

// Gerar recibo de um parceiro (TODOS os pagamentos, pagos e pendentes)
router.get('/recibo/:parceiroId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const parceiroId = parseInt(req.params.parceiroId);
    
    const parceiro = await prisma.parceiro.findUnique({
      where: { id: parceiroId },
      include: { usuario: true }
    });
    
    if (!parceiro) {
      return res.status(404).json({ erro: 'Parceiro não encontrado' });
    }
    
    // Buscar TODOS os pagamentos do parceiro
    const pagamentos = await prisma.pagamento.findMany({
      where: { parceiroId },
      include: {
        venda: {
          include: {
            peca: {
              include: {
                marca: true,
                tamanho: true
              }
            }
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });
    
    const totalPago = pagamentos.filter(p => p.pago).reduce((sum, p) => sum + p.valorParceiro, 0);
    const totalPendente = pagamentos.filter(p => !p.pago).reduce((sum, p) => sum + p.valorParceiro, 0);
    
    const recibo = {
      parceiro: {
        id: parceiro.id,
        nome: parceiro.usuario.nome,
        email: parceiro.usuario.email,
        telefone: parceiro.telefone,
        percentual: parceiro.percentual
      },
      pagamentos: pagamentos.map(p => ({
        id: p.id,
        peca: {
          codigo: p.venda.peca.codigoEtiqueta,
          marca: p.venda.peca.marca.nome,
          tamanho: p.venda.peca.tamanho.nome
        },
        dataVenda: p.venda.dataVenda,
        valorVendido: p.venda.valorVendido,
        percentual: p.percentual,
        valorParceiro: p.valorParceiro,
        pago: p.pago,
        dataPagamento: p.dataPagamento
      })),
      totais: {
        totalPago,
        totalPendente,
        total: totalPago + totalPendente,
        quantidadePecas: pagamentos.length
      },
      dataGeracao: new Date()
    };
    
    res.json(recibo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao gerar recibo' });
  }
});

// Buscar pagamentos de um parceiro específico
router.get('/parceiro/:parceiroId', authMiddleware, async (req, res) => {
  try {
    const parceiroId = parseInt(req.params.parceiroId);
    
    const pagamentos = await prisma.pagamento.findMany({
      where: { parceiroId },
      include: {
        venda: {
          include: {
            peca: {
              include: {
                marca: true,
                tamanho: true
              }
            }
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });
    
    res.json(pagamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar pagamentos do parceiro' });
  }
});

module.exports = router;
