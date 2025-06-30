export class BugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BugError";
  }
}

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}
