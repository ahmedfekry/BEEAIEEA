# SLEB Energy Assessment Demo

Demo web app integrating the SLEB Smart Hub BEEA & IEEA APIs.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in SLEB_USERNAME / SLEB_PASSWORD
npm run dev                  # http://localhost:3000
```

Check the credentials work: open http://localhost:3000/api/auth/test
(should return `{"ok":true,"message":"Login succeeded",...}`).

Credentials are read only on the server (`src/lib/sleb-client.ts`) and are never sent to the browser.

## Status

- [x] Landing page (BEEA / IEEA) and sub-type selection
- [x] Server-side token client with caching and 401 retry
- [ ] Multi-step form engine
- [ ] PDF viewer / download (BEEA)
- [ ] JSON results + generated PDF (IEEA)
