# Estimate Hours – Trello Power-Up

A simple vanilla JS Trello Power-Up that lets you assign **estimated hours per member** on each card, shows total hours as card badges, and provides a basic team workload view.

Inspired by EstiMate for Trello (hours-only version).

## Features

- **Per-member hour estimates** on any card
- **Card front badges** showing total estimated hours
- **Card detail badge** (top of card back) with quick access to set hours
- **Board button → Workload** that sums hours across the whole board by member
- Data stored in Trello’s shared data layer (no external server/database required)
- Zero sign-up, pure client-side

## Project Structure

```
estimate-hours-powerup/
├── index.html          # Power-Up connector (iframe entry point)
├── estimate.html       # Popup to set hours for card members
├── workload.html       # Popup showing board-wide totals
├── css/
│   └── styles.css
├── js/
│   ├── client.js       # Capability handlers (buttons, badges)
│   ├── estimate.js     # Logic for the estimate popup
│   └── workload.js     # Logic for the workload popup
└── README.md
```

## How to Deploy & Use

### 1. Host the files over HTTPS

Trello requires the connector URL to be served over HTTPS. Easy free options:

- **GitHub Pages**
- **Netlify** (drag-and-drop the folder)
- **Vercel**
- **Glitch**

Upload the entire `estimate-hours-powerup` folder so that `index.html` is reachable at something like:

```
https://your-username.github.io/estimate-hours-powerup/
```

or

```
https://your-site.netlify.app/
```

### 2. Register the Power-Up with Trello

1. Go to [https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Select a Workspace you admin → **New**
3. Fill in:
   - **Name**: Estimate Hours (or whatever you like)
   - **Iframe connector URL**: the full URL to your `index.html`
   - Add an icon if you want
4. Click **Create**
5. Go to the **Capabilities** tab and enable:
   - `card-buttons`
   - `card-badges`
   - `card-detail-badges`
   - `board-buttons`
6. Save

### 3. Enable it on a board

1. Open any board in that Workspace
2. Click **Power-Ups** → **Custom** tab
3. Find your Power-Up and enable it

### 4. Use it

- Open a card → look under **Power-Ups** for **Set Hours**
- Or click the blue **Hours** badge on the card back
- Assign hours to each member currently on the card
- On the board header you’ll see a **Workload** button that shows totals

## Data Storage

Estimates are stored as:

```js
t.set("card", "shared", "memberHours", {
  "memberId1": 4.5,
  "memberId2": 2
})
```

This data is visible to anyone with access to the board.

## Limitations of this Starter

- No planning poker / real-time voting
- No sprint management or burndown charts
- Workload view only sums existing estimates (no capacity limits or forecasting)
- Relies on members already being assigned to the card

These can be added later if you want to extend it.

## License

Free to use and modify. No warranty.
