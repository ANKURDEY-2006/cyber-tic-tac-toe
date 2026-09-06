# 🎮 CyberTic Tac Toe

A futuristic, high-polish Tic-Tac-Toe web game featuring a modern **glassmorphism UI**, ambient glowing backgrounds, dynamic SVG drawing animations, particle fireworks, 3D card tilt physics, zero-dependency Web Audio synthesizers, and an unbeatable Minimax AI.

![Tic Tac Toe Preview](https://raw.githubusercontent.com/placeholder/preview.png) <!-- Replace with repo preview if needed -->

---

## ✨ Features

- **🎨 Modern Glassmorphic Design**:
  - Frosted multi-layer glass cards (`backdrop-filter: blur(28px)`).
  - Floating ambient orbs with dynamic color refraction.
  - Cyberpunk neon color palette (Electric Cyan for **X**, Cyberpunk Pink for **O**).
- **⚡ Rich Animation Suite**:
  - SVG animated stroke-dash tracing on tile placement.
  - Dynamic laser strike-through line calculating exact angles and geometry between winning tiles.
  - Full physics-based confetti/fireworks celebration canvas.
  - Interactive 3D perspective tilt reacting to mouse movements.
- **🔊 Web Audio Synthesizer**:
  - Low-latency synthesized sound effects for moves, win fanfares, draw chords, and UI clicks without external audio files.
- **🤖 Smart AI & Game Modes**:
  - **2-Player (Pass & Play)**: Play locally with friends.
  - **Vs AI Modes**:
    - *Casual (Easy)*: Casual randomized play.
    - *Tactical (Medium)*: Balanced tactical blocking and winning moves.
    - *Master Mind (Unbeatable)*: Minimax algorithm with full alpha-beta search space.
- **📊 Scoreboard & Stats**:
  - Tracks Player X, Player O, and Draws with `localStorage` persistence.

---

## 🚀 Getting Started

### Local Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cyber-tic-tac-toe.git
   ```
2. Open `index.html` directly in any web browser, or serve it using any static server:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node (npx)
   npx serve .
   ```
3. Navigate to `http://localhost:8080`.

---

## 📂 Project Structure

```text
├── index.html      # Game UI structure, glass cards & accessibility
├── style.css       # Glassmorphism styling, animations & layout
├── game.js         # Core game logic, AI Minimax, audio synthesizer & particles
└── README.md       # Project documentation
```

---

## 🌐 Deploy to GitHub Pages

1. Go to your repository settings on GitHub.
2. Navigate to **Pages** in the left sidebar.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**. Your site will be live within seconds!

---

## 📄 License
MIT License. Feel free to use, modify, and distribute.
