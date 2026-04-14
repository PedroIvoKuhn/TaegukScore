const jwt = require('jsonwebtoken');
const prisma = require('../services/prisma');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      next();
    } catch (error) {
      res.status(401).json({ error: 'Não autorizado, token inválido.' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Não autorizado, nenhum token encontrado.' });
  }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Rota exclusiva para administradores.' });
    }
}