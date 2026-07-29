# WaveHub

Music/video downloader + community tools directory + referral business + WhatsApp group directory + VCF contact panels. Node.js/Express backend, MongoDB (Mongoose) database, EJS views, vanilla JS frontend, mobile-style bottom navigation + side menu.

## Features

- **Home** — paste a link from YouTube, TikTok, Instagram, or Facebook and get the best download link(s).
- **Tools** — browse apps/links shared by the community (search + category filter). Each tool can have a cover photo, up to 8 preview links, and a download link.
- **Upload a tool** — only registered, logged-in users can upload a new tool/app.
- **Register / Log in** — simple username + password accounts, sessions stored in MongoDB.
- **Referral business** — every registered user gets a personal referral link (`/register?ref=CODE`). A leaderboard at `/referrals` ranks users by how many people they referred, most on top.
- **WhatsApp groups** — `/whatsapp-groups` lets logged-in users submit group invite links (must match `https://chat.whatsapp.com/xxxxxxxx`). Most-joined groups float to the top.
- **VCF panels** — `/vcf` lets a logged-in user create a personal contact-collection panel. Each panel gets its own shareable link (`/vcf/:slug`) where anyone can submit a phone number + country code. The owner can download the collected numbers as a `.vcf` file at any time.
- **Explore VCF panels** — `/vcf/explore` lists public panels created by the site admin, most popular first.
- **Hidden site manager** — a low-visibility "mrxonly" link at the bottom of the side menu opens a password prompt (default `admin123`, set via `ADMIN_PASSWORD`). Once unlocked, `/admin` gives access to:
  - Delete tools/apps
  - Delete users
  - Post/delete site-wide announcements (shown as a banner on every page)
  - View total site visits and the most recent visitors
  - Create admin-only VCF panels with a target contact count and an expiry duration, "push" a panel once it reaches its target, toggle public/private, download, and delete
- **History** — last 30 downloads, stored in MongoDB.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env: paste your real MongoDB connection string into MONGODB_URI,
# and set your own SESSION_SECRET and ADMIN_PASSWORD
npm run dev
```

App runs at `http://localhost:3000`.

## Environment variables

| Variable         | Description                                                        |
|-------------------|---------------------------------------------------------------------|
| `MONGODB_URI`     | MongoDB Atlas connection string                                    |
| `PORT`            | Port to listen on (Render sets this for you)                       |
| `SESSION_SECRET`  | Random string used to sign session cookies                         |
| `ADMIN_PASSWORD`  | Password required to unlock the hidden site manager (default `admin123`) |

**Important:** never commit your real `.env` file or paste your connection string in public places — anyone with it can read/write your database. Change `ADMIN_PASSWORD` and `SESSION_SECRET` before going live. If a connection string has ever been shared publicly, rotate the database user's password in MongoDB Atlas (Database Access → Edit user → Edit password).

## Deploy to Render

1. Push this project to a GitHub repo (`.env` is git-ignored automatically).
2. On [Render](https://dashboard.render.com), click **New +** → **Web Service** and connect the repo.
3. Render will detect `render.yaml`. Otherwise set manually:
   - Build command: `npm install`
   - Start command: `npm start`
4. Under **Environment**, add `MONGODB_URI` and `ADMIN_PASSWORD` with your real values (`SESSION_SECRET` auto-generates via `render.yaml`).
5. Deploy. Render gives you a live `https://your-app.onrender.com` URL.

## How the hidden admin panel works

1. Open the side menu (hamburger icon in the top bar).
2. Scroll to the bottom and tap the small "mrxonly" text.
3. Enter the admin password (`ADMIN_PASSWORD`, default `admin123`).
4. You're redirected to `/admin` with full site-manager access for your session.

## Project structure

All files live flat in the project root (no subfolders):

```
server.js                  entry point (sessions, routes, static files, pages)
db.js                      MongoDB connection
middleware.js              requireAuth / requireAdmin / visitor logging

Models
  User.model.js             accounts, referral codes
  Tool.model.js              community tool/app (cover photo, preview links, download link)
  WhatsappGroup.model.js     WhatsApp group directory
  VcfPanel.model.js          VCF contact panels (user + admin types)
  Announcement.model.js      site-wide announcement banner
  Visitor.model.js           page-view log for the admin dashboard
  DownloadHistory.model.js   download history

Routes
  auth.routes.js             register / login / logout / me
  users.routes.js            referral leaderboard
  tools.routes.js            tools CRUD (upload requires login)
  whatsapp.routes.js         WhatsApp group listing/add/click
  vcf.routes.js               VCF panel create/submit/download/delete/explore
  download.routes.js          YouTube / TikTok / Instagram / Facebook extraction + history
  admin.routes.js             hidden site manager API (login, stats, users, tools,
                               announcements, visitors, admin VCF panels)

Views (EJS)
  index.ejs, tools.ejs, add-tool.ejs, history.ejs, register.ejs, login.ejs,
  referrals.ejs, whatsapp.ejs, vcf.ejs, vcf-panel.ejs, vcf-explore.ejs,
  admin.ejs, 404.ejs
  head.ejs, bottomnav.ejs, sidemenu.ejs   shared partials

Client JS (served at /js/*.js by explicit routes in server.js so the
browser-facing URLs stay unchanged even though the files sit flat in root)
  download.client.js, tools.client.js, add-tool.client.js, history.client.js,
  common.client.js, auth.client.js, referrals.client.js, whatsapp.client.js,
  vcf.client.js, vcf-panel.client.js, vcf-explore.client.js, admin.client.js

style.css                  all styling, including the new components
```
