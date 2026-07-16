import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers['x-csrf-token']",
    "res.headers['set-cookie']",
    "password",
    "passwordHash",
    "token",
    "csrfToken",
    "sessionSecret",
    "credentials",
    "*.password",
    "*.passwordHash",
    "*.token",
    "*.csrfToken",
    "*.sessionSecret",
    "*.credentials",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
