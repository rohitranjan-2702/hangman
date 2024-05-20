# Hangman Backend API

### Features

- Realtime score updates
- Create rooms with passwords
- Multiplayer
- Turn Based
- auth with email OTP

### Usage

- **Events : Create a game**

```json
{
  "type": "create",
  "word": "Rohit", // Your custom word
  "playerName": "Player 1"
}
```

Creates a new room, join the current player and returns a unique gameId for other players to join.

- **Events : Join a game**

```json
{
  "type": "join",
  "gameId": "c30aul5pj", // game id that you got after creating a game
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
