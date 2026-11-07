export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number = 400,
    code: string = "VALIDATION_ERROR",
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;

    Error.captureStackTrace?.(this, this.constructor);
  }
}