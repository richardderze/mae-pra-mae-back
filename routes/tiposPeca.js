const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todos os tipos de peça
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tipos = await prisma.tipoPeca.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(tipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar tipos de peça' });
  }
});

// Criar tipo de peça
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome } = req.body;
    
    const tipo = await prisma.tipoPeca.create({
      data: { nome }
    });
    
    res.status(201).json(tipo);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Tipo de peça já existe' });
    }
    res.status(500).json({ erro: 'Erro ao criar tipo de peça' });
  }
});

// Atualizar tipo de peça
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome, ativo } = req.body;
    
    const tipo = await prisma.tipoPeca.update({
      where: { id: parseInt(req.params.id) },
      data: { nome, ativo }
    });
    
    res.json(tipo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar tipo de peça' });
  }
});

// Deletar tipo de peça
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.tipoPeca.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({ mensagem: 'Tipo de peça deletado com sucesso' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2003') {
      return res.status(400).json({ erro: 'Não é possível deletar: existem peças com este tipo' });
    }
    res.status(500).json({ erro: 'Erro ao deletar tipo de peça' });
  }
});

module.exports = router;
