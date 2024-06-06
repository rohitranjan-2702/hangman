import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { GameState } from "./game";
import { createClient } from "redis";

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

export const redisClient = createClient();
redisClient.on("error", (err) => console.log("Redis Client Error", err));

// Store all games in memory
let games: Record<string, GameState> = {};

io.on("connection", (socket: Socket) => {
  console.log("User Connected", socket.id);

  socket.on("message", async (message) => {
    const data = JSON.parse(message);
    console.log(data);

    switch (data.type) {
      case "create":
        const gameId = createGame(data.word, data.password);
        io.to(gameId as string).emit(
          "message",
          JSON.stringify({ type: "created", gameId })
        );
        socket.send(JSON.stringify({ type: "created", gameId }));
        // join the game
        joinGame(gameId as string, data.password, socket, data.playerName);
        // Save the game state to redis
        await redisClient.lPush("games", JSON.stringify(games));
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

function createGame(word: string, password: string) {
  const gameId = generateGameId();

  if (!password) {
    return console.log("Password is required");
  }

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
  if (games[gameId] && password) {
    games[gameId].addPlayer(gameId, password, socket, playerName);
    socket.gameId = gameId;
    broadcastGameState(gameId);
  } else {
    socket.send(
      JSON.stringify({
        type: "error",
        message: "Game not found, please check the password or gameId",
      })
    );
  }
}

function handleGuess(gameId: string, letter: string, socket: any) {
  if (games[gameId] && socket.gameId === gameId) {
    const currentPlayer = games[gameId].getCurrentPlayer();

    if (currentPlayer.id !== socket.id) {
      console.log("Not your turn", socket.id);
      socket.send(JSON.stringify({ type: "error", message: "Not your turn" }));
      return false; // Not your turn
    }

    games[gameId].makeGuess(
      letter,
      socket.id,
      games[gameId].currentPlayerIndex
    );
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

const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.originalUrl.split("?")[0]; // Generate cache key from URL (excluding query string)

  // Check if data exists in cache
  const cachedData = await redisClient.get(key);
  if (cachedData) {
    console.log("Data retrieved from cache");
    return res.send(JSON.parse(cachedData));
  }

  // If not cached, proceed with the route logic
  next();

  // After route execution, cache the response (optional)
  if (res.statusCode === 200) {
    // Only cache successful responses
    const dataToCache = JSON.stringify(res.locals.data || res.locals.result); // Customize based on your response structure
    await redisClient.set(key, dataToCache, { EX: 60 }); // Expire after 60 seconds
  }
};

app.get("/games", async (req, res) => {
  const savedGame = await redisClient.lRange("games", 0, 9999);
  return res.json(savedGame.map((game) => JSON.parse(game)));
});

app.get("/cache", cacheMiddleware, async (req, res) => {
  res.locals.data = { message: "Data from the server" };
  return res.json({ message: "Data from the server" });
});

app.get("/game/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
  const savedGame = await redisClient.lRange("games", 0, 9999);
  const games = savedGame.map((game) => JSON.parse(game));

  for (const game of games) {
    if (game.hasOwnProperty(gameId)) {
      return res.json(game[gameId]);
    }
  }
  return res.json({ message: "Game not found" });
});

app.get("/delete", async (req, res) => {
  await redisClient.del("games");
  return res.json({ message: "Games deleted" });
});

async function startServer() {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
}

startServer();
