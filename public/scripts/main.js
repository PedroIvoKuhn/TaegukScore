document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const tournamentsContainer = document.getElementById('tournaments-container');

  const navLoggedOut = document.getElementById('nav-logged-out');
  const navLoggedIn = document.getElementById('nav-logged-in');
  const usernameDisplay = document.getElementById('username-display');
  const logoutBtn = document.getElementById('logout-btn');

  const adminControls = document.getElementById('admin-controls');
  const createTournamentBtn = document.getElementById('create-tournament-btn');
  const createRefereeBtn = document.getElementById('create-referee-btn');

  const createRefereeModal = document.getElementById('create-referee-modal');
  const createRefereeForm = document.getElementById('create-referee-form');

  const createTournamentModal = document.getElementById('create-tournament-modal');
  const createTournamentForm = document.getElementById('create-tournament-form');
  const tournamentRefereesSelect = document.getElementById('tournament-referees');

  const allModals = document.querySelectorAll('.modal');
  const allCloseButtons = document.querySelectorAll('.close-button');

  const loginModal = document.getElementById('login-modal');
  const loginBtn = document.getElementById('login-btn');
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
          <a href="/tournament.html?id=${tourney.id}">Ver Detalhes do Torneio</a>
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

  async function handleCreateReferee(event) {
    event.preventDefault();
    const form = event.target;
    const errorP = form.querySelector('.referee-error');
    errorP.textContent = '';

    const username = form.username.value;
    const password = form.password.value;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/admin/create-referee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Não foi possível criar o árbitro.');
      }
      
      alert('Árbitro criado com sucesso!');
      createRefereeModal.style.display = 'none';
      form.reset();

    } catch (error) {
      errorP.textContent = error.message;
    }
  }

  async function handleCreateTournament(event) {
  event.preventDefault();
  const form = createTournamentForm; 
  const errorP = form.querySelector('.form-error');
  errorP.textContent = '';

  const token = localStorage.getItem('token');

  const tournamentData = {
    name: form.name.value,
    date: form.date.value,
    location: form.location.value,
    description: form.description.value
  };
  const selectedRefereesIds = [...tournamentRefereesSelect.selectedOptions].map(option => parseInt(option.value));

  if (selectedRefereesIds.length < 3) {
    errorP.textContent = 'É necessário selecionar no mínimo 3 árbitros para o torneio.';
    return;
  }

  const pdfFile = form.pdfFile.files[0];

  try {
    const createResponse = await fetch('/api/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tournamentData)
    });

    if (!createResponse.ok) {
      const errData = await createResponse.json();
      throw new Error(errData.error || 'Não foi possível criar o torneio.');
    }

    const newTournament = await createResponse.json();

    if (selectedRefereesIds.length > 0){
      const refereesResponse = await fetch(`/api/tournaments/${newTournament.id}/referees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refereeIds: selectedRefereesIds })
      });

      if (!refereesResponse.ok) {
        const errData = await refereesResponse.json();
        throw new Error(`Torneio criado, mas falha ao adicionar árbitros: ${errData.error}`);
      }
    }

    if (pdfFile) {
      const formData = new FormData();
      formData.append('pdfFile', pdfFile);

      const uploadResponse = await fetch(`/api/athletes/upload/tournament/${newTournament.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json();
        throw new Error(`Torneio criado, mas falha no upload do PDF: ${errData.error}`);
      }
    }

    alert('Torneio e atletas cadastrados com sucesso!');
    createTournamentModal.style.display = 'none';
    form.reset();
    fetchTournaments();
  } catch (error) {
    errorP.textContent = error.message;
  }
}

async function populateRefereesDropdown() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/users/referees', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Falha ao buscar árbitros');
    
    const referees = await response.json();
    tournamentRefereesSelect.innerHTML = '';

    referees.forEach(referee => {
      const option = document.createElement('option');
      option.value = referee.id;
      option.textContent = referee.username;
      tournamentRefereesSelect.appendChild(option);
    });

  } catch (error) {
    console.error(error);
    tournamentRefereesSelect.innerHTML = '<option disabled>Não foi possível carregar os árbitros</option>';
  }
}

  if (createRefereeBtn) {
    createRefereeBtn.addEventListener('click', () => {
      createRefereeModal.style.display = 'flex';
    });
  }
  if (createTournamentBtn) {
    createTournamentBtn.addEventListener('click', async () => {
    await populateRefereesDropdown(); 
    createTournamentModal.style.display = 'flex';
  });
  }

  allCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
      button.closest('.modal').style.display = 'none';
    });
  });

  window.addEventListener('click', (event) => {
    allModals.forEach(modal => {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    });
  });

  loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
  });

  window.addEventListener('click', (event) => {
    if (event.target == loginModal) {
      loginModal.style.display = 'none';
    }
  });

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      loginModal.style.display = 'flex';
    });
  }
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (createRefereeForm) {
    createRefereeForm.addEventListener('submit', handleCreateReferee);
  }
  if (createTournamentForm) {
    createTournamentForm.addEventListener('submit', handleCreateTournament);
  }

  updateNavbar();
  fetchTournaments();
});