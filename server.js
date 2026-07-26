require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./db');

const downloadRoutes = require('./download.routes');
const toolsRoutes = require('./tools.routes');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.set('views', __dirname);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static assets (all files live flat in the project root, but are
// still served under their original /css and /js URLs)
app.get('/css/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/js/download.js', (req, res) => res.sendFile(path.join(__dirname, 'download.client.js')));
app.get('/js/tools.js', (req, res) => res.sendFile(path.join(__dirname, 'tools.client.js')));
app.get('/js/add-tool.js', (req, res) => res.sendFile(path.join(__dirname, 'add-tool.client.js')));
app.get('/js/history.js', (req, res) => res.sendFile(path.join(__dirname, 'history.client.js')));

// Pages
app.get('/', (req, res) => res.render('index', { active: 'home' }));
app.get('/tools', (req, res) => res.render('tools', { active: 'tools' }));
app.get('/tools/add', (req, res) => res.render('add-tool', { active: 'add' }));
app.get('/history', (req, res) => res.render('history', { active: 'history' }));

// API
app.use(downloadRoutes);
app.use(toolsRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { active: '' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WaveHub running on port ${PORT}`));
