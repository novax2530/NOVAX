# Nova X

Telegram Mini App where the community earns **Nova Coin** (tasks, daily streak, referrals) and redeems it for USDT, with a built-in text AI chat, **Nova X Minibot**.

- Frontend: React + Vite (this repo).
- Backend: Supabase (Postgres + Edge Functions). Contract: the API contract and chat addendum shared between the frontend and backend builders.
- Images (logo, coin icon, Minibot avatar, hero) are added later. Slots are marked `IMAGE SLOT` in `src/styles.css`.

## Run locally
```bash
npm install
cp .env.example .env   # fill in values; never commit .env
npm run dev
```
The app only works fully inside Telegram (it needs Telegram `initData`). Outside Telegram it shows the landing page.

## Deploy
`npm run build` outputs `dist/`. Host on Vercel, Netlify or Cloudflare Pages, set the three `VITE_*` env vars there, then paste the HTTPS URL into BotFather (Menu Button / Mini App).

## Structure
- `src/pages/Chat.jsx` — Nova X Minibot chat (text only: `chat_history`, `chat_send`, `chat_clear`).
- `src/components/ChatBubble.jsx` — safe renderer for AI replies (no raw HTML).
- `src/components/TabBar.jsx` — bottom nav with the centre Minibot button.
- `src/lib/api.js` — API helper (token kept in memory, auto re-auth on 401).
- `src/styles.css` — design tokens and styles.

Never put the Supabase service-role key or the Gemini key in this repo or in `VITE_*` variables.
