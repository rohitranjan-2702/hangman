import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { GameState } from "./game";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  socket.on("message", (message) => {
    const data = JSON.parse(message);
    console.log(data);

    switch (data.type) {
      case "create":
        const gameId = createGame(data.word, data.password);
        socket.to(gameId).emit(JSON.stringify({ type: "created", gameId }));
        // join the game
        joinGame(gameId, data.password, socket, data.playerName);
        break;
      case "join":
        joinGame(data.gameId, data.password, socket, data.playerName);
        break;
      case "guess":
        handleGuess(data.gameId, data.letter, socket);
        break;
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// Store all games in memory
let games: Record<string, GameState> = {};

function createGame(word: string, password: string) {
  const gameId = generateGameId();

  games[gameId] = new GameState(word, password);
  console.log("Game Created", gameId, word);
  return gameId;
}

function joinGame(
  gameId: string,
  password: string,
  socket: any,
  playerName: string
) {
  if (games[gameId]) {
    games[gameId].addPlayer(gameId, password, socket, playerName);
    socket.gameId = gameId;
    broadcastGameState(gameId);
  } else {
    socket.send(JSON.stringify({ type: "error", message: "Game not found" }));
  }
}

function handleGuess(gameId: string, letter: string, socket: any) {
  if (games[gameId] && socket.gameId === gameId) {
    games[gameId].makeGuess(letter, socket.id);
    io.to(gameId).emit("letterGuessed", {
      remainingTurns: games[gameId].turnsLeft,
    });
    broadcastGameState(gameId);

    if (games[gameId].isGameOver()) {
      socket.send(
        JSON.stringify({ type: "gameover", scores: games[gameId].scores })
      );
      io.to(gameId).emit("gameOver", {
        word: games[gameId].word,
        scores: games[gameId].scores,
      });
      //   delete games[gameId];
    } else {
      //   games[gameId].nextPlayer();
      io.to(gameId).emit("nextTurn", {
        currentPlayer: games[gameId].getCurrentPlayer(),
      });
    }
  } else {
    socket.send(
      JSON.stringify({ type: "error", message: "Game not found or not joined" })
    );
  }
}

async function broadcastGameState(gameId: string) {
  const gameState = games[gameId]?.getGameState();
  if (!gameState) return;
  const sockets = await io.sockets.fetchSockets();

  //   console.log(sockets);
  // Iterate over all connected sockets
  io.sockets.sockets.forEach((socket) => {
    // console.log(socket);
    // Check if the socket is open and matches the gameId
    if (
      //   (socket as any).readyState === WebSocket.OPEN &&
      (socket as any).gameId === gameId
    ) {
      socket.send(JSON.stringify({ type: "update", gameState }));
      console.log("Game State Sent", gameId, gameState);
    }
  });
}

function generateGameId() {
  return Math.random().toString(36).slice(2, 11);
}

app.get("/", (req, res) => {
  res.send("Server Running Fine 🚀");
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
