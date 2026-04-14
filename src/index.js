const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const adminRoutes = require('./routes/adminRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const authRoutes = require('./routes/authRoutes');
const athleteRoutes = require('./routes/athleteRoutes');
const userRoutes = require('./routes/userRoutes');
const scoreRoutes = require('./routes/scoreRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, restrinja para o endereço do seu front-end
  }
});

const PORT = process.env.PORT || 3000;

// === MIDDLEWARES ===
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use('/socket.io-client', express.static(path.join(__dirname, '..', 'node_modules/socket.io-client/dist')));

// === SERVIR ARQUIVOS ESTÁTICOS ===
app.use(express.static(path.join(__dirname, '..', 'public')));

// === ROTAS DA API ===
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/scores', scoreRoutes);

io.on('connection', (socket) => {
  console.log('Um usuário conectou:', socket.id);

  socket.on('join:tournament-room', (tournamentId) => {
    socket.join(`tournament-${tournamentId}`);
    console.log(`Socket ${socket.id} entrou na sala do torneio ${tournamentId}`);
  });

  socket.on('admin:select-athlete', (data) => {
    io.to(`tournament-${data.tournamentId}`).emit('scoreboard:update-athlete', data);
  });

  socket.on('scoreboard:update-score', (data) => {
    io.to(`tournament-${data.tournamentId}`).emit('scoreboard:update-score', data);
  });

  socket.on('scoreboard:clear-score', (data) => {
    io.to(`tournament-${data.tournamentId}`).emit('scoreboard:clear');
  });

  socket.on('admin:show-leaderboard', (data) => {
    io.to(`tournament-${data.tournamentId}`).emit('scoreboard:display-leaderboard', data);
  });

  socket.on('admin:play-video', (data) => {
    io.to(`tournament-${data.tournamentId}`).emit('scoreboard:display-video');
  });
});

// << 5. Inicie o SERVIDOR HTTP, não o app do Express
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}`);
});