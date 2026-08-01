# WaveHub

Music/video downloader + community tools directory (Play Store style) + referral business + WhatsApp group directory + VCF contact panels. Node.js/Express backend, MongoDB (Mongoose) database, EJS views, vanilla JS frontend, mobile-style bottom navigation + side menu.

## Features

- **Home** — paste a link from YouTube, TikTok, Instagram, or Facebook. Every result shows an inline preview (video/image player) and downloads through a server-side proxy so the file actually saves instead of just opening in the browser.
- **Tools (Play Store style)** — apps are listed as rows (icon, name, category, star rating, download count, Install button), with **All apps** / **Top downloads** tabs and search/category filtering. Tapping a row expands it to show the description, preview links, and a 5-star rating widget. Every real download increments that tool's download counter.
- **Upload a tool** — only registered, logged-in users can upload a new tool/app. The form includes a cover photo, up to 8 preview links, and a download link.
- **Register / Log in** — simple username + password accounts, sessions stored in MongoDB.
- **Referral business** — every registered user gets a personal referral link (`/register?ref=CODE`). A leaderboard at `/referrals` ranks users by how many people they referred, most on top.
- **WhatsApp groups** — `/whatsapp-groups` lets logged-in users submit group invite links. Any link starting with `https://chat.whatsapp.com/` is accepted (the code after it can be anything). Most-joined groups float to the top. Admin can delete any group from the site manager.
- **VCF panels** — `/vcf` lets any logged-in user create a full-featured contact-collection panel: title, optional cover photo, optional target contact count, optional expiry duration, and public/private visibility — the same controls the admin has. Each panel gets its own **standalone** shareable link (`/vcf/:slug`) with no site navigation at all (no menu, no bottom nav, no way to browse the rest of the site) — it's just a form where visitors submit their name, country, and phone number. The owner enables downloads with an explicit "Enable download" action from their `/vcf` dashboard; nobody (not even the owner) can download the `.vcf` file before that, except the admin, who can always override. Every generated `.vcf` always includes one fixed contact: **DarkX-Ultra — 255775710774**.
- **Explore VCF panels** — `/vcf/explore` lists any panel (user or admin-created) marked public, most popular first.
- **Hidden site manager** — a low-visibility "mrxonly" link at the bottom of the side menu opens a password prompt (default `admin123`, set via `ADMIN_PASSWORD`). Once unlocked, `/admin` gives access to:
  - Delete tools/apps
  - Delete WhatsApp groups
  - Delete users
  - Post/delete announcements (shown via the notification bell, top-right of every page)
  - Oversee every VCF panel on the site (enable/lock downloads, toggle public/private, download, delete) and create its own promotional panels
- **Notifications** — a bell icon top-right of every page shows a red dot when the admin has posted a new announcement; tapping it opens a small dropdown with the message.
- **History** — last 30 downloads, stored in MongoDB.
- **Footer** — every page ends with "All Rights are reserved | DarkX-Ultra Tech 2026".

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

**Important:** never commit your real `.env` file or paste your connection string in public places — anyone with it can read/write your database. Change `ADMIN_PASSWORD` and `SESSION_SECRET` before going live.

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

## How VCF download-locking works

- Any logged-in user can create a panel from `/vcf` with a cover photo, optional target count, optional expiry, and a public/private toggle.
- The panel's public link (`/vcf/:slug`) is a dead-end page: no menu, no nav, nothing but the submission form — someone who only has that link cannot browse the rest of the site.
- Numbers submitted there are only visible to the owner. The owner must tap **Enable download** on their own `/vcf` dashboard before the `.vcf` file can be downloaded at all (if a target count was set, it must be reached first). The admin can always download any panel as an oversight override, regardless of that flag.

## Project structure

All files live flat in the project root (no subfolders):

```
server.js                  entry point (sessions, routes, static files, pages)
db.js                      MongoDB connection
middleware.js              requireAuth / requireAdmin

Models
  User.model.js             accounts, referral codes
  Tool.model.js              community tool/app (cover photo, preview links, download link,
                              downloads counter, rating sum/count)
  WhatsappGroup.model.js     WhatsApp group directory
  VcfPanel.model.js          VCF contact panels (cover photo, target/expiry, public flag,
                              downloadEnabled gate, contacts with name+country+number)
  Announcement.model.js      notification-bell announcement
  DownloadHistory.model.js   download history

Routes
  auth.routes.js             register / login / logout / me
  users.routes.js            referral leaderboard
  tools.routes.js             tools CRUD + download counter + star ratings (upload requires login)
  whatsapp.routes.js         WhatsApp group listing/add/click
  vcf.routes.js                VCF panel create/submit/push/lock/visibility/download/delete/explore
  download.routes.js          YouTube / TikTok / Instagram / Facebook extraction, streaming
                               download proxy, and history
  admin.routes.js             hidden site manager API (login, stats, users, tools, groups,
                               announcements, VCF oversight)

Views (EJS)
  index.ejs, tools.ejs, add-tool.ejs, history.ejs, register.ejs, login.ejs,
  referrals.ejs, whatsapp.ejs, vcf.ejs, vcf-explore.ejs, admin.ejs, 404.ejs
  vcf-panel.ejs               standalone VCF submission page (no site navigation)
  head.ejs, bottomnav.ejs, sidemenu.ejs   shared partials

Client JS (served at /js/*.js by explicit routes in server.js so the
browser-facing URLs stay unchanged even though the files sit flat in root)
  download.client.js, tools.client.js, add-tool.client.js, history.client.js,
  common.client.js, auth.client.js, referrals.client.js, whatsapp.client.js,
  vcf.client.js, vcf-panel.client.js, vcf-explore.client.js, admin.client.js,
  countries.client.js        country name + dial code list for the VCF number picker

style.css                  all styling, including the Play Store-style app rows and
                            the standalone VCF panel layout
```
