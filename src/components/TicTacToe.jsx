import { useEffect, useState, useRef } from "react";
import "./Tictactoe.css";

export default function TicTacToe() {
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [drawScore, setDrawScore] = useState(0);
  const [currentStarter, setCurrentStarter] = useState("X");
  const [cells, setCells] = useState(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [winningLine, setWinningLine] = useState(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    audioCtxRef.current = new (
      window.AudioContext || window.webkitAudioContext
    )();
    resetGame();
    // eslint-disable-next-line
  }, []);

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

      if (type === "player") {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "bot") {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "win") {
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "lost") {
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "draw") {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {}
  };

  const handleMove = (i) => {
    if (cells[i] || gameOver) return;

    const newCells = [...cells];
    newCells[i] = "X";
    setCells(newCells);
    playSound("player");

    const winner = getWinningLine(newCells, "X");
    if (winner) return endGame("You Win! - ", winner);
    if (isDraw(newCells)) return endGame("Draw! - ");

    setTimeout(() => botMove(newCells), 300);
  };

  const botMove = (currentCells) => {
    let move;
    if (difficulty === "easy") move = randomMove(currentCells);
    if (difficulty === "medium") move = mediumMove(currentCells);
    if (difficulty === "hard") move = bestMove(currentCells);

    const newCells = [...currentCells];
    newCells[move] = "O";
    setCells(newCells);
    playSound("bot");

    const winner = getWinningLine(newCells, "O");
    if (winner) return endGame("Bot Wins! -", winner);
    if (isDraw(newCells)) return endGame("Draw! - ");
  };

  const randomMove = (board) => {
    const empty = board
      .map((v, i) => (v === null ? i : null))
      .filter((v) => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
  };

  const mediumMove = (board) => {
    return Math.random() < 0.5 ? randomMove(board) : bestMove(board);
  };

  const bestMove = (board) => {
    let bestScore = -Infinity;
    let move;

    board.forEach((cell, i) => {
      if (!cell) {
        board[i] = "O";
        let score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    });
    return move;
  };

  const minimax = (board, depth, isMax) => {
    if (checkWinner(board, "O")) return 10 - depth;
    if (checkWinner(board, "X")) return depth - 10;
    if (board.every((c) => c)) return 0;

    if (isMax) {
      let best = -Infinity;
      board.forEach((c, i) => {
        if (!c) {
          board[i] = "O";
          best = Math.max(best, minimax(board, depth + 1, false));
          board[i] = null;
        }
      });
      return best;
    } else {
      let best = Infinity;
      board.forEach((c, i) => {
        if (!c) {
          board[i] = "X";
          best = Math.min(best, minimax(board, depth + 1, true));
          board[i] = null;
        }
      });
      return best;
    }
  };

  const checkWinner = (b, p) => {
    return !!getWinningLine(b, p);
  };

  const getWinningLine = (b, p) => {
    const wins = [
      { line: [0, 1, 2], type: "h-top" },
      { line: [3, 4, 5], type: "h-mid" },
      { line: [6, 7, 8], type: "h-bot" },
      { line: [0, 3, 6], type: "v-left" },
      { line: [1, 4, 7], type: "v-mid" },
      { line: [2, 5, 8], type: "v-right" },
      { line: [0, 4, 8], type: "d-main" },
      { line: [2, 4, 6], type: "d-anti" },
    ];
    const win = wins.find((w) => w.line.every((i) => b[i] === p));
    return win ? win : null;
  };

  const isDraw = (board) => board.every((c) => c);

  const resetGame = () => {
    const empty = Array(9).fill(null);
    setCells(empty);
    setGameOver(false);
    setWinningLine(null);
    setStatus("");

    if (currentStarter === "O") {
      setTimeout(() => botMove(empty), 300);
    }
  };

  const endGame = (msg, win = null) => {
    setGameOver(true);
    if (win) setWinningLine(win);

    if (msg.includes("You")) {
      setPlayerScore((s) => s + 1);
      setCurrentStarter("X");
      playSound("win");
    } else if (msg.includes("Bot")) {
      setBotScore((s) => s + 1);
      setCurrentStarter("O");
      playSound("lost");
    } else {
      setDrawScore((s) => s + 1);
      setCurrentStarter((s) => (s === "X" ? "O" : "X"));
      playSound("draw");
    }

    setStatus(msg + " Restarting...");

    setTimeout(() => resetGame(), 1500);
  };

  return (
    <div className="ticTacToe-wrapper">
      <div className="game-nav-controls">
        <button
          className="back-btn-tic"
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
          className="sound-toggle-tic"
          onClick={() => setSoundEnabled((s) => !s)}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="game-box-tic">
        <h1>TIC-TAC-TOE</h1>
        <br />

        <select
          className="form-select-tic my-2"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Beginner</option>
          <option value="medium">Moderate</option>
          <option value="hard">Impossible</option>
        </select>

        <div className="row text-center my-3 w-100">
          <div className="col">
            <div className="score-box-tic">
              <small>YOU</small>
              <div>{playerScore}</div>
            </div>
          </div>
          <div className="col">
            <div className="score-box-tic">
              <small>DRAWS</small>
              <div>{drawScore}</div>
            </div>
          </div>
          <div className="col">
            <div className="score-box-tic">
              <small>BOT</small>
              <div>{botScore}</div>
            </div>
          </div>
        </div>

        <div id="turnInfo" className="mt-2 fw-bold">
          {currentStarter === "X" ? "You Start First" : "Bot Starts First"}
        </div>

        <div className="board-tic">
          {cells.map((cell, i) => (
            <div
              key={i}
              className={`cell ${cell ? cell.toLowerCase() : ""} ${winningLine?.line.includes(i) ? "won" : ""}`}
              onClick={() => handleMove(i)}
            >
              {cell}
            </div>
          ))}
          {winningLine && (
            <div className={`winning-line ${winningLine.type}`}></div>
          )}
        </div>

        <div className="status-tic">{status}</div>

        <button className="btn-tic btn-tic-neon mt-2 w-50" onClick={resetGame}>
          Restart
        </button>
      </div>
    </div>
  );
}
