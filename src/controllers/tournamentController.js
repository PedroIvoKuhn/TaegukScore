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

exports.createTournament = async (req, res) => {
  const { name, date } = req.body;
  const organizerId = req.user.id;

  if (!name || !date) {
    return res.status(400).json({ error: 'Nome e data são obrigatórios.' });
  }

  try {
    const newTournament = await prisma.tournament.create({
      data: {
        name,
        date: new Date(date),
        organizerId,
      },
    });
    res.status(201).json(newTournament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível criar o torneio.' });
  }
};

exports.getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUniqueOrThrow({
      where: {
        id: parseInt(id),
      },
      include: {
        organizer: {
          select: { username: true },
        },
        categories: {
          orderBy: { name: 'asc' }, 
          include: {
            athletes: {
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });

    res.json(tournament);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Torneio não encontrado.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Não foi possível buscar os detalhes do torneio.' });
  }
};