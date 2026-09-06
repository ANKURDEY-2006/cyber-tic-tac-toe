/**
 * CyberTic Tac Toe - Core Game Logic & Animation Engine
 */

(function () {
  'use strict';

  // --- Game State Constants & Variables ---
  const WINNING_COMBINATIONS = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diagonal 1
    [2, 4, 6]  // Diagonal 2
  ];

  let boardState = Array(9).fill(null);
  let currentPlayer = 'X';
  let isGameActive = true;
  let gameMode = 'pvp'; // 'pvp' | 'pve'
  let aiDifficulty = 'medium'; // 'easy' | 'medium' | 'hard'
  let soundEnabled = true;
  let scores = { x: 0, ties: 0, o: 0 };
  let isAiThinking = false;

  // --- DOM Elements ---
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('board');
  const boardWrapper = document.querySelector('.board-wrapper');
  const strikeLineEl = document.getElementById('strike-line');
  const turnBadge = document.getElementById('turn-badge');
  const turnIcon = document.getElementById('turn-icon');
  const turnText = document.getElementById('turn-text');
  const scoreXEl = document.getElementById('score-x');
  const scoreTiesEl = document.getElementById('score-ties');
  const scoreOEl = document.getElementById('score-o');
  const xPlayerLabel = document.getElementById('x-player-label');
  const oPlayerLabel = document.getElementById('o-player-label');
  const modePvpBtn = document.getElementById('mode-pvp');
  const modePveBtn = document.getElementById('mode-pve');
  const aiDiffWrapper = document.getElementById('ai-difficulty-wrapper');
  const aiDiffSelect = document.getElementById('ai-difficulty');
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundOnIcon = document.getElementById('sound-on-icon');
  const soundOffIcon = document.getElementById('sound-off-icon');
  const restartBtn = document.getElementById('restart-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');
  const resultModal = document.getElementById('result-modal');
  const modalIcon = document.getElementById('modal-icon');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalPlayAgainBtn = document.getElementById('modal-play-again-btn');
  const fxCanvas = document.getElementById('fx-canvas');
  const mainCard = document.querySelector('.main-card');

  // =========================================================================
  // Web Audio Synthesizer (Zero External Dependencies)
  // =========================================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'x_move') {
        // High bright chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'o_move') {
        // Warm resonant tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.14);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'win') {
        // Glorious arpeggio
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((f, idx) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(f, now + idx * 0.09);
          noteGain.gain.setValueAtTime(0.25, now + idx * 0.09);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
          noteOsc.start(now + idx * 0.09);
          noteOsc.stop(now + idx * 0.09 + 0.45);
        });
      } else if (type === 'draw') {
        // Subtle descending chord
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'button') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // =========================================================================
  // Particle & Confetti Celebration Engine
  // =========================================================================
  let ctx = fxCanvas.getContext('2d');
  let particles = [];
  let animFrameId = null;

  function resizeCanvas() {
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.radius = Math.random() * 5 + 3;
      this.speed = Math.random() * 8 + 4;
      this.angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed - 3;
      this.gravity = 0.22;
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.01;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 12;
      this.shape = Math.random() > 0.4 ? 'rect' : 'circle';
    }

    update() {
      this.vx *= 0.98;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
      this.rotation += this.rotSpeed;
    }

    draw(c) {
      c.save();
      c.globalAlpha = Math.max(0, this.alpha);
      c.translate(this.x, this.y);
      c.rotate((this.rotation * Math.PI) / 180);
      c.fillStyle = this.color;
      c.shadowBlur = 8;
      c.shadowColor = this.color;

      if (this.shape === 'rect') {
        c.fillRect(-this.radius, -this.radius / 2, this.radius * 2, this.radius);
      } else {
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  }

  function triggerConfetti(centerX, centerY) {
    const palette = ['#00f2fe', '#4facfe', '#ff2a85', '#ff7300', '#ffd700', '#ffffff', '#8f00ff'];
    particles = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      particles.push(new Particle(centerX || window.innerWidth / 2, centerY || window.innerHeight / 2, color));
    }
    if (!animFrameId) {
      animateParticles();
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }
    if (particles.length > 0) {
      animFrameId = requestAnimationFrame(animateParticles);
    } else {
      animFrameId = null;
      ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    }
  }

  // =========================================================================
  // SVG Graphic Constructors for X and O
  // =========================================================================
  function createX_SVG() {
    return `
      <svg class="symbol-svg svg-x" viewBox="0 0 100 100">
        <line x1="22" y1="22" x2="78" y2="78" />
        <line x1="78" y1="22" x2="22" y2="78" />
      </svg>
    `;
  }

  function createO_SVG() {
    return `
      <svg class="symbol-svg svg-o" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="32" />
      </svg>
    `;
  }

  // =========================================================================
  // Core Gameplay Logic
  // =========================================================================
  function initGame() {
    loadPreferences();
    setupEventListeners();
    resetBoard();
    updateScoreUI();
    setup3DTilt();
  }

  function loadPreferences() {
    try {
      const savedScores = localStorage.getItem('cybertic_scores');
      if (savedScores) scores = JSON.parse(savedScores);

      const savedSound = localStorage.getItem('cybertic_sound');
      if (savedSound !== null) soundEnabled = JSON.parse(savedSound);
      updateSoundIcon();
    } catch (e) {
      console.warn('LocalStorage access warning:', e);
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem('cybertic_scores', JSON.stringify(scores));
      localStorage.setItem('cybertic_sound', JSON.stringify(soundEnabled));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function updateSoundIcon() {
    if (soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    }
  }

  function updateTurnUI() {
    if (!isGameActive) return;

    if (currentPlayer === 'X') {
      turnBadge.className = 'turn-badge x-turn';
      turnIcon.textContent = '✕';
      turnText.textContent = gameMode === 'pve' ? 'Your Turn (X)' : "Player X's Turn";
    } else {
      turnBadge.className = 'turn-badge o-turn';
      turnIcon.textContent = '○';
      turnText.textContent = gameMode === 'pve' ? 'AI is Thinking...' : "Player O's Turn";
    }
  }

  function updateScoreUI(bumpTarget = null) {
    scoreXEl.textContent = scores.x;
    scoreTiesEl.textContent = scores.ties;
    scoreOEl.textContent = scores.o;

    if (bumpTarget) {
      bumpTarget.classList.remove('bump');
      void bumpTarget.offsetWidth; // Trigger reflow
      bumpTarget.classList.add('bump');
    }
  }

  function handleCellClick(e) {
    initAudio();
    const cell = e.currentTarget;
    const index = parseInt(cell.dataset.index, 10);

    if (boardState[index] !== null || !isGameActive || isAiThinking) {
      return;
    }

    makeMove(index, currentPlayer);

    if (isGameActive && gameMode === 'pve' && currentPlayer === 'O') {
      isAiThinking = true;
      const delay = aiDifficulty === 'easy' ? 350 : 450;
      setTimeout(() => {
        aiMove();
        isAiThinking = false;
      }, delay);
    }
  }

  function makeMove(index, player) {
    boardState[index] = player;
    const cell = cells[index];
    cell.classList.add('taken');
    cell.innerHTML = player === 'X' ? createX_SVG() : createO_SVG();

    playSound(player === 'X' ? 'x_move' : 'o_move');

    const winInfo = checkWin(boardState, player);
    if (winInfo) {
      endGame(false, winInfo);
      return;
    }

    if (checkTie(boardState)) {
      endGame(true);
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();
  }

  function checkWin(board, player) {
    for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] === player && board[b] === player && board[c] === player) {
        return { winner: player, combination: combo };
      }
    }
    return null;
  }

  function checkTie(board) {
    return board.every(cell => cell !== null);
  }

  function drawStrikeLine(combo) {
    const [a, , c] = combo;
    const cellA = cells[a];
    const cellC = cells[c];

    const rectA = cellA.getBoundingClientRect();
    const rectC = cellC.getBoundingClientRect();
    const wrapperRect = boardWrapper.getBoundingClientRect();

    const startX = (rectA.left + rectA.width / 2) - wrapperRect.left;
    const startY = (rectA.top + rectA.height / 2) - wrapperRect.top;
    const endX = (rectC.left + rectC.width / 2) - wrapperRect.left;
    const endY = (rectC.top + rectC.height / 2) - wrapperRect.top;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const baseLength = Math.hypot(deltaX, deltaY);
    const extraPadding = rectA.width * 0.7; // extend line symmetrically past outer cells
    const totalLength = baseLength + extraPadding;
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    strikeLineEl.style.width = `${totalLength}px`;
    strikeLineEl.style.left = `${midX}px`;
    strikeLineEl.style.top = `${midY}px`;
    strikeLineEl.style.setProperty('--angle', `${angle}deg`);
    strikeLineEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    strikeLineEl.classList.remove('hidden');
  }

  function endGame(isTie, winInfo = null) {
    isGameActive = false;

    if (isTie) {
      scores.ties++;
      savePreferences();
      updateScoreUI(scoreTiesEl);
      playSound('draw');
      showResultModal('draw');
    } else {
      const winner = winInfo.winner;
      if (winner === 'X') {
        scores.x++;
        savePreferences();
        updateScoreUI(scoreXEl);
      } else {
        scores.o++;
        savePreferences();
        updateScoreUI(scoreOEl);
      }

      // Highlight winning cells
      winInfo.combination.forEach(idx => {
        cells[idx].classList.add('winning');
      });

      drawStrikeLine(winInfo.combination);
      playSound('win');

      const boardCenter = boardEl.getBoundingClientRect();
      triggerConfetti(boardCenter.left + boardCenter.width / 2, boardCenter.top + boardCenter.height / 2);

      setTimeout(() => {
        showResultModal('win', winner);
      }, 700);
    }
  }

  function showResultModal(type, winner = 'X') {
    if (type === 'draw') {
      modalIcon.innerHTML = `<span style="color: var(--text-muted);">⚖️</span>`;
      modalTitle.textContent = "IT'S A DRAW!";
      modalTitle.style.color = '#fff';
      modalSubtitle.textContent = 'A balanced clash of titans. No one yields!';
    } else {
      const isX = winner === 'X';
      const winnerColor = isX ? 'var(--x-primary)' : 'var(--o-primary)';
      modalIcon.innerHTML = `<span style="color: ${winnerColor}; font-weight: 900;">${isX ? '👑 ✕' : '👑 ○'}</span>`;
      modalTitle.textContent = 'VICTORY!';
      modalTitle.style.color = winnerColor;

      if (gameMode === 'pve') {
        modalSubtitle.textContent = isX ? 'You defeated the AI master!' : 'The AI outcalculated your moves!';
      } else {
        modalSubtitle.textContent = isX ? 'Player X wins the round!' : 'Player O wins the round!';
      }
    }

    resultModal.classList.remove('hidden');
  }

  function resetBoard() {
    boardState.fill(null);
    isGameActive = true;
    isAiThinking = false;
    currentPlayer = 'X';

    cells.forEach(cell => {
      cell.innerHTML = '';
      cell.classList.remove('taken', 'winning');
    });

    strikeLineEl.classList.add('hidden');
    resultModal.classList.add('hidden');
    updateTurnUI();
  }

  // =========================================================================
  // Artificial Intelligence Engine (Easy, Medium, Unbeatable Minimax)
  // =========================================================================
  function aiMove() {
    if (!isGameActive) return;

    const availableMoves = boardState
      .map((val, idx) => (val === null ? idx : null))
      .filter(val => val !== null);

    if (availableMoves.length === 0) return;

    let chosenIndex = null;

    if (aiDifficulty === 'easy') {
      // Random move
      chosenIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else if (aiDifficulty === 'medium') {
      // 60% optimal move, 40% random / tactical
      const canWin = findWinningMove(boardState, 'O');
      const canBlock = findWinningMove(boardState, 'X');

      if (canWin !== null) {
        chosenIndex = canWin;
      } else if (canBlock !== null) {
        chosenIndex = canBlock;
      } else if (Math.random() < 0.6) {
        chosenIndex = getBestMoveMinimax(boardState);
      } else {
        chosenIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    } else {
      // Hard: Unbeatable Minimax
      chosenIndex = getBestMoveMinimax(boardState);
    }

    if (chosenIndex !== null && chosenIndex !== undefined) {
      makeMove(chosenIndex, 'O');
    }
  }

  function findWinningMove(board, player) {
    for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      const values = [board[a], board[b], board[c]];
      const playerCount = values.filter(v => v === player).length;
      const emptyCount = values.filter(v => v === null).length;

      if (playerCount === 2 && emptyCount === 1) {
        if (board[a] === null) return a;
        if (board[b] === null) return b;
        if (board[c] === null) return c;
      }
    }
    return null;
  }

  function getBestMoveMinimax(board) {
    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        let score = minimax(board, 0, false, -Infinity, Infinity);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  function minimax(board, depth, isMaximizing, alpha, beta) {
    const winO = checkWin(board, 'O');
    if (winO) return 10 - depth;

    const winX = checkWin(board, 'X');
    if (winX) return depth - 10;

    if (checkTie(board)) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          let score = minimax(board, depth + 1, false, alpha, beta);
          board[i] = null;
          maxScore = Math.max(score, maxScore);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          let score = minimax(board, depth + 1, true, alpha, beta);
          board[i] = null;
          minScore = Math.min(score, minScore);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
      }
      return minScore;
    }
  }

  // =========================================================================
  // 3D Tilt Micro-interactions
  // =========================================================================
  function setup3DTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on touch devices

    document.addEventListener('mousemove', (e) => {
      const { innerWidth, innerHeight } = window;
      const xOffset = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const yOffset = (e.clientY - innerHeight / 2) / (innerHeight / 2);

      const tiltX = -yOffset * 4;
      const tiltY = xOffset * 4;

      mainCard.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================
  function setupEventListeners() {
    cells.forEach(cell => {
      cell.addEventListener('click', handleCellClick);
    });

    modePvpBtn.addEventListener('click', () => {
      playSound('button');
      gameMode = 'pvp';
      modePvpBtn.classList.add('active');
      modePveBtn.classList.remove('active');
      aiDiffWrapper.classList.add('hidden');
      xPlayerLabel.textContent = 'Player X';
      oPlayerLabel.textContent = 'Player O';
      resetBoard();
    });

    modePveBtn.addEventListener('click', () => {
      playSound('button');
      gameMode = 'pve';
      modePveBtn.classList.add('active');
      modePvpBtn.classList.remove('active');
      aiDiffWrapper.classList.remove('hidden');
      xPlayerLabel.textContent = 'You (X)';
      oPlayerLabel.textContent = 'AI (O)';
      resetBoard();
    });

    aiDiffSelect.addEventListener('change', (e) => {
      playSound('button');
      aiDifficulty = e.target.value;
      resetBoard();
    });

    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      updateSoundIcon();
      savePreferences();
      if (soundEnabled) playSound('button');
    });

    restartBtn.addEventListener('click', () => {
      playSound('button');
      resetBoard();
    });

    modalPlayAgainBtn.addEventListener('click', () => {
      playSound('button');
      resetBoard();
    });

    resetScoresBtn.addEventListener('click', () => {
      playSound('button');
      scores = { x: 0, ties: 0, o: 0 };
      savePreferences();
      updateScoreUI();
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', initGame);
})();
