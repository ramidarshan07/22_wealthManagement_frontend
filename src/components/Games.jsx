import React from "react";
import "./Games.css";

const Games = () => {
  const games = [
    {
      id: "2048",
      title: "2048",
      description:
        "Join the numbers and get to the 2048 tile! A classic puzzle game.",
      path: "/game/2048",
      color: "#edc22e",
      image: "/2048 (1).png",
    },
    {
      id: "snake",
      title: "Snake Game",
      description:
        "Navigate the snake to eat food. Don't hit the walls or yourself!",
      path: "/game/snake",
      color: "#4CAF50",
      image: "/snakegame.png",
    },
    {
      id: "tictactoe",
      title: "Tic Tac Toe",
      description: "Challenge the AI in this classic game of X and O.",
      path: "/game/tictactoe",
      color: "#2196F3",
      image: "/tic-tac-toelogo.png",
    },
  ];

  const handleGameClick = (path) => {
    window.open(path, "_blank");
  };

  return (
    <div className="games-container">
      <p className="account-eyebrow">ENTERTAINMENT ZONE</p>
      <h1 className="game-title">Game Arcade</h1>
      <div className="games-grid mt-3">
        {games.map((game) => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => handleGameClick(game.path)}
            style={{ "--hover-color": game.color }}
          >
            <div className="game-card-content">
              <div className="game-image-wrapper">
                <img src={game.image} alt={game.title} className="game-image" />
              </div>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <span className="play-btn">Play Now ↗</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;
