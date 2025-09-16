document.addEventListener('DOMContentLoaded', () => {
  const tournamentNameEl = document.getElementById('tournament-name');
  const tournamentLocationEl = document.getElementById('tournament-location');
  const tournamentDescriptionEl = document.getElementById('tournament-description');
  const categoriesContainer = document.getElementById('categories-container');

  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id');

  if (!tournamentId) {
    tournamentNameEl.textContent = 'Erro: ID do torneio não encontrado na URL.';
    return;
  }

  async function fetchTournamentDetails() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        throw new Error('Torneio não encontrado.');
      }
      const tournament = await response.json();
      renderTournament(tournament);
    } catch (error) {
      tournamentNameEl.textContent = `Erro: ${error.message}`;
    }
  }

  function renderTournament(tournament) {
    document.title = tournament.name;
    tournamentNameEl.textContent = tournament.name;
    tournamentLocationEl.textContent = tournament.localizacao || 'Não informado';
    tournamentDescriptionEl.textContent = tournament.descricao || 'Sem descrição.';

    categoriesContainer.innerHTML = '<h2>Categorias e Atletas</h2>';

    if (tournament.categories.length === 0) {
      categoriesContainer.innerHTML += '<p>Nenhum atleta cadastrado para este torneio.</p>';
      return;
    }

    tournament.categories.forEach(category => {
      const categoryBlock = document.createElement('div');
      categoryBlock.className = 'category-block';

      let athletesHtml = '<p>Nenhum atleta nesta categoria.</p>';
      if (category.athletes.length > 0) {
        athletesHtml = category.athletes
          .map(athlete => `<li>${athlete.name}</li>`)
          .join('');
        athletesHtml = `<ul class="athlete-list">${athletesHtml}</ul>`;
      }

      categoryBlock.innerHTML = `
        <h3>${category.name}</h3>
        ${athletesHtml}
      `;
      categoriesContainer.appendChild(categoryBlock);
    });
  }

  fetchTournamentDetails();
});