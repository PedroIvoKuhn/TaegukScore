const jwt = require('jsonwebtoken');
const prisma = require('../services/prisma');

// Este middleware irá proteger as rotas
exports.protect = async (req, res, next) => {
  let token;

  // 1. Verificar se o token foi enviado no cabeçalho (header) da requisição
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extrair o token (formato "Bearer <TOKEN>")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verificar se o token é válido usando a chave secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Adicione JWT_SECRET no seu .env!

      // 4. Buscar o usuário do token no banco de dados e anexá-lo à requisição
      // Isso garante que o usuário ainda existe e nos dá acesso aos seus dados
      req.user = await prisma.user.findUnique({ where: { id: decoded.id } });

      // Se o usuário não for encontrado no banco
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      // 5. Deu tudo certo, pode passar para a próxima função (o controller)
      next();
    } catch (error) {
      res.status(401).json({ error: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Não autorizado, nenhum token encontrado.' });
  }
};

// Middleware para verificar se o usuário é ADMIN
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Rota exclusiva para administradores.' });
    }
}