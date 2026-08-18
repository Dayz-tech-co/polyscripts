// Small typed errors so the UI can tell "nothing matched" apart from
// "the network/API request failed" without parsing strings.

export class NotFoundError extends Error {
  constructor(message = "Account not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ProviderError extends Error {
  constructor(message = "Unable to reach Polymarket data") {
    super(message);
    this.name = "ProviderError";
  }
}
