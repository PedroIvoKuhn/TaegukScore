const prisma = require('../services/prisma');

exports.getAllReferees = async (req, res) => {
  try {
    const referees = await prisma.user.findMany({
      where: { role: 'REFEREE' },
      select: {
        id: true,
        username: true,
      },
      orderBy: { username: 'asc' },
    });
    res.json(referees);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar os árbitros.' });
  }
};