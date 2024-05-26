export class GameState {
  public word: string;
  public guesses: Set<string>;
  public turnsLeft: number;
  public correctGuesses: Set<string>;
  public players: Array<any>;
  public scores: Record<string, number>;
  public currentPlayerIndex: number;
  protected password: string;

  constructor(word: string, password: string) {
    this.word = word; // The word to guess
    this.password = password;
    this.guesses = new Set(); // Letters guessed so far
    this.turnsLeft = 6; // Number of wrong guesses allowed
    this.correctGuesses = new Set(); // Correctly guessed letters
    this.scores = {}; // Player scores
    this.players = []; // List of players
    this.currentPlayerIndex = 0; // Index of the current player
  }

  addPlayer(gameId: string, password: string, socket: any, playerName: string) {
    if (password !== this.password) {
      socket.send(
        JSON.stringify({ type: "error", message: "Invalid password" })
      );
      return;
    } else {
      this.players.push({
        id: socket.id,
        name: playerName,
      });
      this.scores[socket.id] = 0;
    }
  }

  nextPlayer() {
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
    console.log("Next Player", this.getCurrentPlayer());
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  makeGuess(letter: string, playerId: string, currentPlayerIndex: number) {
    if (this.guesses.has(letter)) {
      console.log("Letter already guessed", letter);
      return false; // Letter already guessed
    }

    this.guesses.add(letter);

    if (this.word.includes(letter)) {
      this.correctGuesses.add(letter);
      this.scores[playerId] = (this.scores[playerId] || 0) + 1;
      this.nextPlayer();
    } else {
      this.turnsLeft--;
      this.scores[playerId] = (this.scores[playerId] || 0) - 1;
      this.nextPlayer();
    }

    return true;
  }

  isGameOver() {
    return this.turnsLeft <= 0 || this.isWordGuessed();
  }

  isWordGuessed() {
    return [...this.word].every((letter) => this.correctGuesses.has(letter));
  }

  getGameState() {
    return {
      word: this.word,
      guesses: [...this.guesses],
      turnsLeft: this.turnsLeft,
      correctGuesses: [...this.correctGuesses],
      players: this.players,
      isGameOver: this.isGameOver(),
      isWordGuessed: this.isWordGuessed(),
      scores: this.scores,
      currentPlayer: this.getCurrentPlayer(),
      currentPlayerIndex: this.currentPlayerIndex,
    };
  }
}
