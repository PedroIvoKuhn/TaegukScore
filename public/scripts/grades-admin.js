document.addEventListener('DOMContentLoaded', async () => {
  const categoriesContainer = document.getElementById('categories-container');
  const scoresForm = document.getElementById('scores-form');
  const currentAthleteNameEl = document.getElementById('current-athlete-name');
  const currentCategoryNameEl = document.getElementById('current-category-name');
  const clearScoreboardBtn = document.getElementById('clear-scoreboard-btn');
  const errorP = document.getElementById('form-error');
  const playVideoBtn = document.getElementById('play-video-btn');

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId');
  const token = localStorage.getItem('token');
  const socket = io();

  let tournamentData = null;
  let currentAthlete = null;
  let currentCategory = null;

  if (!tournamentId) {
    categoriesContainer.innerHTML = '<h1>Erro: ID do torneio não encontrado na URL.</h1>';
    return;
  }
  
  // Conecta na sala do Socket.IO
  socket.emit('join:tournament-room', tournamentId);

  // --- FUNÇÕES ---

  // Busca os dados do torneio e renderiza a lista de atletas
async function initializePanel() {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Não foi possível carregar os dados do torneio.');
    
    tournamentData = await response.json();

    // ===== AJUSTE DE SEGURANÇA AQUI =====
    // Encontra o link do placar
    const scoreboardLink = document.getElementById('open-scoreboard-link');
    // Só tenta modificar o href SE o link for encontrado
    if (scoreboardLink) {
      scoreboardLink.href = `../pages/scoreboard.html?tournamentId=${tournamentId}`;
    }
    // ===================================

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
        <h4>Árbitro: ${referee.username}</h4>
        <div>
          <label for="precision-${i}">Precisão:</label>
          <input type="number" step="0.1" id="precision-${i}" name="precision" required>
          <label for="presentation-${i}">Apresentação:</label>
          <input type="number" step="0.1" id="presentation-${i}" name="presentation" required>
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
        <button 
          class="show-leaderboard-btn" 
          data-category-id="${category.id}" 
          data-category-name="${category.name}"
          style="padding: 0.3rem 0.6rem; font-size: 0.8rem;"
        >
          Placar
        </button>
      </div>
    `;
      
      const athletesInCategory = tournamentData.athletes.filter(a => a.categoryId === category.id);
      
      athletesInCategory.forEach(athlete => {
        const athleteDiv = document.createElement('div');
        athleteDiv.className = 'athlete-item';
        athleteDiv.id = `athlete-${athlete.id}`;
        // ===== LÓGICA PARA MOSTRAR A NOTA =====
        // A API agora nos envia o resultado do atleta
        const result = athlete.results[0]; // Pegamos o primeiro (e único) resultado
        const scoreDisplay = result ? `<strong style="color: green;">${result.finalScore.toFixed(2)}</strong>` : '';

        // Se já tiver um resultado, marca como 'completed'
        if (result) {
          athleteDiv.classList.add('completed');
        }

        athleteDiv.innerHTML = `
          <span>${athlete.name} ${scoreDisplay}</span>
          <button class="present-btn" data-athlete-id="${athlete.id}" data-category-id="${category.id}">Apresentar</button>
        `;
        // ========================================
        categoryDiv.appendChild(athleteDiv);
      });
      categoriesContainer.appendChild(categoryDiv);
    });
  }

  // Função para lidar com o clique no botão "Apresentar"
  function handleSelectAthlete(event) {
    if (!event.target.classList.contains('present-btn')) return;

    const athleteId = parseInt(event.target.dataset.athleteId);
    const categoryId = parseInt(event.target.dataset.categoryId);

    currentAthlete = tournamentData.athletes.find(a => a.id === athleteId);
    currentCategory = tournamentData.categories.find(c => c.categoryId === categoryId).category;
    
    // Atualiza a UI
    currentAthleteNameEl.textContent = currentAthlete.name;
    currentCategoryNameEl.textContent = currentCategory.name;

    // Avisa a todos (placar, árbitros) via Socket.IO quem está se apresentando
    socket.emit('admin:select-athlete', {
      tournamentId: tournamentId,
      athleteId: currentAthlete.id,
      athleteName: currentAthlete.name,
      categoryName: currentCategory.name,
    });
    
    scoresForm.reset();
    errorP.textContent = '';
  }
  
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
    for (let i = 0; i < precisionInputs.length; i++) {
      scores.push({
        precision: parseFloat(precisionInputs[i].value),
        presentation: parseFloat(presentationInputs[i].value)
      });
    }

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          athleteId: currentAthlete.id,
          tournamentId: parseInt(tournamentId),
          scores: scores
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      const resultData = await response.json(); // A API nos retorna o resultado calculado

      alert(`Notas para ${currentAthlete.name} salvas com sucesso!`);
      
      // ===== EMITIR O EVENTO PARA O PLACAR =====
      socket.emit('scoreboard:update-score', {
        tournamentId: tournamentId,
        athleteName: currentAthlete.name,
        finalScore: resultData.finalScore,
        precisionAvg: resultData.precisionAvg,
        presentationAvg: resultData.presentationAvg,
        rawScores: scores
      });
      // =========================================

      // Atualiza a UI sem precisar recarregar a página
      const athleteDiv = document.getElementById(`athlete-${currentAthlete.id}`);
      athleteDiv.classList.add('completed');
      athleteDiv.querySelector('span').innerHTML = `${currentAthlete.name} <strong style="color: green;">${resultData.finalScore.toFixed(2)}</strong>`;

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
    // 1. Busca os resultados ordenados da API
    const response = await fetch(`/api/tournaments/${tournamentId}/category/${categoryId}/results`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Falha ao buscar placar da categoria.');
    
    const results = await response.json();
    
    // 2. Emite o evento para o telão com os dados
    socket.emit('admin:show-leaderboard', {
      tournamentId: tournamentId,
      categoryName: categoryName,
      results: results, // Envia a lista já ordenada
    });

    alert(`Comando para exibir o placar da categoria "${categoryName}" enviado para o telão.`);

  } catch (error) {
    alert(error.message);
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
      // Emite um evento para o servidor, que retransmitirá para o placar
      socket.emit('admin:play-video', { tournamentId });
    });
  }

  initializePanel();
});