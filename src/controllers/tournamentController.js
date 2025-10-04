const prisma = require('../services/prisma');
const DUAL_PRESENTATION_CATEGORIES = [
  'Faixa Azul',
  'Teste'
];
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
    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada.'});

    let finalResults;

    if (DUAL_PRESENTATION_CATEGORIES.includes(category.name)) {
      const aggregatedResults = await prisma.athleteResult.groupBy({
        by: ['athleteId'],
        where: {
          tournamentId: parseInt(tournamentId),
          athlete: { categoryId: parseInt(categoryId) },
        },
        _avg: {
          finalScore: true,
          precisionAvg: true,
          rawScoreSum: true,
        },
      });

      const athleteIds = aggregatedResults.map(r => r.athleteId);
      const athletes = await prisma.athlete.findMany({
        where: { id: { in: athleteIds } },
        select: { id: true, name: true },
      });

      finalResults = aggregatedResults.map(result => {
        const athleteInfo = athletes.find(a => a.id === result.athleteId);
        return {
          athlete: { name: athleteInfo.name },
          finalScore: result._avg.finalScore,
          precisionAvg: result._avg.precisionAvg,
          rawScoreSum: result._avg.rawScoreSum,
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
    } else {
      finalResults = await prisma.athleteResult.findMany({
        where: {
          tournamentId: parseInt(tournamentId),
          athlete: { categoryId: parseInt(categoryId) },
        },
        include: { athlete: { select: { name: true } } },
        orderBy: [
          { finalScore: 'desc' },
          { precisionAvg: 'desc' },
          { rawScoreSum: 'desc' },
        ],
      });
    }

    res.json(finalResults);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível buscar os resultados da categoria.' });
  }
};

exports.getTournamentReport = async (req, res) => {
  const { id } = req.params;
  try {
    // Busca detalhes do torneio e árbitros
    const tournament = await prisma.tournament.findUnique({
      where: { id: parseInt(id) },
      include: {
        referees: {
          include: {
            referee: { select: { username: true } },
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Torneio não encontrado.' });
    }

    // Busca todos os resultados do torneio de uma vez
    const allResults = await prisma.athleteResult.findMany({
      where: { tournamentId: parseInt(id) },
      include: {
        athlete: { include: { category: true } },
      },
    });

    // Agrupa os resultados por categoria no JavaScript
    const resultsByCategory = allResults.reduce((acc, result) => {
      if (!result.athlete || !result.athlete.category) {
        return acc;
      }
      const categoryName = result.athlete.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(result);
      return acc;
    }, {});
    
    const finalLeaderboards = [];

    // Processa cada categoria para calcular o placar final
    for (const categoryName in resultsByCategory) {
      let sortedResults;
      const categoryResults = resultsByCategory[categoryName];

      // SE for uma categoria de duas apresentações...
      if (DUAL_PRESENTATION_CATEGORIES.includes(categoryName)) {
        // Agrupa os resultados por atleta para calcular a média
        const athletesGrouped = categoryResults.reduce((acc, result) => {
          if (!acc[result.athleteId]) {
            acc[result.athleteId] = { name: result.athlete.name, scores: [] };
          }
          acc[result.athleteId].scores.push(result);
          return acc;
        }, {});
        
        // Calcula a média e formata os dados
        const averagedResults = Object.values(athletesGrouped).map(athleteData => {
          const scoreCount = athleteData.scores.length > 0 ? athleteData.scores.length : 1;
          const avgFinalScore = athleteData.scores.reduce((sum, s) => sum + s.finalScore, 0) / scoreCount;
          const avgPrecision = athleteData.scores.reduce((sum, s) => sum + s.precisionAvg, 0) / scoreCount;
          const avgPresentation = athleteData.scores.reduce((sum, s) => sum + s.presentationAvg, 0) / scoreCount;
          const totalRawSum = athleteData.scores.reduce((sum, s) => sum + s.rawScoreSum, 0);
          
          return {
            name: athleteData.name,
            finalScore: avgFinalScore,
            precisionAvg: avgPrecision,
            presentationAvg: avgPresentation,
            rawScoreSum: totalRawSum,
            presentations: athleteData.scores.map(s => ({ 
              presentationNumber: s.presentationNumber,
              score: s.finalScore,
              precisionAvg: s.precisionAvg,
              presentationAvg: s.presentationAvg
            })),
          };
        });

        // Ordena com base nos resultados médios
        sortedResults = averagedResults.sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            if (b.precisionAvg !== a.precisionAvg) return b.precisionAvg - a.precisionAvg;
            return b.rawScoreSum - a.rawScoreSum;
        });

      } else {
        // SENÃO (categoria normal), apenas ordena os resultados existentes
        sortedResults = categoryResults.sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            if (b.precisionAvg !== a.precisionAvg) return b.precisionAvg - a.precisionAvg;
            return b.rawScoreSum - a.rawScoreSum;
        }).map(r => ({ 
          name: r.athlete.name,
          finalScore: r.finalScore,
          precisionAvg: r.precisionAvg,
          presentationAvg: r.presentationAvg,
          rawScoreSum: r.rawScoreSum,
          presentations: [{ 
            presentationNumber: 1, 
            score: r.finalScore,
            precisionAvg: r.precisionAvg,   
            presentationAvg: r.presentationAvg 
          }]
        }));
      }
      
      finalLeaderboards.push({ categoryName, results: sortedResults });
    }

    const reportData = {
      tournamentName: tournament.name,
      referees: tournament.referees.map(r => r.referee.username),
      leaderboards: finalLeaderboards,
    };

    res.json(reportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível gerar os dados do relatório.' });
  }
};