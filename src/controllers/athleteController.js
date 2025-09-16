const prisma = require('../services/prisma');
const pdf = require('pdf-parse');

exports.uploadAthletesFromPDF = async (req, res) => {
  const { tournamentId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo PDF foi enviado.' });
  }

  try {
    const data = await pdf(req.file.buffer);
    const text = data.text;

    const lines = text.split('\n').filter(line => line.trim() !== ''); // Divide o texto em linhas e remove as vazias
    
    let currentCategory = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        const categoryName = line.substring(3).trim();

        currentCategory = await prisma.category.create({
          data: {
            name: categoryName,
            tournamentId: parseInt(tournamentId),
          },
        });
        console.log(`Categoria criada: ${categoryName}`);
      } 
      else if (/^\d+\.\s/.test(line) && currentCategory) {
        const athleteName = line.replace(/^\d+\.\s/, '').trim();
        await prisma.athlete.create({
          data: {
            name: athleteName,
            categoryId: currentCategory.id,
          },
        });
        console.log(`Atleta adicionado: ${athleteName} em ${currentCategory.name}`);
      }
    }

    res.status(200).json({ message: 'Atletas cadastrados com sucesso a partir do PDF!' });

  } catch (error) {
    console.error('Erro ao processar o PDF:', error);
    res.status(500).json({ error: 'Falha ao processar o arquivo PDF.' });
  }
};