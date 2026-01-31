const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();

// Listar todos os clientes
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        ativo: true,
        criadoEm: true
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
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        cep: true,
        cidade: true,
        estado: true,
        observacoes: true,
        ativo: true,
        criadoEm: true
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

// Criar cliente
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome, email, senha, telefone, endereco, cep, cidade, estado, observacoes } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

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
        observacoes,
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        ativo: true,
        criadoEm: true
      }
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
    res.status(500).json({ erro: 'Erro ao criar cliente' });
  }
});

// Atualizar cliente
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nome, email, senha, telefone, endereco, cep, cidade, estado, observacoes, ativo } = req.body;

    const data = {};
    if (nome !== undefined) data.nome = nome;
    if (email !== undefined) data.email = email;
    if (telefone !== undefined) data.telefone = telefone;
    if (endereco !== undefined) data.endereco = endereco;
    if (cep !== undefined) data.cep = cep;
    if (cidade !== undefined) data.cidade = cidade;
    if (estado !== undefined) data.estado = estado;
    if (observacoes !== undefined) data.observacoes = observacoes;
    if (ativo !== undefined) data.ativo = ativo;

    if (senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        ativo: true,
        criadoEm: true
      }
    });

    res.json(cliente);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }
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

// Buscar compras de um cliente (peças dentro das sacolinhas)
router.get('/:id/compras', authMiddleware, async (req, res) => {
  try {
    const sacolinhas = await prisma.sacolinha.findMany({
      where: { clienteId: parseInt(req.params.id) },
      include: {
        pecas: {
          include: {
            peca: {
              include: {
                marca: true,
                tamanho: true,
                tipoPeca: true,
                parceiro: {
                  include: { usuario: true }
                }
              }
            }
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    // Monta lista flat de compras a partir das peças das sacolinhas
    const compras = [];
    sacolinhas.forEach(sacolinha => {
      sacolinha.pecas.forEach(item => {
        compras.push({
          id: item.id,
          dataVenda: sacolinha.criadoEm,
          valorVendido: item.peca.valorVenda,
          sacolinhaId: sacolinha.id,
          sacolinhaStatus: sacolinha.status,
          peca: item.peca
        });
      });
    });

    res.json(compras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar compras do cliente' });
  }
});

// Buscar sacolinhas de um cliente
router.get('/:id/sacolinhas', authMiddleware, async (req, res) => {
  try {
    const sacolinhas = await prisma.sacolinha.findMany({
      where: { clienteId: parseInt(req.params.id) },
      include: {
        pecas: {
          include: {
            peca: {
              include: {
                marca: true,
                tamanho: true,
                tipoPeca: true
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
    res.status(500).json({ erro: 'Erro ao buscar sacolinhas do cliente' });
  }
});

module.exports = router;
