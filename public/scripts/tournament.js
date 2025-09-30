document.addEventListener('DOMContentLoaded', () => {
  // Elementos da Navbar
  const navLoggedOut = document.getElementById('nav-logged-out');
  const navLoggedIn = document.getElementById('nav-logged-in');
  const usernameDisplay = document.getElementById('username-display');
  const logoutBtn = document.getElementById('logout-btn');
  const loginBtn = document.getElementById('login-btn');

  // Elementos de Detalhes do Torneio
  const tournamentNameEl = document.getElementById('tournament-name');
  const tournamentLocationEl = document.getElementById('tournament-location');
  const tournamentDescriptionEl = document.getElementById('tournament-description');
  const categoriesContainer = document.getElementById('categories-container');
  const actionButtonsContainer = document.getElementById('action-buttons');
  
  // --- Dados da URL e Estado ---
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');
  let currentUser = null;

  function handleLogout() {
    localStorage.removeItem('token');
    location.reload(); 
  }

  async function updateNavbar() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Token inválido');

        currentUser = await response.json(); // Armazena o usuário logado
        usernameDisplay.textContent = `Olá, ${currentUser.username}`;
        navLoggedOut.style.display = 'none';
        navLoggedIn.style.display = 'block';
      } catch (err) {
        handleLogout();
      }
    } else {
      currentUser = null;
      navLoggedOut.style.display = 'block';
      navLoggedIn.style.display = 'none';
    }
  }
  
  // Função para buscar os detalhes do torneio
  async function fetchTournamentDetails() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        throw new Error('Torneio não encontrado.');
      }
      const tournament = await response.json();
      renderTournament(tournament);
      renderActionButtons(tournament);
    } catch (error) {
      if (tournamentNameEl) {
        tournamentNameEl.textContent = `Erro: ${error.message}`;
      } else {
        console.error("Elemento 'tournament-name' não encontrado.", error);
      }
    }
  }

  function renderActionButtons(tournament) {
    if (!actionButtonsContainer) return;
    actionButtonsContainer.innerHTML = '';

    if (!currentUser) return;

    if (currentUser.role === 'ADMIN') {
      const adminButton = document.createElement('a');
      adminButton.href = `/pages/grades.html?tournamentId=${tournament.id}`;
      adminButton.className = 'button';
      adminButton.textContent = 'Gerenciar Notas e Placar';
      actionButtonsContainer.appendChild(adminButton);
    } else if (currentUser.role === 'REFEREE') {
      const isRefereeInTournament = tournament.referees.some(ref => ref.referee.id === currentUser.id);
      if (isRefereeInTournament) {
        const refereeButton = document.createElement('a');
        refereeButton.href = `/pages/referee-panel.html?tournamentId=${tournament.id}`;
        refereeButton.className = 'button';
        refereeButton.textContent = 'Avaliar Atletas';
        actionButtonsContainer.appendChild(refereeButton);
      }
    }
  }

  function renderTournament(tournament) {
    if (!categoriesContainer || !tournamentNameEl) return;

    document.title = tournament.name;
    tournamentNameEl.textContent = tournament.name;
    tournamentLocationEl.textContent = tournament.localizacao || 'Não informado';
    tournamentDescriptionEl.textContent = tournament.descricao || 'Sem descrição.';
    categoriesContainer.innerHTML = '<h2>Categorias e Atletas</h2>';

    if (tournament.categories.length === 0) {
      categoriesContainer.innerHTML += '<p>Nenhuma categoria definida para este torneio.</p>';
      return;
    }

    tournament.categories.forEach(categoryInTournament => {
      const category = categoryInTournament.category;
      const categoryBlock = document.createElement('div');
      categoryBlock.className = 'category-block';
      const athletesInCategory = tournament.athletes.filter(athlete => athlete.categoryId === category.id);
      let athletesHtml = '<p>Nenhum atleta nesta categoria.</p>';
      if (athletesInCategory.length > 0) {
        athletesHtml = athletesInCategory.map(athlete => `<li>${athlete.name}</li>`).join('');
        athletesHtml = `<ul class="athlete-list">${athletesHtml}</ul>`;
      }
      categoryBlock.innerHTML = `<h3>${category.name}</h3>${athletesHtml}`;
      categoriesContainer.appendChild(categoryBlock);
    });
  }

  // --- INICIALIZAÇÃO DA PÁGINA ---
  async function initializePage() {
    if (!tournamentId) {
      if(tournamentNameEl) tournamentNameEl.textContent = 'Erro: ID do torneio não encontrado na URL.';
      return;
    }
    await updateNavbar();      // Primeiro, atualiza a navbar e descobre quem está logado
    await fetchTournamentDetails(); // Depois, busca os dados do torneio e renderiza tudo
  }
  
  // Adiciona listeners aos botões da navbar que existem nesta página
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = '/'; 
    });
  }

  initializePage();
});