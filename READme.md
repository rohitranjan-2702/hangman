# Hangman Backend API

### Features

- Realtime score updates
- Create rooms with passwords
- Turn Based Multiplayer game
- Games saved in redis cache storage

### Setup

- Clone the repo by running `git clone https://github.com/rohitranjan-2702/hangman.git `
- Run `docker run --name my-redis -d -p 6379:6379 redis` to setup redis locally.
- Run development server `npm run dev` to start the server.
- Connect with postman, and `send the event as text` but in JSON form, as I am parsing it after that.

### Usage

- **Events : Create a game**

```json
{
  "type": "create",
  "word": "Rohit",
  "password": "123123",
  "playerName": "Player 1"
}
```

Creates a new room, join the current player and returns a unique gameId for other players to join.

- **Events : Join a game**

```json
{
  "type": "join",
  "gameId": "c30aul5pj",
  "password": "123123",
  "playerName": "Player 1"
}
```

Returns the current gameState Object

```json
{
  "word": "Rohit",
  "guesses": [],
  "turnsLeft": 6,
  "correctGuesses": [],
  "players": [{ "id": "N5YGCsVGXhxezqGkAAAB", "name": "Player 1" }],
  "isGameOver": false,
  "isWordGuessed": false,
  "scores": { "N5YGCsVGXhxezqGkAAAB": 0 },
  "currentPlayer": { "id": "N5YGCsVGXhxezqGkAAAB", "name": "Player 1" },
  "currentPlayerIndex": 0
}
```

- **Events : Guess the letter**

```json
{
  "type": "guess",
  "gameId": "c30aul5pj",
  "letter": "R"
}
```

Returns the updated gameState with individual scores of players.

```json
{
  "word": "Rohit",
  "guesses": ["R"],
  "turnsLeft": 6,
  "correctGuesses": ["R"],
  "players": [
    { "id": "N5YGCsVGXhxezqGkAAAB", "name": "Player 1" },
    { "id": "9vbbjaeCuk1orYC2AAAD", "name": "Player 2" }
  ],
  "isGameOver": false,
  "isWordGuessed": false,
  "scores": { "N5YGCsVGXhxezqGkAAAB": 0, "9vbbjaeCuk1orYC2AAAD": 1 },
  "currentPlayer": { "id": "9vbbjaeCuk1orYC2AAAD", "name": "Player 2" },
  "currentPlayerIndex": 1
}
```

- **Get all games**

```bash
curl http://localhost:8000/games
```

- **Get a game by id**

```bash
curl http://localhost:8000/game/hteqi6vm5
```

- **Delete all games**

```bash
curl http://localhost:8000/delete
```
