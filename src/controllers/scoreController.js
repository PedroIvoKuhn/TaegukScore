// src/controllers/scoreController.js
const prisma = require('../services/prisma');

// Recebe as notas dos árbitros, calcula a média e salva o resultado final
exports.submitScores = async (req, res) => {
  const { athleteId, tournamentId, scores } = req.body; // scores = [{precision: 4.0, presentation: 5.5}, ...]

  if (!athleteId || !tournamentId || !scores || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  try {
    // --- Lógica de Cálculo (similar à que você tinha no front-end) ---
    let precisions = scores.map(s => s.precision).filter(n => !isNaN(n));
    let presentations = scores.map(s => s.presentation).filter(n => !isNaN(n));

    const rawScoreSum = [...precisions, ...presentations].reduce((a, b) => a + b, 0);

    // Descarta a maior e a menor nota se houver mais de 3 árbitros
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

    // 'upsert' é útil aqui: ele cria se não existir, ou atualiza se o atleta já tiver uma nota.
    const result = await prisma.athleteResult.upsert({
      where: { athleteId_tournamentId: { athleteId, tournamentId } },
      update: { finalScore, precisionAvg, presentationAvg, rawScoreSum  },
      create: { athleteId, tournamentId, finalScore, precisionAvg, presentationAvg, rawScoreSum  },
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Não foi possível salvar as notas.' });
  }
};