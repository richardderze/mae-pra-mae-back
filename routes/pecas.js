const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todas as peças
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pecas = await prisma.peca.findMany({
      include: {
        parceiro: {
          include: {
            usuario: true
          }
        },
        marca: true,
        tamanho: true,
        tipoPeca: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    res.json(pecas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar peças' });
  }
});

// Buscar peça por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const peca = await prisma.peca.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        parceiro: {
          include: {
            usuario: true
          }
        },
        marca: true,
        tamanho: true,
        tipoPeca: true
      }
    });
    
    if (!peca) {
      return res.status(404).json({ erro: 'Peça não encontrada' });
    }
    
    res.json(peca);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar peça' });
  }
});

// Criar peça
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      codigoEtiqueta,
      nome,
      parceiroId,
      marcaId,
      tamanhoId,
      tipoPecaId,
      valorCusto,
      valorVenda,
      observacoes
    } = req.body;

    // Validar campos obrigatórios
    if (!codigoEtiqueta || !nome || !parceiroId || !marcaId || !tamanhoId || !tipoPecaId) {
      return res.status(400).json({ 
        erro: 'Campos obrigatórios: codigoEtiqueta, nome, parceiroId, marcaId, tamanhoId, tipoPecaId' 
      });
    }

    const peca = await prisma.peca.create({
      data: {
        codigoEtiqueta,
        nome,
        parceiroId: parseInt(parceiroId),
        marcaId: parseInt(marcaId),
        tamanhoId: parseInt(tamanhoId),
        tipoPecaId: parseInt(tipoPecaId),
        valorCusto: parseFloat(valorCusto),
        valorVenda: parseFloat(valorVenda),
        observacoes,
        fotos: []
      },
      include: {
        parceiro: {
          include: {
            usuario: true
          }
        },
        marca: true,
        tamanho: true,
        tipoPeca: true
      }
    });

    res.status(201).json(peca);
  } catch (error) {
    console.error('Erro ao criar peça:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Código de etiqueta já existe' });
    }
    
    res.status(500).json({ erro: 'Erro ao criar peça' });
  }
});

// Atualizar peça
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      codigoEtiqueta,
      nome,
      parceiroId,
      marcaId,
      tamanhoId,
      tipoPecaId,
      valorCusto,
      valorVenda,
      status,
      observacoes
    } = req.body;

    const peca = await prisma.peca.update({
      where: { id: parseInt(req.params.id) },
      data: {
        codigoEtiqueta,
        nome,
        parceiroId: parceiroId ? parseInt(parceiroId) : undefined,
        marcaId: marcaId ? parseInt(marcaId) : undefined,
        tamanhoId: tamanhoId ? parseInt(tamanhoId) : undefined,
        tipoPecaId: tipoPecaId ? parseInt(tipoPecaId) : undefined,
        valorCusto: valorCusto ? parseFloat(valorCusto) : undefined,
        valorVenda: valorVenda ? parseFloat(valorVenda) : undefined,
        status,
        observacoes
      },
      include: {
        parceiro: {
          include: {
            usuario: true
          }
        },
        marca: true,
        tamanho: true,
        tipoPeca: true
      }
    });

    res.json(peca);
  } catch (error) {
    console.error(error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Código de etiqueta já existe' });
    }
    
    res.status(500).json({ erro: 'Erro ao atualizar peça' });
  }
});

// Deletar peça
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.peca.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({ mensagem: 'Peça deletada com sucesso' });
  } catch (error) {
    console.error(error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        erro: 'Não é possível deletar: peça está vinculada a vendas ou sacolinhas' 
      });
    }
    
    res.status(500).json({ erro: 'Erro ao deletar peça' });
  }
});

module.exports = router;
