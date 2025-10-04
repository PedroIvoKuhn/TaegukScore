// public/scripts/scoreboard.js
document.addEventListener('DOMContentLoaded', () => {
  // Visões
  const liveScoreView = document.getElementById('live-score-view');
  const leaderboardView = document.getElementById('leaderboard-view');
  const videoView = document.getElementById('video-view');
  const videoPlayer = document.getElementById('looping-video');

  // ==================== AS CONSTANTES QUE FALTAVAM ESTÃO AQUI ====================
  // Elementos da Visão Ao Vivo
  const currentAthleteNameEl = document.getElementById('current-athlete-name');
  const currentCategoryNameEl = document.getElementById('current-category-name');
  const finalScoreEl = document.getElementById('score');
  const presentationAvgEl = document.getElementById('presentationAvg');
  const accuracyAvgEl = document.getElementById('accuracyAvg');
  const individualScoresContainer = document.getElementById('individual-scores-container');
  
  // Elementos do Leaderboard
  const leaderboardTitle = document.getElementById('leaderboard-title');
  const leaderboardList = document.getElementById('leaderboard-list');
  // ============================================================================

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId');
  const socket = io();

  if (!tournamentId) {
    if (currentAthleteNameEl) currentAthleteNameEl.textContent = 'ERRO: ID do torneio não encontrado.';
    return;
  }
  socket.emit('join:tournament-room', tournamentId);

  if (videoPlayer) {
    videoPlayer.addEventListener('ended', () => {
      videoPlayer.currentTime = 0; // Reinicia o tempo do vídeo para o início
      videoPlayer.play(); // Manda tocar de novo
      console.log('Vídeo terminou, reiniciando o loop via JS.');
    });
  }

  // Função para limpar e voltar para a visão principal
  function clearScoreboard() {
    liveScoreView.style.display = 'block'; // Mostra a visão principal
    leaderboardView.style.display = 'none';
    videoView.style.display = 'none'; // Esconde o vídeo
    if (videoPlayer) videoPlayer.pause(); // Pausa o vídeo para economizar recursos
    
    // Agora essas variáveis existem e a função não vai mais quebrar
    finalScoreEl.textContent = '-';
    presentationAvgEl.textContent = '-';
    accuracyAvgEl.textContent = '-';
    currentAthleteNameEl.textContent = 'Aguardando atleta...';
    currentCategoryNameEl.textContent = '';
    individualScoresContainer.innerHTML = '';
  }

  // --- LISTENERS DE EVENTOS DO SOCKET ---

  // Mostra a visão de vídeo
  socket.on('scoreboard:display-video', () => {
    liveScoreView.style.display = 'none';
    leaderboardView.style.display = 'none';
    videoView.style.display = 'flex';
    if (videoPlayer) {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    }
  });

  // Mostra o leaderboard
  socket.on('scoreboard:display-leaderboard', (data) => {
    liveScoreView.style.display = 'none';
    videoView.style.display = 'none';
    leaderboardView.style.display = 'block';
    
    leaderboardTitle.textContent = `Resultado Final - ${data.categoryName}`;
    leaderboardList.innerHTML = '';

    if (data.results.length === 0) {
      leaderboardList.innerHTML = '<li>Nenhum resultado finalizado para esta categoria.</li>';
      return;
    }

    data.results.forEach(result => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${result.athlete.name} - <strong>${result.finalScore.toFixed(2)}</strong> 
        <small>(Apresentação: ${result.precisionAvg.toFixed(2)} | Soma Bruta: ${result.rawScoreSum.toFixed(2)})</small>
      `;
      leaderboardList.appendChild(li);
    });
  });

  // Mostra a nota de um atleta
  socket.on('scoreboard:update-athlete', (data) => {
    clearScoreboard(); // Reseta para a visão principal
    currentAthleteNameEl.textContent = data.athleteName;
    currentCategoryNameEl.textContent = data.categoryName;
  });
  
  // Atualiza a nota na visão principal
  socket.on('scoreboard:update-score', (data) => {
    finalScoreEl.textContent = data.finalScore.toFixed(2);
    presentationAvgEl.textContent = data.presentationAvg.toFixed(2);
    accuracyAvgEl.textContent = data.precisionAvg.toFixed(2);
    individualScoresContainer.innerHTML = '';
    if (data.rawScores && Array.isArray(data.rawScores)) {
      data.rawScores.forEach((score, index) => {
        const scoreDiv = document.createElement('div');
        scoreDiv.style.fontSize = '2rem';
        scoreDiv.innerHTML = `<strong>Árbitro ${index + 1}:</strong> Precisão: ${score.precision.toFixed(1)} | Apresentação: ${score.presentation.toFixed(1)}`;
        individualScoresContainer.appendChild(scoreDiv);
      });
    }
  });
  
  // Limpa o placar (volta para a visão principal)
  socket.on('scoreboard:clear', () => {
    clearScoreboard();
  });
  clearScoreboard();
  console.log(`Placar conectado à sala do torneio ${tournamentId}`);
});