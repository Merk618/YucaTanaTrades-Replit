import type { NextFunction, Request, Response } from "express";
import type { AuthEnvironment } from "../config/auth-env";
import {
  AuthService,
  AuthServiceError,
  type PresentedAuthSession,
} from "../auth/service";
import type { RequestMetadata } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      authSession?: PresentedAuthSession | undefined;
      authFailure?:
        | "missing"
        | "expired"
        | "disabled"
        | "unavailable"
        | undefined;
    }
  }
}

export function sendStructuredError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ code, message });
}

export function applyAuthResponsePrivacyHeaders(res: Response): void {
  res.set({
    "Cache-Control": "no-store, private",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.vary("Cookie");
}

export function requestMetadata(req: Request): RequestMetadata {
  return {
    ipAddress: req.ip || req.socket.remoteAddress || "unknown",
    requestId: req.id == null ? undefined : String(req.id),
  };
}

export interface AuthMiddlewares {
  loadPresentedSession: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  requirePresentedSession: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
  requireAuthenticatedSession: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
  requireCsrf: (req: Request, res: Response, next: NextFunction) => void;
  requireTrustedOrigin: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
  ownershipMigrationRequired: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
}

export function createAuthMiddlewares(
  service: AuthService,
  environment: AuthEnvironment,
): AuthMiddlewares {
  return {
    async loadPresentedSession(req, _res, next) {
      if (!service.isEnabled) {
        req.authFailure = "disabled";
        next();
        return;
      }
      const candidate = (req.cookies as Record<string, unknown> | undefined)?.[
        environment.cookie.name
      ];
      const rawToken = typeof candidate === "string" ? candidate : null;
      try {
        const resolved = await service.resolvePresentedSession(rawToken);
        req.authSession = resolved ?? undefined;
        req.authFailure = req.authSession
          ? undefined
          : rawToken
            ? "expired"
            : "missing";
        next();
      } catch {
        req.authFailure = "unavailable";
        next();
      }
    },

    requirePresentedSession(req, res, next) {
      if (req.authSession) {
        next();
        return;
      }
      if (req.authFailure === "disabled") {
        sendStructuredError(
          res,
          503,
          "unavailable",
          "Authentication is unavailable.",
        );
        return;
      }
      if (req.authFailure === "unavailable") {
        sendStructuredError(
          res,
          503,
          "unavailable",
          "Authentication is unavailable.",
        );
        return;
      }
      const expired = req.authFailure === "expired";
      sendStructuredError(
        res,
        401,
        expired ? "session_expired" : "unauthorized",
        expired
          ? "The session has expired."
          : "A session must be established first.",
      );
    },

    requireAuthenticatedSession(req, res, next) {
      if (req.authSession?.user) {
        next();
        return;
      }
      if (req.authFailure === "disabled") {
        sendStructuredError(
          res,
          503,
          "unavailable",
          "Authentication is unavailable.",
        );
        return;
      }
      if (req.authFailure === "unavailable") {
        sendStructuredError(
          res,
          503,
          "unavailable",
          "Authentication is unavailable.",
        );
        return;
      }
      const expired = req.authFailure === "expired";
      sendStructuredError(
        res,
        401,
        expired ? "session_expired" : "unauthorized",
        expired
          ? "The session has expired."
          : "Authentication is required.",
      );
    },

    requireCsrf(req, res, next) {
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        next();
        return;
      }
      if (!req.authSession) {
        sendStructuredError(
          res,
          401,
          "unauthorized",
          "A session must be established first.",
        );
        return;
      }
      try {
        service.assertCsrf(
          req.authSession,
          req.get("x-csrf-token") ?? null,
        );
        next();
      } catch (error) {
        const authError =
          error instanceof AuthServiceError
            ? error
            : new AuthServiceError(
                "CSRF_INVALID",
                403,
                "Request verification failed.",
              );
        sendStructuredError(res, authError.status, "csrf_invalid", authError.message);
      }
    },

    requireTrustedOrigin(req, res, next) {
      if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        next();
        return;
      }
      const originHeader = req.get("origin");
      const refererHeader = req.get("referer");
      let candidateOrigin: string | null = originHeader ?? null;
      if (!candidateOrigin && refererHeader) {
        try {
          candidateOrigin = new URL(refererHeader).origin;
        } catch {
          candidateOrigin = null;
        }
      }
      if (
        !candidateOrigin ||
        !environment.allowedOrigins.has(candidateOrigin)
      ) {
        sendStructuredError(
          res,
          403,
          "csrf_invalid",
          "Request origin verification failed.",
        );
        return;
      }
      next();
    },

    ownershipMigrationRequired(_req, res, _next) {
      sendStructuredError(
        res,
        503,
        "ownership_migration_required",
        "User-owned application data is unavailable until its ownership migration is applied.",
      );
    },
  };
}
