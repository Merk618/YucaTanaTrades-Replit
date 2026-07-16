import express, {
  type ErrorRequestHandler,
  type Express,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { loadAuthEnvironment, type AuthEnvironment } from "./config/auth-env";
import { createAuthRuntime, type AuthRuntime } from "./auth/runtime";
import { createApiRouter } from "./routes";
import { logger } from "./lib/logger";
import {
  applyAuthResponsePrivacyHeaders,
  sendStructuredError,
} from "./middlewares/auth";

export interface CreateAppOptions {
  environment?: AuthEnvironment;
  runtime?: AuthRuntime;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const environment = options.environment ?? loadAuthEnvironment();
  const runtime = options.runtime ?? createAuthRuntime(environment);
  const app: Express = express();

  app.disable("x-powered-by");
  app.disable("etag");
  if (environment.trustProxy !== false) {
    app.set("trust proxy", environment.trustProxy);
  }

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );

  const originAllowed = (origin: string | undefined): boolean =>
    origin === undefined || environment.allowedOrigins.has(origin);

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        callback(null, originAllowed(origin));
      },
      allowedHeaders: ["content-type", "x-csrf-token"],
      methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));

  app.use("/api", createApiRouter(runtime));

  const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    if (req.path === "/api/auth" || req.path.startsWith("/api/auth/")) {
      applyAuthResponsePrivacyHeaders(res);
    }
    req.log.warn(
      {
        code: "REQUEST_REJECTED",
        errorName: error instanceof Error ? error.name : "UnknownError",
        requestId: req.id == null ? undefined : String(req.id),
      },
      "Request rejected before route handling",
    );
    sendStructuredError(res, 400, "invalid_request", "Invalid request data.");
  };
  app.use(errorHandler);

  if (environment.generatedDevelopmentSecret) {
    logger.warn(
      { code: "EPHEMERAL_AUTH_SECRET" },
      "Using an ephemeral development session secret; sessions will not survive restart",
    );
  }

  return app;
}

export const defaultAuthEnvironment = loadAuthEnvironment();
const app = createApp({ environment: defaultAuthEnvironment });
export default app;
