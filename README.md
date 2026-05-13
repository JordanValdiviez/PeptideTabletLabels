# Peptide Label Builder

Interactive label template builder for peptide tablets (1.2″ × 3.9″). Clients fill in product details and see a live label preview with auto-scaling text.

## Features
- **Two tablet types** — Regular and Sublingual with auto-populated directions
- **6 color presets + custom** — clients can define exact hex codes for brand colors
- **Logo upload** — with format, size, dimension, and aspect ratio validation
- **Naked export mode** — stripped-down content spec for handing off to a designer
- **Dynamic font scaling** — text auto-shrinks to fit label constraints

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → "Add New Project" → import repo
3. Vercel auto-detects Vite — click Deploy
4. Live in ~60 seconds

## Project Structure

```
├── index.html          # Entry point
├── package.json        # Dependencies
├── vite.config.js      # Vite + React config
├── .gitignore
└── src/
    ├── main.jsx        # React mount
    └── App.jsx         # Label builder component
```
