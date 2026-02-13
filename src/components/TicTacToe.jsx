import { useEffect, useState } from "react";
import "./tictactoe.css";

export default function TicTacToe() {
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [drawScore, setDrawScore] = useState(0);
  const [currentStarter, setCurrentStarter] = useState("X");
  const [cells, setCells] = useState(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line
  }, []);

  const handleMove = (i) => {
    if (cells[i] || gameOver) return;

    const newCells = [...cells];
    newCells[i] = "X";
    setCells(newCells);

    if (checkWinner(newCells, "X")) return endGame("You Win! - ");
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

    if (checkWinner(newCells, "O")) return endGame("Bot Wins! -");
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
    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    return wins.some((w) => w.every((i) => b[i] === p));
  };

  const isDraw = (board) => board.every((c) => c);

  const resetGame = () => {
    const empty = Array(9).fill(null);
    setCells(empty);
    setGameOver(false);
    setStatus("");

    if (currentStarter === "O") {
      setTimeout(() => botMove(empty), 300);
    }
  };

  const endGame = (msg) => {
    setGameOver(true);

    if (msg.includes("You")) {
      setPlayerScore((s) => s + 1);
      setCurrentStarter("X");
    } else if (msg.includes("Bot")) {
      setBotScore((s) => s + 1);
      setCurrentStarter("O");
    } else {
      setDrawScore((s) => s + 1);
      setCurrentStarter((s) => (s === "X" ? "O" : "X"));
    }

    setStatus(msg + " Restarting...");

    setTimeout(() => resetGame(), 1500);
  };

  return (
    <div className="game-box">
      <h1>TIC-TAC-TOE</h1>
      <br />

      <select
        className="form-select my-2"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="easy">Beginner</option>
        <option value="medium">Moderate</option>
        <option value="hard">Impossible</option>
      </select>

      <div className="row text-center my-3 w-100">
        <div className="col">
          <div className="score-box">
            <small>YOU</small>
            <div>{playerScore}</div>
          </div>
        </div>
        <div className="col">
          <div className="score-box">
            <small>DRAWS</small>
            <div>{drawScore}</div>
          </div>
        </div>
        <div className="col">
          <div className="score-box">
            <small>BOT</small>
            <div>{botScore}</div>
          </div>
        </div>
      </div>

      <div id="turnInfo" className="mt-2 fw-bold">
        {currentStarter === "X" ? "You Start First" : "Bot Starts First"}
      </div>

      <div className="board">
        {cells.map((cell, i) => (
          <div key={i} className="cell" onClick={() => handleMove(i)}>
            {cell}
          </div>
        ))}
      </div>

      <div className="status">{status}</div>

      <button className="btn btn-neon mt-3 w-100" onClick={resetGame}>
        Restart
      </button>
    </div>
  );
}
