const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todos os clientes (apenas admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        _count: {
          select: { compras: true }
        }
      },
      orderBy: { nome: 'asc' }
    });
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar clientes' });
  }
});

// Buscar cliente por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        compras: {
          include: {
            peca: true
          }
        }
      }
    });
    
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar cliente' });
  }
});

// Criar cliente (admin ou o próprio cliente via registro)
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, telefone, endereco, cep, cidade, estado, observacoes } = req.body;
    
    // Verificar se email já existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { email }
    });
    
    if (clienteExistente) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone,
        endereco,
        cep,
        cidade,
        estado,
        observacoes
      }
    });
    
    // Remover senha da resposta
    const { senha: _, ...clienteSemSenha } = cliente;
    res.status(201).json(clienteSemSenha);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar cliente' });
  }
});

// Atualizar cliente
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nome, email, senha, telefone, endereco, cep, cidade, estado, observacoes } = req.body;
    const id = parseInt(req.params.id);
    
    const dados = {
      nome,
      email,
      telefone,
      endereco,
      cep,
      cidade,
      estado,
      observacoes
    };
    
    // Se senha foi fornecida, atualizar
    if (senha) {
      dados.senha = await bcrypt.hash(senha, 10);
    }
    
    const cliente = await prisma.cliente.update({
      where: { id },
      data: dados
    });
    
    const { senha: _, ...clienteSemSenha } = cliente;
    res.json(clienteSemSenha);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao atualizar cliente' });
  }
});

// Deletar cliente
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.cliente.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ mensagem: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao deletar cliente' });
  }
});

module.exports = router;
