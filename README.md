# WaveHub

Music downloader + community tools directory. Node.js/Express backend, MongoDB (Mongoose) database, EJS views, vanilla JS frontend, mobile-style bottom navigation.

## Features

- **Home** — paste a YouTube link, get the best audio/video download link.
- **Tools** — browse apps/links shared by the community (search + category filter).
- **Add (+ button)** — submit a new tool: name, link, size, category, owner contact number, description.
- **History** — last 30 downloads, stored in MongoDB.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env and paste your real MongoDB connection string into MONGODB_URI
npm run dev
```

App runs at `http://localhost:3000`.

## Environment variables

| Variable      | Description                                  |
|---------------|-----------------------------------------------|
| `MONGODB_URI` | MongoDB Atlas connection string               |
| `PORT`        | Port to listen on (Render sets this for you)  |

**Important:** never commit your real `.env` file or paste your connection string in public places — anyone with it can read/write your database. If a connection string has ever been shared publicly, rotate the database user's password in MongoDB Atlas (Database Access → Edit user → Edit password).

## Deploy to Render

1. Push this project to a GitHub repo (`.env` is git-ignored automatically).
2. On [Render](https://dashboard.render.com), click **New +** → **Web Service** and connect the repo.
3. Render will detect `render.yaml`. Otherwise set manually:
   - Build command: `npm install`
   - Start command: `npm start`
4. Under **Environment**, add `MONGODB_URI` with your real connection string.
5. Deploy. Render gives you a live `https://your-app.onrender.com` URL.

## Project structure

All files live flat in the project root (no subfolders):

```
server.js                  entry point
db.js                      MongoDB connection
Tool.model.js              community tool/app schema
DownloadHistory.model.js   download history schema
download.routes.js         YouTube extraction + history API
tools.routes.js            tools CRUD API
index.ejs, tools.ejs,      EJS pages (home, tools, add-tool, history, 404)
add-tool.ejs, history.ejs,
404.ejs
head.ejs, bottomnav.ejs    shared EJS partials
style.css                  styling
download.client.js         frontend logic per page (mapped to /js/*.js
tools.client.js            by explicit routes in server.js so the
add-tool.client.js         browser-facing URLs stay unchanged)
history.client.js
```
