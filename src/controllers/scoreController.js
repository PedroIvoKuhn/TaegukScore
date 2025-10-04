const prisma = require('../services/prisma');

exports.submitScores = async (req, res) => {
  const { athleteId, tournamentId, scores, presentationNumber } = req.body;

  if (!athleteId || !tournamentId || !scores || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  try {
    let precisions = scores.map(s => s.precision).filter(n => !isNaN(n));
    let presentations = scores.map(s => s.presentation).filter(n => !isNaN(n));

    const rawScoreSum = [...precisions, ...presentations].reduce((a, b) => a + b, 0);

    if (precisions.length > 3) {
      precisions.sort((a, b) => a - b).shift(); // Remove a menor
      precisions.pop(); // Remove a maior
    }
    if (presentations.length > 3) {
      presentations.sort((a, b) => a - b).shift();
      presentations.pop();
    }

    const precisionAvg = precisions.reduce((a, b) => a + b, 0) / precisions.length;
    const presentationAvg = presentations.reduce((a, b) => a + b, 0) / presentations.length;
    const finalScore = precisionAvg + presentationAvg;

    const formattedResult = {
      precisionAvg: parseFloat(precisionAvg.toFixed(2)),
      presentationAvg: parseFloat(presentationAvg.toFixed(2)),
      finalScore: parseFloat(finalScore.toFixed(2)), 
      rawScoreSum: parseFloat(rawScoreSum.toFixed(2))
    };

    // 'upsert' é útil aqui: ele cria se não existir, ou atualiza se o atleta já tiver uma nota.
    const result = await prisma.athleteResult.upsert({
      where: { 
        athleteId_tournamentId_presentationNumber: { 
          athleteId, 
          tournamentId, 
          presentationNumber: presentationNumber || 1 
        } 
      },
      update: formattedResult,
      create: { 
        athleteId, 
        tournamentId, 
        presentationNumber: presentationNumber || 1, 
        ...formattedResult 
      },
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível salvar as notas.' });
  }
};