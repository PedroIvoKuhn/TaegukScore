document.addEventListener('DOMContentLoaded', () => {
  // Visões
  const liveScoreView = document.getElementById('live-score-view');
  const leaderboardView = document.getElementById('leaderboard-view');
  const videoView = document.getElementById('video-view');
  const videoPlayer = document.getElementById('looping-video');

  const currentAthleteNameEl = document.getElementById('current-athlete-name');
  const currentCategoryNameEl = document.getElementById('current-category-name');
  const finalScoreEl = document.getElementById('score');
  const presentationAvgEl = document.getElementById('presentationAvg');
  const precisionAvgEl = document.getElementById('precisionAvg');
  const individualScoresContainer = document.getElementById('individual-scores-container');

  const leaderboardTitle = document.getElementById('leaderboard-title');
  const leaderboardList = document.getElementById('leaderboard-list');


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
      videoPlayer.currentTime = 0;
      videoPlayer.play();
      console.log('Vídeo terminou, reiniciando o loop via JS.');
    });
  }

  function clearScoreboard() {
    liveScoreView.style.display = 'block'; // Mostra a visão principal
    leaderboardView.style.display = 'none';
    videoView.style.display = 'none'; // Esconde o vídeo
    if (videoPlayer) videoPlayer.pause(); // Pausa o vídeo para economizar recursos
    
    // Agora essas variáveis existem e a função não vai mais quebrar
    finalScoreEl.textContent = '-';
    presentationAvgEl.textContent = '-';
    precisionAvgEl.textContent = '-';
    currentAthleteNameEl.textContent = 'Aguardando atleta...';
    currentCategoryNameEl.textContent = '';
    individualScoresContainer.innerHTML = '';
  }

  // --- LISTENERS DE EVENTOS DO SOCKET ---

  socket.on('scoreboard:display-video', () => {
    liveScoreView.style.display = 'none';
    leaderboardView.style.display = 'none';
    videoView.style.display = 'flex';
    if (videoPlayer) {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    }
  });

  socket.on('scoreboard:display-leaderboard', (data) => {
    liveScoreView.style.display = 'none';
    videoView.style.display = 'none';
    leaderboardView.style.display = 'block';
    
    leaderboardTitle.textContent = `Classificação Final - ${data.categoryName}`;
    leaderboardTitle.className = 'top-leaderboard'
    leaderboardList.innerHTML = '';

    if (data.results.length === 0) {
      leaderboardList.innerHTML = '<li>Nenhum resultado finalizado para esta categoria.</li>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉', '🥉'];
    data.results.forEach((result, index) => {
      const li = document.createElement('li');
      li.className = 'leaderboard-item'; 

      const medal = medals[index] || '🎗️';

      li.innerHTML = `
            <span class="medal">${medal}</span>
            <span class="athlete-name">${result.athlete.name}</span>
            <span class="finalScore">${result.finalScore.toFixed(2)}</span>
            <span class="podium-presentation">${result.presentationAvg.toFixed(2)}</span>
            <span class="rawSum">${result.rawScoreSum.toFixed(2)}</span>
        `;
      leaderboardList.appendChild(li);
    });
  });


  socket.on('scoreboard:update-athlete', (data) => {
    clearScoreboard();
    currentAthleteNameEl.textContent = data.athleteName;
    currentCategoryNameEl.textContent = data.categoryName;
  });
  
  socket.on('scoreboard:update-score', (data) => {
    finalScoreEl.textContent = data.finalScore.toFixed(2);
    presentationAvgEl.textContent = data.presentationAvg.toFixed(2);
    precisionAvgEl.textContent = data.precisionAvg.toFixed(2);
    individualScoresContainer.innerHTML = '';
    if (data.rawScores && Array.isArray(data.rawScores)) {
      data.rawScores.forEach((score, index) => {
        const scoreDiv = document.createElement('div');
        scoreDiv.style.fontSize = '2rem';
        scoreDiv.className = 'grades';
        scoreDiv.innerHTML = `<span class="index">${index + 1}</span>  <span class="precision">${score.precision.toFixed(2)}</span> <span class="presentation">${score.presentation.toFixed(2)}</span>`;
        individualScoresContainer.appendChild(scoreDiv);
      });
    }
  });

  socket.on('scoreboard:clear', () => {
    clearScoreboard();
  });
  clearScoreboard();
  console.log(`Placar conectado à sala do torneio ${tournamentId}`);
});