const express = require('express');
const path = require('path');

const adminRoutes = require('./routes/adminRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const authRoutes = require('./routes/authRoutes');
const athleteRoutes = require('./routes/athleteRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARES ===
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// === SERVIR ARQUIVOS ESTÁTICOS (SUA PASTA 'public') ===
// Isso diz ao Express: "Qualquer requisição que chegar, primeiro verifique
// se existe um arquivo correspondente na pasta 'public'".
app.use(express.static(path.join(__dirname, '..', 'public')));

// === ROTAS DA API ===
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}`);
});