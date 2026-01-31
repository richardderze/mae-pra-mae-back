const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todos os administradores
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const admins = await prisma.usuario.findMany({
      where: { tipo: 'admin' },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        criadoEm: true
      },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar administradores' });
  }
});

// Criar novo administrador
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const admin = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        tipo: 'admin',
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        criadoEm: true
      }
    });

    res.status(201).json(admin);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao criar administrador' });
  }
});

// Atualizar administrador
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome, email, senha, ativo } = req.body;
    const userId = parseInt(req.params.id);

    const data = {};
    
    if (nome !== undefined) data.nome = nome;
    if (email !== undefined) data.email = email;
    if (ativo !== undefined) data.ativo = ativo;
    
    if (senha) {
      if (senha.length < 6) {
        return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
      }
      data.senha = await bcrypt.hash(senha, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        criadoEm: true
      }
    });

    res.json(usuario);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao atualizar administrador' });
  }
});

// Deletar administrador
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Verificar se não é o último admin ativo
    const adminsAtivos = await prisma.usuario.count({
      where: {
        tipo: 'admin',
        ativo: true,
        id: { not: userId }
      }
    });

    if (adminsAtivos === 0) {
      return res.status(400).json({ 
        erro: 'Não é possível deletar o último administrador ativo' 
      });
    }

    await prisma.usuario.delete({
      where: { id: userId }
    });

    res.json({ mensagem: 'Administrador deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao deletar administrador' });
  }
});

module.exports = router;
