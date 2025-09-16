const express = require('express');
const path = require('path');

const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARES ESSENCIAIS ===
// Habilita o Express para entender requisições com corpo em JSON
app.use(express.json()); 
// Habilita o Express para entender dados de formulários tradicionais
app.use(express.urlencoded({ extended: true }));

// === SERVIR ARQUIVOS ESTÁTICOS (SUA PASTA 'public') ===
// Isso diz ao Express: "Qualquer requisição que chegar, primeiro verifique
// se existe um arquivo correspondente na pasta 'public'".
app.use(express.static(path.join(__dirname, '..', 'public')));

// === ROTAS DA API ===
app.use('/api/admin', adminRoutes);

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}`);
});