const prisma = require('../services/prisma');
const pdf = require('pdf-parse');

exports.uploadAthletesFromPDF = async (req, res) => {
  const { tournamentId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
  }

  try {
    const data = await pdf(req.file.buffer);
    const lines = data.text.split('\n').filter(line => line.trim() !== '');
    
    let currentMasterCategory = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        const categoryName = line.substring(3).trim();

        currentMasterCategory = await prisma.category.findUnique({
          where: { name: categoryName },
        });

        if (!currentMasterCategory) {
          console.warn(`Aviso: Categoria "${categoryName}" do PDF não foi encontrada na tabela mestre e será ignorada.`);
          continue;
        }

        await prisma.categoryInTournament.create({
          data: {
            tournamentId: parseInt(tournamentId),
            categoryId: currentMasterCategory.id,
          },
        });
      } 
      else if (/^\d+\.\s/.test(line) && currentMasterCategory) {
        const athleteName = line.replace(/^\d+\.\s/, '').trim();
        await prisma.athlete.create({
          data: {
            name: athleteName,
            tournamentId: parseInt(tournamentId),
            categoryId: currentMasterCategory.id,
          },
        });
      }
    }

    res.status(200).json({ message: 'Atletas cadastrados com sucesso a partir do PDF!' });

  } catch (error) {
    console.error('Erro ao processar o PDF:', error);
    res.status(500).json({ error: 'Falha ao processar o arquivo PDF.' });
  }
};