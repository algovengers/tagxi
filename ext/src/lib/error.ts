export class HTTPError extends Error {
    constructor(
      public message: string,
      public code: number
    ) {
      super(message)
      this.name = "AuthError"
      this.code = code
    }
  }