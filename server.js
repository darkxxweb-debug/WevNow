require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./db');

const { logVisitor } = require('./middleware');

const downloadRoutes = require('./download.routes');
const toolsRoutes = require('./tools.routes');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const whatsappRoutes = require('./whatsapp.routes');
const vcfRoutes = require('./vcf.routes');
const adminRoutes = require('./admin.routes');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.set('views', __dirname);
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'wevnow-super-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
    },
  })
);

app.use(logVisitor);

// Static assets (all files live flat in the project root, but are
// still served under their original /css and /js URLs)
app.get('/css/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/js/download.js', (req, res) => res.sendFile(path.join(__dirname, 'download.client.js')));
app.get('/js/tools.js', (req, res) => res.sendFile(path.join(__dirname, 'tools.client.js')));
app.get('/js/add-tool.js', (req, res) => res.sendFile(path.join(__dirname, 'add-tool.client.js')));
app.get('/js/history.js', (req, res) => res.sendFile(path.join(__dirname, 'history.client.js')));
app.get('/js/common.js', (req, res) => res.sendFile(path.join(__dirname, 'common.client.js')));
app.get('/js/auth.js', (req, res) => res.sendFile(path.join(__dirname, 'auth.client.js')));
app.get('/js/referrals.js', (req, res) => res.sendFile(path.join(__dirname, 'referrals.client.js')));
app.get('/js/whatsapp.js', (req, res) => res.sendFile(path.join(__dirname, 'whatsapp.client.js')));
app.get('/js/vcf.js', (req, res) => res.sendFile(path.join(__dirname, 'vcf.client.js')));
app.get('/js/vcf-panel.js', (req, res) => res.sendFile(path.join(__dirname, 'vcf-panel.client.js')));
app.get('/js/vcf-explore.js', (req, res) => res.sendFile(path.join(__dirname, 'vcf-explore.client.js')));
app.get('/js/admin.js', (req, res) => res.sendFile(path.join(__dirname, 'admin.client.js')));

// Pages
app.get('/', (req, res) => res.render('index', { active: 'home' }));
app.get('/tools', (req, res) => res.render('tools', { active: 'tools' }));
app.get('/tools/add', (req, res) => res.render('add-tool', { active: 'add' }));
app.get('/history', (req, res) => res.render('history', { active: 'history' }));
app.get('/register', (req, res) => res.render('register', { active: 'register' }));
app.get('/login', (req, res) => res.render('login', { active: 'login' }));
app.get('/referrals', (req, res) => res.render('referrals', { active: 'referrals' }));
app.get('/whatsapp-groups', (req, res) => res.render('whatsapp', { active: 'whatsapp' }));
app.get('/vcf', (req, res) => res.render('vcf', { active: 'vcf' }));
app.get('/vcf/explore', (req, res) => res.render('vcf-explore', { active: 'vcf-explore' }));
app.get('/vcf/:slug', (req, res) => res.render('vcf-panel', { active: '', slug: req.params.slug }));
app.get('/admin', (req, res) => res.render('admin', { active: '' }));

// API
app.use(downloadRoutes);
app.use(toolsRoutes);
app.use(authRoutes);
app.use(usersRoutes);
app.use(whatsappRoutes);
app.use(vcfRoutes);
app.use(adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { active: '' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WaveHub running on port ${PORT}`));
