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
  const { name, date, location, description } = req.body;
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
        location,
        description,
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
            category: true,
            results: {
              where: {
                tournamentId: parseInt(id), // Garante que pegamos o resultado apenas deste torneio
              },
            },
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
  const { refereeIds } = req.body;

  if (!refereeIds || !Array.isArray(refereeIds)){
    return res.status(400).json({ error: 'A lista de árbitros é obrigatória.' });
  }

  if (refereeIds.length < 3) {
    return res.status(400).json({ error: 'Um torneio deve ter no mínimo 3 árbitros.' });
  }

  try {
    const dataToInsert = refereeIds.map(refereeId => ({
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

exports.getCategoryResults = async (req, res) => {
  const { tournamentId, categoryId } = req.params;
  try {
    const results = await prisma.athleteResult.findMany({
      where: {
        tournamentId: parseInt(tournamentId),
        athlete: { categoryId: parseInt(categoryId) },
      },
      include: {
        athlete: { select: { name: true } },
      },
      orderBy: [
        { finalScore: 'desc' },      // 1º Critério: Média geral
        { precisionAvg: 'desc' },    // 2º Critério (desempate): Média de precisão
        { rawScoreSum: 'desc' },     // 3º Critério (desempate): Soma das notas brutas
      ],
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar os resultados da categoria.' });
  }
};