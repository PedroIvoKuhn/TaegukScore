document.addEventListener('DOMContentLoaded', async () => {
  const categoriesContainer = document.getElementById('categories-container');
  const scoresForm = document.getElementById('scores-form');
  const currentAthleteNameEl = document.getElementById('current-athlete-name');
  const currentCategoryNameEl = document.getElementById('current-category-name');
  const errorP = document.getElementById('form-error');
  const openScoreboardLink = document.getElementById('open-scoreboard-link');
  const clearScoreboardBtn = document.getElementById('clear-scoreboard-btn');
  const playVideoBtn = document.getElementById('play-video-btn');
  const downloadReportBtn = document.getElementById('download-report-btn');
  const leaderboardModal = document.getElementById('leaderboard-modal');
  const leaderboardTitle = document.getElementById('leaderboard-title');
  const leaderboardContent = document.getElementById('leaderboard-content');

  // --- Estado e Configuração ---
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId');
  const token = localStorage.getItem('token');
  const socket = io();

  let tournamentData = null;
  let currentAthlete = null;
  let currentCategory = null;

  const DUAL_PRESENTATION_CATEGORIES = [
  'WT - Individual Infantil Masculino',
  'WT - Individual Cadete Feminino',
  'WT - Individual Junior Feminino',
  'WT - Individual Junior Masculino',
  'WT - Individual S30 Masculino',
  'WT - Individual S40 Masculino',
  'WT - Individual S50 Masculino',
  'WT - Par Junior',
  'WT - Par S30',
];

  if (!tournamentId) {
    categoriesContainer.innerHTML = '<h1>Erro: ID do torneio não encontrado na URL.</h1>';
    return;
  }

  socket.emit('join:tournament-room', tournamentId);

  // --- FUNÇÕES ---
  async function initializePanel() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Não foi possível carregar os dados do torneio.');
      
      tournamentData = await response.json();

      if (openScoreboardLink) {
        openScoreboardLink.href = `../pages/scoreboard.html?tournamentId=${tournamentId}`;
      }

      renderAthleteList();
      generateScoreInputs();
    } catch (error) {
      categoriesContainer.innerHTML = `<h1>${error.message}</h1>`;
    }
  }
  
  // Gera os inputs para as notas dos árbitros
  function generateScoreInputs() {
    scoresForm.innerHTML = '';
    const refereeCount = tournamentData.referees.length;
    for (let i = 0; i < refereeCount; i++) {
      const referee = tournamentData.referees[i].referee;
      scoresForm.innerHTML += `
        <div style="margin-bottom: 2rem; background-color: #2B2B2B; padding: 2rem; border-radius: 12px; border-left: 4px solid var(--roxo);">
          <h3 style="font-size: 2.4rem; color: white; margin-bottom: 1.5rem;">Árbitro: <span style="color: var(--roxo)">${referee.username}</span></h3>
          <div style="display: flex; gap: 2rem; align-items: flex-end;">
            <div style="flex: 1;">
              <label for="precision-${i}" style="margin-bottom: 0.5rem; display: block; font-size: 1.6rem; color: var(--text-secondary);">Precisão (0-4):</label>
              <input type="number" step="0.01" min="0" max="4" id="precision-${i}" name="precision" required>
            </div>
            <div style="flex: 1;">
              <label for="presentation-${i}" style="margin-bottom: 0.5rem; display: block; font-size: 1.6rem; color: var(--text-secondary);">Apresentação (0-6):</label>
              <input type="number" step="0.01" min="0" max="6" id="presentation-${i}" name="presentation" required>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Monta a lista de atletas na barra lateral
  function renderAthleteList() {
    categoriesContainer.innerHTML = '';
    tournamentData.categories.forEach(catInTourn => {
      const category = catInTourn.category;
      const categoryDiv = document.createElement('div');
      
      categoryDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; margin-bottom: 0.5rem;">
          <h3>${category.name}</h3>
          <button class="show-leaderboard-btn" data-category-id="${category.id}" data-category-name="${category.name}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
            Placar
          </button>
        </div>
      `;

      const athletesInCategory = tournamentData.athletes.filter(a => a.categoryId === category.id);
      
      athletesInCategory.forEach(athlete => {
        const athleteDiv = document.createElement('div');
        athleteDiv.className = 'athlete-item';
        athleteDiv.id = `athlete-${athlete.id}`;
        
        if (DUAL_PRESENTATION_CATEGORIES.includes(category.name)) {
          const result1 = athlete.results.find(r => r.presentationNumber === 1);
          const score1 = result1 ? `<strong style="color:green;">${result1.finalScore.toFixed(2)}</strong>` : '';
          const completed1 = result1 ? 'completed' : '';

          const result2 = athlete.results.find(r => r.presentationNumber === 2);
          const score2 = result2 ? `<strong style="color:green;">${result2.finalScore.toFixed(2)}</strong>` : '';
          const completed2 = result2 ? 'completed' : '';

          athleteDiv.innerHTML = `
            <span>${athlete.name} (1: ${score1} | 2: ${score2})</span>
            <div>
              <button class="present-btn ${completed1}" data-athlete-id="${athlete.id}" data-category-id="${category.id}" data-presentation-number="1">Apres. 1</button>
              <button class="present-btn ${completed2}" data-athlete-id="${athlete.id}" data-category-id="${category.id}" data-presentation-number="2">Apres. 2</button>
            </div>
          `;
        } else {
          const result = athlete.results[0];
          const scoreDisplay = result ? `<strong style="color: green;">${result.finalScore.toFixed(2)}</strong>` : '';
          if (result) athleteDiv.classList.add('completed');
          
          athleteDiv.innerHTML = `
            <span>${athlete.name} ${scoreDisplay}</span>
            <button class="present-btn" data-athlete-id="${athlete.id}" data-category-id="${category.id}" data-presentation-number="1">Apresentar</button>
          `;
        }
        categoryDiv.appendChild(athleteDiv);
      });
      categoriesContainer.appendChild(categoryDiv);
    });
  }

  // Função para lidar com o clique no botão "Apresentar"
  function handleSelectAthlete(event) {
    if (!event.target.classList.contains('present-btn')) return;

    const button = event.target;
    const athleteId = parseInt(button.dataset.athleteId);
    const categoryId = parseInt(button.dataset.categoryId);
    const presentationNumber = parseInt(button.dataset.presentationNumber); 

    currentAthlete = tournamentData.athletes.find(a => a.id === athleteId);
    currentAthlete.presentationNumber = presentationNumber;
    currentCategory = tournamentData.categories.find(c => c.categoryId === categoryId).category;
    
    currentAthleteNameEl.textContent = `${currentAthlete.name} (${presentationNumber}ª Apres.)`;
    currentCategoryNameEl.textContent = currentCategory.name;

    socket.emit('admin:select-athlete', {
      tournamentId: tournamentId,
      athleteId: currentAthlete.id,
      athleteName: currentAthlete.name,
      categoryName: currentCategory.name,
    });
    
    scoresForm.reset();
    errorP.textContent = '';
  }
  
  // Função para enviar as notas para a API
  async function handleSubmitScores(event) {
    event.preventDefault();
    if (!currentAthlete) {
      errorP.textContent = 'Por favor, selecione um atleta para "Apresentar" antes de salvar as notas.';
      return;
    }
    errorP.textContent = '';
    
    const precisionInputs = document.querySelectorAll('input[name="precision"]');
    const presentationInputs = document.querySelectorAll('input[name="presentation"]');
    
    const scores = [];
    let validationError = null;

    for (let i = 0; i < precisionInputs.length; i++) {
      const precision = parseFloat(precisionInputs[i].value);
      const presentation = parseFloat(presentationInputs[i].value);
      if (isNaN(precision) || precision < 0 || precision > 4) {
        validationError = `Nota de precisão do Árbitro ${i + 1} é inválida.`;
        break;
      }
      if (isNaN(presentation) || presentation < 0 || presentation > 6) {
        validationError = `Nota de apresentação do Árbitro ${i + 1} é inválida.`;
        break;
      }
      scores.push({ precision, presentation });
    }

    if (validationError) {
      errorP.textContent = validationError;
      return;
    }

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          athleteId: currentAthlete.id,
          tournamentId: parseInt(tournamentId),
          scores: scores,
          presentationNumber: currentAthlete.presentationNumber
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      const resultData = await response.json();
      alert(`Notas para ${currentAthlete.name} salvas com sucesso!`);
      
      socket.emit('scoreboard:update-score', {
        tournamentId: tournamentId,
        athleteName: currentAthlete.name,
        finalScore: resultData.finalScore,
        precisionAvg: resultData.precisionAvg,
        presentationAvg: resultData.presentationAvg,
        rawScores: scores
      });

      // Atualiza a UI sem precisar recarregar a página
      const athleteResult = tournamentData.athletes.find(a => a.id === currentAthlete.id).results;
      athleteResult.push(resultData); // Adiciona o novo resultado
      renderAthleteList(); // Re-renderiza a lista para mostrar a nova nota

      currentAthlete = null;
      currentAthleteNameEl.textContent = 'Nenhum';
      currentCategoryNameEl.textContent = 'Nenhuma';
      scoresForm.reset();

    } catch (error) {
      errorP.textContent = error.message;
    }
  }
  async function handleShowLeaderboard(event) {
    if (!event.target.classList.contains('show-leaderboard-btn')) return;
    
    const categoryId = event.target.dataset.categoryId;
    const categoryName = event.target.dataset.categoryName;
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/category/${categoryId}/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar placar da categoria.');
      
      const results = await response.json();
      
      socket.emit('admin:show-leaderboard', {
        tournamentId: tournamentId,
        categoryName: categoryName,
        results: results,
      });

      alert(`Comando para exibir o placar da categoria "${categoryName}" enviado para o telão.`);
    } catch (error) {
      alert(error.message);
    }
  }

async function handleDownloadReport() {
  const { jsPDF } = window.jspdf;
  
  downloadReportBtn.textContent = 'Gerando...';
  downloadReportBtn.disabled = true;

  try {
    const response = await fetch(`/api/tournaments/${tournamentId}/report`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Falha ao buscar dados do relatório.');
    
    const reportData = await response.json();
    const doc = new jsPDF();
    let y = 15; // Posição vertical inicial no PDF

    // Título
    doc.setFontSize(22);
    doc.text(reportData.tournamentName, 10, y);
    y += 15;

    // Árbitros
    doc.setFontSize(14);
    doc.text('Equipe de Árbitros:', 10, y);
    y += 7;
    doc.setFontSize(10);
    reportData.referees.forEach(referee => {
      doc.text(`- ${referee}`, 15, y);
      y += 5;
    });
    y += 10;

    // Leaderboards de cada categoria
    reportData.leaderboards.forEach(leaderboard => {
      // Adiciona uma nova página se não houver espaço suficiente
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      
      doc.setFontSize(16);
      doc.text(leaderboard.categoryName, 10, y);
      y += 10;
      doc.setFontSize(12);

      if (leaderboard.results.length === 0) {
        doc.text('Nenhum resultado finalizado.', 15, y);
        y += 7;
      } else {
        leaderboard.results.forEach((result, index) => {
          const resultBlockHeight = (result.presentations && result.presentations.length > 1) ? 14 : 7;
          if (y + resultBlockHeight > 280) {
            doc.addPage();
            y = 15;
          }

          const resultText = 
            `${index + 1}º - ${result.name}: ` +
            `Final: ${result.finalScore.toFixed(2)} | ` +
            `Precisão: ${result.precisionAvg.toFixed(2)} | ` +
            `Apresentação: ${result.presentationAvg.toFixed(2)}`;
          doc.text(resultText, 15, y);
          y += 7;

          if (result.presentations && result.presentations.length > 1) {
            result.presentations.sort((a,b) => a.presentationNumber - b.presentationNumber).forEach(presentation => {
              const presentationText = 
                `   - Apres. ${presentation.presentationNumber}: ` +
                `Nota: ${presentation.score.toFixed(2)} | ` +
                `Precisão: ${presentation.precisionAvg.toFixed(2)} | ` +
                `Apres.: ${presentation.presentationAvg.toFixed(2)}`;
              
              doc.setFontSize(10);
              doc.text(presentationText, 15, y);
              y += 5;
              doc.setFontSize(12); // Volta a fonte ao normal
            });
            y += 2; 
          }
        });
      }
      y += 10;
    });

    doc.save(`relatorio_${reportData.tournamentName.replace(/\s+/g, '_')}.pdf`);

  } catch (error) {
    alert(error.message);
  } finally {
    downloadReportBtn.textContent = 'Baixar Relatório';
    downloadReportBtn.disabled = false;
  }
}

  // --- EVENT LISTENERS ---
  categoriesContainer.addEventListener('click', handleSelectAthlete);
  scoresForm.addEventListener('submit', handleSubmitScores);
  categoriesContainer.addEventListener('click', handleShowLeaderboard);

  if (clearScoreboardBtn) {
  clearScoreboardBtn.addEventListener('click', () => {
      socket.emit('scoreboard:clear-score', { tournamentId });
      //console.log('Comando para limpar o placar enviado.');
    });
  }
  if (playVideoBtn) {
    playVideoBtn.addEventListener('click', () => {
      socket.emit('admin:play-video', { tournamentId });
    });
  }
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', handleDownloadReport);
  }

  initializePanel();
});