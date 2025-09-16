document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const tournamentsContainer = document.getElementById('tournaments-container');

  const navLoggedOut = document.getElementById('nav-logged-out');
  const navLoggedIn = document.getElementById('nav-logged-in');
  const usernameDisplay = document.getElementById('username-display');
  const logoutBtn = document.getElementById('logout-btn');
  const adminControls = document.getElementById('admin-controls');

  const loginModal = document.getElementById('login-modal');
  const loginBtn = document.getElementById('login-btn');
  const closeModalBtn = document.querySelector('.close-button');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  async function updateNavbar() {
    const currentToken = localStorage.getItem('token');
    adminControls.style.display = 'none'; 
    
    if (currentToken) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        if (!response.ok) throw new Error('Token inválido');

        const user = await response.json();
        usernameDisplay.textContent = `Olá, ${user.username}`;
        usernameDisplay.style.fontFamily = `Arial`
        navLoggedOut.style.display = 'none';
        navLoggedIn.style.display = 'block';

        if (user.role === 'ADMIN') {
          adminControls.style.display = 'block';
        }

      } catch (err) {
        handleLogout();
      }
    } else {
      navLoggedOut.style.display = 'block';
      navLoggedIn.style.display = 'none';
      usernameDisplay.textContent = '';
    }
  }

  async function fetchTournaments() {
    try {
      const response = await fetch('/api/tournaments');
      const tournaments = await response.json();
      tournamentsContainer.innerHTML = '';

      if (tournaments.length === 0) {
        tournamentsContainer.innerHTML = '<p>Nenhum torneio agendado no momento.</p>';
        return;
      }

      tournaments.forEach(tourney => {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        card.innerHTML = `
          <h3>${tourney.name}</h3>
          <p>Data: ${new Date(tourney.date).toLocaleDateString('pt-BR')}</p>
          <p>Organizador: ${tourney.organizer.username}</p>
          <a href="#">Ver Torneio</a>
        `;
        tournamentsContainer.appendChild(card);
      });
    } catch (error) {
      tournamentsContainer.innerHTML = '<p>Erro ao carregar torneios.</p>';
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    loginError.textContent = '';
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Usuário ou senha inválidos.');
      }
      const data = await response.json();
      localStorage.setItem('token', data.token);

      loginModal.style.display = 'none';
      loginForm.reset();
      updateNavbar();

    } catch (error) {
      loginError.textContent = error.message;
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    updateNavbar();
  }

  loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == loginModal) {
      loginModal.style.display = 'none';
    }
  });

  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  updateNavbar();
  fetchTournaments();
});