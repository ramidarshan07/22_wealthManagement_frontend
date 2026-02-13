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
  const [difficulty, setDifficulty] = useState(80);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const snakeRef = useRef([]);
  const foodRef = useRef({ x: 15, y: 15 });
  const dxRef = useRef(0);
  const dyRef = useRef(-1);
  const nextDxRef = useRef(0);
  const nextDyRef = useRef(-1);

  const audioCtxRef = useRef(null);

  useEffect(() => {
    audioCtxRef.current = new (
      window.AudioContext || window.webkitAudioContext
    )();
    updateHighScore();
  }, [difficulty]);

  const getHighScoreKey = () => `snakeHighScore_${difficulty}`;

  const updateHighScore = () => {
    const key = getHighScoreKey();
    const hs = localStorage.getItem(key) || 0;
    setHighScore(Number(hs));
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    const ctx = audioCtxRef.current;
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
    spawnFood();

    setIsRunning(true);
    setIsPaused(false);

    if (loopRef.current) clearInterval(loopRef.current);
    loopRef.current = setInterval(gameLoop, difficulty);
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

  const gameOver = () => {
    setIsRunning(false);
    clearInterval(loopRef.current);
    playSound("crash");

    const key = getHighScoreKey();
    if (score > highScore) {
      localStorage.setItem(key, score);
      setHighScore(score);
    }
  };

  const gameLoop = () => {
    update();
    draw();
  };

  const update = () => {
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
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore((s) => s + 10);
      playSound("eat");
      spawnFood();
    } else {
      snake.pop();
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#030507";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = "#ff3366";
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * GRID_SIZE + GRID_SIZE / 2,
      foodRef.current.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      2 * Math.PI,
    );
    ctx.fill();

    // Draw snake
    snakeRef.current.forEach((part, i) => {
      ctx.fillStyle = i === 0 ? "#00ff88" : "#00cc6a";
      ctx.fillRect(
        part.x * GRID_SIZE + 1,
        part.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    });
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Escape") {
        setIsPaused((p) => !p);
        return;
      }

      if (!isRunning || isPaused) return;

      switch (e.key) {
        case "ArrowLeft":
          nextDxRef.current = -1;
          nextDyRef.current = 0;
          break;
        case "ArrowRight":
          nextDxRef.current = 1;
          nextDyRef.current = 0;
          break;
        case "ArrowUp":
          nextDxRef.current = 0;
          nextDyRef.current = -1;
          break;
        case "ArrowDown":
          nextDxRef.current = 0;
          nextDyRef.current = 1;
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isRunning, isPaused]);

  return (
    <div className="snake-wrapper">
      <button
        className="sound-toggle"
        onClick={() => setSoundEnabled((s) => !s)}
      >
        {soundEnabled ? "🔊" : "🔇"}
      </button>

      <div className="game-container">
        <div className="score-board">
          <div>SCORE: {score}</div>
          <div>HIGH: {highScore}</div>
        </div>

        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />

        {!isRunning && (
          <div className="ui-overlay">
            <h1>SNAKE</h1>

            <div className="controls-group">
              <label>Difficulty:</label>
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

            <button className="btn" onClick={initGame}>
              Play Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
