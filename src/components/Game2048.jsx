import { useEffect, useState, useRef } from "react";
import "./Game2048.css";

const SIZE = 4;

export default function Game2048() {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(
    Number(localStorage.getItem("2048_best")) || 0,
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef(null);

  useEffect(() => {
    audioCtxRef.current = new (
      window.AudioContext || window.webkitAudioContext
    )();
    initGame();
  }, []);

  const initGame = () => {
    const newGrid = Array(SIZE)
      .fill()
      .map(() => Array(SIZE).fill(null));

    setGrid(newGrid);
    setScore(0);
    setIsPaused(false);
    setIsGameOver(false);
    setHasWon(false);
    setKeepPlaying(false);
    setCountdown(null);

    const g = [...newGrid];
    addRandomTile(g);
    addRandomTile(g);
    setGrid(g);
  };

  const addRandomTile = (g) => {
    let empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!g[r][c]) empty.push({ r, c });
      }
    }
    if (empty.length) {
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      g[r][c] = {
        id: Date.now() + Math.random(),
        value: Math.random() < 0.9 ? 2 : 4,
      };
    }
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "move") {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "merge") {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "gameover") {
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "win") {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Audio context not allowed yet");
    }
  };

  const move = (direction) => {
    if (isPaused || isGameOver || (hasWon && !keepPlaying)) return;

    let newGrid = grid.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null)),
    );
    let moved = false;
    let merged = false;
    let newScore = score;

    const rotate = (g) => g[0].map((_, i) => g.map((row) => row[i]));
    const reverse = (g) => g.map((row) => [...row].reverse());

    let working = newGrid;

    if (direction === "Up") {
      working = rotate(working);
    } else if (direction === "Down") {
      working = rotate(working);
      working = reverse(working);
    } else if (direction === "Right") {
      working = reverse(working);
    }

    working = working.map((row) => {
      let arr = row.filter((c) => c);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i].value === arr[i + 1].value) {
          arr[i].value *= 2;
          newScore += arr[i].value;
          merged = true;
          if (arr[i].value === 2048) {
            setHasWon(true);
            playSound("win");
          }
          arr.splice(i + 1, 1);
        }
      }
      while (arr.length < SIZE) arr.push(null);
      return arr;
    });

    if (direction === "Up") {
      working = rotate(working);
      working = rotate(working);
      working = rotate(working);
    } else if (direction === "Down") {
      working = reverse(working);
      working = rotate(working);
      working = rotate(working);
      working = rotate(working);
    } else if (direction === "Right") {
      working = reverse(working);
    }

    const changed =
      JSON.stringify(newGrid.map((r) => r.map((c) => c?.value || 0))) !==
      JSON.stringify(working.map((r) => r.map((c) => c?.value || 0)));

    if (changed) {
      addRandomTile(working);
      setGrid(working);
      setScore(newScore);

      if (merged) {
        playSound("merge");
      } else {
        playSound("move");
      }

      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem("2048_best", newScore);
      }
    } else {
      // If no move was possible, check if game is over
      if (checkGameOver(grid)) {
        setIsGameOver(true);
        setCountdown(5);
        playSound("gameover");
      }
    }

    // Also check game over after a successful move and random tile addition
    if (changed) {
      // We need to check the NEW grid (working)
      // ensure state update is processed or check against working directly
      // passed 'working' to checkGameOver would be better but checkGameOver uses 'grid' state currently?
      // No, I will define checkGameOver to accept a grid argument.
      if (checkGameOver(working)) {
        setIsGameOver(true);
        setCountdown(5);
        playSound("gameover");
      }
    }
  };

  const checkGameOver = (currentGrid) => {
    // 1. Check for empty cells
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!currentGrid[r][c]) return false;
      }
    }

    // 2. Check for adjacent matches
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = currentGrid[r][c].value;
        // Check right
        if (
          c < SIZE - 1 &&
          currentGrid[r][c + 1] &&
          currentGrid[r][c + 1].value === val
        )
          return false;
        // Check down
        if (
          r < SIZE - 1 &&
          currentGrid[r + 1][c] &&
          currentGrid[r + 1][c].value === val
        )
          return false;
      }
    }

    return true;
  };

  useEffect(() => {
    let timer;
    if (isGameOver && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isGameOver && countdown === 0) {
      initGame();
    }
    return () => clearInterval(timer);
  }, [isGameOver, countdown]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "ArrowUp") move("Up");
      if (e.code === "ArrowDown") move("Down");
      if (e.code === "ArrowLeft") move("Left");
      if (e.code === "ArrowRight") move("Right");
      if (e.code === "Space" || e.code === "Escape") {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div className="game-2048-wrapper">
      <div className="game-nav-controls">
        <button
          className="back-btn-2048"
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
          className="sound-toggle-game2048"
          onClick={() => setSoundEnabled((s) => !s)}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>
      <div className="header-2048">
        <h1>2048</h1>
        <div className="scores-container-2048">
          <div className="score-box-2048">
            <div className="score-label-2048">Score</div>
            <div className="score-val-2048">{score}</div>
          </div>
          <div className="score-box-2048">
            <div className="score-label-2048">Best</div>
            <div className="score-val-2048">{bestScore}</div>
          </div>
        </div>
      </div>

      <div className="game-2048-container">
        <div className="grid-bg-2048">
          {Array(16)
            .fill()
            .map((_, i) => (
              <div key={i} className="grid-cell-2048"></div>
            ))}
        </div>

        <div className="tile-container-2048">
          {grid.map((row, r) =>
            row.map(
              (cell, c) =>
                cell && (
                  <div
                    key={cell.id}
                    className={`game-tile tile-${cell.value}`}
                    style={{
                      left: `calc(var(--g2048-tile-size) * ${c} + var(--g2048-gap-size) * ${c + 1})`,
                      top: `calc(var(--g2048-tile-size) * ${r} + var(--g2048-gap-size) * ${r + 1})`,
                    }}
                  >
                    {cell.value}
                  </div>
                ),
            ),
          )}
        </div>

        {isGameOver && (
          <div className="game-over-overlay">
            <h2>Game Over</h2>
            <h3>
              You Scored: <strong>{score}</strong>
            </h3>
            <p>Back in action in {countdown}s...</p>
          </div>
        )}
      </div>

      <div className="controls-2048">
        <button className="btn-2048" onClick={initGame}>
          Restart
        </button>
      </div>
    </div>
  );
}
