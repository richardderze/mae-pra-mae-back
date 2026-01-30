const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Upload de múltiplas imagens (até 5)
router.post('/', authMiddleware, adminMiddleware, upload.array('fotos', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ erro: 'Nenhuma imagem foi enviada' });
    }

    // Retornar URLs das imagens
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    
    res.json({ 
      mensagem: 'Imagens enviadas com sucesso',
      urls 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ erro: 'Erro ao fazer upload das imagens' });
  }
});

// Deletar imagem
router.delete('/:filename', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('./uploads', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ mensagem: 'Imagem deletada com sucesso' });
    } else {
      res.status(404).json({ erro: 'Imagem não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({ erro: 'Erro ao deletar imagem' });
  }
});

module.exports = router;
