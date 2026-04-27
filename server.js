const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/clienti', require('./routes/clienti'));
app.use('/api/obiettivi', require('./routes/obiettivi'));
app.use('/api/calcoli', require('./routes/calcoli'));

// Serve frontend in production
const clientBuild = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FA Advisor server avviato su http://localhost:${PORT}`);
});
