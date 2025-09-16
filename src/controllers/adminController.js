const prisma = require('../services/prisma');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

exports.createReferee = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferee = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
        role: 'REFEREE',
      },
    });

    const { password: _, ...refereeData } = newReferee;
    res.status(201).json(refereeData);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Este nome de usuário já existe.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,             
      { expiresIn: '1d' }                  
    );
    
    res.json({ token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};