const prisma = require('../services/prisma');

exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        date: 'desc',
      },
      include: {
        organizer: {
          select: {
            username: true,
          },
        },
      },
    });
    res.json(tournaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível buscar os torneios.' });
  }
};