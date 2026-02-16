import { useEffect, useRef, useState } from "react";
import "./SnakeGame.css";

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const loopRef = useRef(null);

  const GRID_SIZE = 20;
  const CANVAS_SIZE = 700;
  const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(80);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState(null);

  const snakeRef = useRef([]);
  const foodRef = useRef({ x: 15, y: 15 });
  const scoreRef = useRef(0);
  const dxRef = useRef(0);
  const dyRef = useRef(-1);
  const nextDxRef = useRef(0);
  const nextDyRef = useRef(-1);
  const isPausedRef = useRef(false);

  // Sync isPaused state with ref for the game loop
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const audioCtxRef = useRef(null);

  const difficultyNames = {
    120: "Easy",
    80: "Medium",
    50: "Hard",
    30: "Extreme",
  };

  // Lazy initialize AudioContext
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    return audioCtxRef.current;
  };

  // High score handling
  const getHighScoreKey = (diff) => `snakeHighScore_${diff}`;

  const loadHighScore = (diff) => {
    const key = getHighScoreKey(diff);
    const hs = localStorage.getItem(key) || 0;
    setHighScore(Number(hs));
  };

  // Initial load and difficulty change load
  useEffect(() => {
    loadHighScore(difficulty);
  }, [difficulty]);

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "eat") {
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "crash") {
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn("Audio context not allowed yet");
    }
  };

  const initGame = () => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];

    dxRef.current = 0;
    dyRef.current = -1;
    nextDxRef.current = 0;
    nextDyRef.current = -1;

    setScore(0);
    scoreRef.current = 0;
    setIsGameOver(false);
    spawnFood();

    setIsRunning(true);
    setIsPaused(false);
    setCountdown(3);

    if (loopRef.current) clearInterval(loopRef.current);

    // Initial draw to show snake before countdown ends
    setTimeout(draw, 0);

    // Resume audio context on user gesture
    try {
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {}
  };

  const spawnFood = () => {
    let f;
    do {
      f = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT),
      };
    } while (snakeRef.current.some((p) => p.x === f.x && p.y === f.y));

    foodRef.current = f;
  };

  const handleGameOver = () => {
    setIsRunning(false);
    setIsGameOver(true);
    clearInterval(loopRef.current);
    playSound("crash");

    const key = getHighScoreKey(difficulty);
    const existingHS = Number(localStorage.getItem(key) || 0);

    if (scoreRef.current > existingHS) {
      localStorage.setItem(key, scoreRef.current);
      setHighScore(scoreRef.current);
    }
  };

  const gameLoop = () => {
    update();
    draw();
  };

  const update = () => {
    if (isPausedRef.current) return;
    let snake = snakeRef.current;

    if (
      (nextDxRef.current === 1 && dxRef.current !== -1) ||
      (nextDxRef.current === -1 && dxRef.current !== 1) ||
      (nextDyRef.current === 1 && dyRef.current !== -1) ||
      (nextDyRef.current === -1 && dyRef.current !== 1)
    ) {
      dxRef.current = nextDxRef.current;
      dyRef.current = nextDyRef.current;
    }

    const head = {
      x: snake[0].x + dxRef.current,
      y: snake[0].y + dyRef.current,
    };

    if (
      head.x < 0 ||
      head.x >= TILE_COUNT ||
      head.y < 0 ||
      head.y >= TILE_COUNT ||
      snake.some((p) => p.x === head.x && p.y === head.y)
    ) {
      handleGameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      const newScore = scoreRef.current + 10;
      scoreRef.current = newScore;
      setScore(newScore);
      playSound("eat");
      spawnFood();
    } else {
      snake.pop();
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#030507";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = "#ff3366";
    ctx.shadowColor = "#ff3366";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * GRID_SIZE + GRID_SIZE / 2,
      foodRef.current.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      2 * Math.PI,
    );
    ctx.fill();

    // Reset shadow for snake
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Draw snake
    snakeRef.current.forEach((part, i) => {
      ctx.fillStyle = i === 0 ? "#00ff88" : "#00cc6a";
      const x = part.x * GRID_SIZE;
      const y = part.y * GRID_SIZE;

      ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

      // Draw eyes for the head
      if (i === 0) {
        ctx.fillStyle = "#000";
        const eyeSize = 3;
        const offset = 5;

        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

        if (dxRef.current === 1) {
          // Moving Right
          leftEyeX = x + GRID_SIZE - offset - eyeSize;
          leftEyeY = y + offset;
          rightEyeX = x + GRID_SIZE - offset - eyeSize;
          rightEyeY = y + GRID_SIZE - offset - eyeSize;
        } else if (dxRef.current === -1) {
          // Moving Left
          leftEyeX = x + offset;
          leftEyeY = y + offset;
          rightEyeX = x + offset;
          rightEyeY = y + GRID_SIZE - offset - eyeSize;
        } else if (dyRef.current === -1) {
          // Moving Up
          leftEyeX = x + offset;
          leftEyeY = y + offset;
          rightEyeX = x + GRID_SIZE - offset - eyeSize;
          rightEyeY = y + offset;
        } else {
          // Moving Down
          leftEyeX = x + offset;
          leftEyeY = y + GRID_SIZE - offset - eyeSize;
          rightEyeX = x + GRID_SIZE - offset - eyeSize;
          rightEyeY = y + GRID_SIZE - offset - eyeSize;
        }

        ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
        ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
      }
    });
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (isGameOver) return;
      if (e.code === "Space" || e.code === "Escape") {
        setIsPaused((p) => !p);
        return;
      }
      if (isPaused) return;

      const keys = e.code;
      if (keys === "ArrowUp" && dyRef.current === 0) {
        nextDxRef.current = 0;
        nextDyRef.current = -1;
      }
      if (keys === "ArrowDown" && dyRef.current === 0) {
        nextDxRef.current = 0;
        nextDyRef.current = 1;
      }
      if (keys === "ArrowLeft" && dxRef.current === 0) {
        nextDxRef.current = -1;
        nextDyRef.current = 0;
      }
      if (keys === "ArrowRight" && dxRef.current === 0) {
        nextDxRef.current = 1;
        nextDyRef.current = 0;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isRunning, isPaused, isGameOver]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        setCountdown(null);
        if (loopRef.current) clearInterval(loopRef.current);
        loopRef.current = setInterval(gameLoop, difficulty);
      }, 500);
    }
  }, [countdown, difficulty]);

  const resetToMenu = () => {
    setIsGameOver(false);
    setIsRunning(false);
    setScore(0);
    scoreRef.current = 0;
    loadHighScore(difficulty);
  };

  return (
    <div className="snakeGame-wrapper">
      <div className="game-nav-controls">
        <button
          className="back-btn-snake"
          onClick={() => (window.location.href = "/games")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          className="sound-toggle-snake"
          onClick={() => setSoundEnabled((s) => !s)}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="game-container-snake">
        <div className="score-board-snake">
          <div className="current-stats">
            <span>SCORE: {score}</span>
            <span className="difficulty-tag">
              {difficultyNames[difficulty]}
            </span>
          </div>
          <div className="high-score-display">HIGH: {highScore}</div>
        </div>

        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />

        {/* Start Screen */}
        {!isRunning && !isGameOver && (
          <div className="ui-overlay-snake">
            <h1>SNAKE</h1>
            <div className="select-stats-container">
              <div className="controls-group-snake">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                >
                  <option value="120">Easy</option>
                  <option value="80">Medium</option>
                  <option value="50">Hard</option>
                  <option value="30">Extreme</option>
                </select>
              </div>
              <div className="menu-high-score">
                Best Score: <strong>{highScore}</strong>
              </div>
            </div>

            <button className="btn-snake" onClick={initGame}>
              Play Game
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="ui-overlay-snake game-over-overlay">
            <h1 className="game-over-title">GAME OVER</h1>

            <div className="final-stats">
              <div className="stat-item">
                <span className="stat-label">DIFFICULTY</span>
                <span className="stat-value">
                  {difficultyNames[difficulty]}
                </span>
              </div>
              <div className="stat-item highlight">
                <span className="stat-label">FINAL SCORE</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">HIGH SCORE</span>
                <span className="stat-value">{highScore}</span>
              </div>
            </div>

            <div className="game-over-actions">
              <button className="btn-snake secondary" onClick={resetToMenu}>
                Main Menu
              </button>
            </div>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="ui-overlay-snake-countdown">
            <h1 className="countdown-number">
              {countdown > 0 ? countdown : "GO!"}
            </h1>
          </div>
        )}

        {/* Pause Screen */}
        {isPaused && isRunning && (
          <div className="ui-overlay-snake pause-overlay">
            <h1>PAUSED</h1>
            <button className="btn-snake" onClick={() => setIsPaused(false)}>
              Resume
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mobile-controls-snake">
        <div className="control-row">
          <button
            className="mobile-btn-snake"
            onClick={() => handleKey({ code: "ArrowUp" })}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        </div>
        <div className="control-row">
          <button
            className="mobile-btn-snake"
            onClick={() => handleKey({ code: "ArrowLeft" })}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className="mobile-btn-snake"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? "▶️" : "⏸️"}
          </button>
          <button
            className="mobile-btn-snake"
            onClick={() => handleKey({ code: "ArrowRight" })}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <div className="control-row">
          <button
            className="mobile-btn-snake"
            onClick={() => handleKey({ code: "ArrowDown" })}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
