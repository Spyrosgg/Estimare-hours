# Estimate Hours – Trello Power-Up

A simple vanilla JS Trello Power-Up that lets you assign **estimated hours per member** on each card, shows total hours as card badges, and provides a team utilisation chart.

## Features

- **Per-member hour estimates** on any card
- **Card front badges** showing total estimated hours
- **Card detail badge** (top of card back) with quick access to set hours
- **Board button → Workload** showing totals + weekly utilisation chart
- Utilisation = weekly hours ÷ ((board members − 1) × 37.5)
- Data stored in Trello’s shared data layer (no external database)
- Zero sign-up, pure client-side

## Files (flat structure)

```
index.html      # Power-Up connector (iframe entry point)
client.js       # Capability handlers (buttons, badges)
estimate.html   # Popup to set hours for card members
estimate.js     # Logic for the estimate popup
workload.html   # Popup showing board-wide totals + chart
workload.js     # Logic for the workload popup + utilisation chart
styles.css      # Shared styles
README.md
```

## How to Deploy & Use

### 1. Host the files over HTTPS

Upload the entire folder so that `index.html` is reachable at something like:

```
https://your-username.github.io/estimate-hours/
```

or use Netlify / Vercel / Glitch.

### 2. Register the Power-Up with Trello

1. Go to https://trello.com/power-ups/admin
2. Select a Workspace → **New**
3. **Iframe connector URL** = full URL to your `index.html`
4. Enable capabilities:
   - `card-buttons`
   - `card-badges`
   - `card-detail-badges`
   - `board-buttons`
5. Save

### 3. Enable on a board

Power-Ups → Custom tab → enable your Power-Up.

### 4. Use it

- Open a card → **Set Hours** (or click the Hours badge)
- Board header → **Workload** for totals + utilisation chart

## License

Free to use and modify. No warranty.
