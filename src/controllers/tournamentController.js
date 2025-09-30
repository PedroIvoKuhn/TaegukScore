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
          orderBy: { 
            category: { name: 'asc' }
           }, 
          include: {
            category: true
          },
        },
        athletes: {
          orderBy: { name: 'asc' },
          include: {
            category: true
          }
        },
        referees: {
          include: {
            referee: {
              select: {
                id: true,
                username: true,
              },
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

exports.addRefereesToTournament = async (req, res) => {
  const { id } = req.params;
  const { refereIds } = req.body;

  if (!refereIds || !Array.isArray(refereIds)){
    return res.status(400).json({ error: 'A lista de árbitros é obrigatória.' });
  }

  try {
    const dataToInsert = refereIds.map(refereeId => ({
      tournamentId: parseInt(id),
      refereeId: refereeId
    }));

    await prisma.refereesInTournament.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });

    res.status(200).json({ message: 'Árbitros associados ao torneio com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível associar os árbitros.' });
  }
};