import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import type { AuthRuntime } from "../auth/runtime";
import {
  AuthServiceError,
  type AuthSessionEnvelope,
  type PresentedAuthSession,
} from "../auth/service";
import {
  applyAuthResponsePrivacyHeaders,
  requestMetadata,
  sendStructuredError,
} from "../middlewares/auth";

const passwordSchema = z
  .string()
  .min(12)
  .max(256)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 1024);

const registerBody = z.object({
  email: z.string().min(1).max(320),
  password: passwordSchema,
  displayName: z.string().max(100).nullish(),
});

const signInBody = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1).max(1024),
});

const forgotBody = z.object({ email: z.string().min(1).max(320) });
const resetBody = z.object({
  token: z.string().min(32).max(2048),
  password: passwordSchema,
});
const verificationBody = z.object({ token: z.string().min(32).max(2048) });

function currentSession(req: Request): PresentedAuthSession {
  if (!req.authSession) {
    throw new AuthServiceError(
      "SESSION_REQUIRED",
      401,
      "A session must be established first.",
    );
  }
  return req.authSession;
}

function responseSession(session: AuthSessionEnvelope) {
  return {
    state: session.state,
    csrfToken: session.csrfToken,
    user: session.user,
    expiresAt: session.cookieExpiresAt.toISOString(),
  };
}

function setSessionCookie(
  res: Response,
  runtime: AuthRuntime,
  session: AuthSessionEnvelope,
): void {
  const maxAge = Math.max(0, session.cookieExpiresAt.getTime() - Date.now());
  res.cookie(runtime.environment.cookie.name, session.cookieToken, {
    httpOnly: runtime.environment.cookie.httpOnly,
    secure: runtime.environment.cookie.secure,
    sameSite: runtime.environment.cookie.sameSite,
    path: runtime.environment.cookie.path,
    expires: session.cookieExpiresAt,
    maxAge,
    priority: "high",
  });
}

function handleRouteError(req: Request, res: Response, error: unknown): void {
  if (error instanceof AuthServiceError) {
    const code =
      error.code === "INVALID_CREDENTIALS"
        ? "invalid_credentials"
        : error.code === "CSRF_INVALID"
          ? "csrf_invalid"
          : error.code === "SESSION_EXPIRED"
            ? "session_expired"
            : error.code === "SESSION_REQUIRED"
              ? "unauthorized"
              : error.code === "RATE_LIMITED"
                ? "rate_limited"
                : error.code === "AUTH_DISABLED" ||
                    error.code === "FEATURE_DISABLED"
                  ? "unavailable"
                  : "invalid_request";
    sendStructuredError(res, error.status, code, error.message);
    return;
  }
  if (error instanceof ZodError) {
    sendStructuredError(res, 400, "invalid_request", "Invalid request data.");
    return;
  }
  req.log.error(
    {
      code: "AUTH_HANDLER_FAILED",
      errorName: error instanceof Error ? error.name : "UnknownError",
      requestId: req.id == null ? undefined : String(req.id),
    },
    "Authentication handler failed",
  );
  sendStructuredError(res, 503, "unavailable", "Authentication is unavailable.");
}

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

function asyncHandler(handler: AsyncHandler): AsyncHandler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleRouteError(req, res, error);
    }
  };
}

export function createAuthRouter(runtime: AuthRuntime): Router {
  const router = Router();
  const { service, middlewares } = runtime;
  const unsafeSession = [
    middlewares.requireTrustedOrigin,
    middlewares.loadPresentedSession,
    middlewares.requirePresentedSession,
    middlewares.requireCsrf,
  ] as const;

  router.use((_req, res, next) => {
    applyAuthResponsePrivacyHeaders(res);
    next();
  });

  router.get("/auth/status", asyncHandler(async (_req, res) => {
    const available = await service.checkAvailability();
    res.json({
      available,
      features: {
        registrationEnabled:
          available && service.featureFlags.registration,
        passwordResetEnabled:
          available && service.featureFlags.passwordReset,
        emailVerificationEnabled:
          available && service.featureFlags.emailVerification,
      },
      message: available
        ? null
        : service.isEnabled
          ? "Authentication storage is unavailable."
          : "Authentication is disabled.",
    });
  }));

  router.get(
    "/auth/session",
    asyncHandler(async (req, res) => {
      const candidate = (req.cookies as Record<string, unknown> | undefined)?.[
        runtime.environment.cookie.name
      ];
      const session = await service.getOrCreateSession(
        typeof candidate === "string" ? candidate : null,
        requestMetadata(req),
      );
      if (candidate !== session.cookieToken) {
        setSessionCookie(res, runtime, session);
      }
      res.json(responseSession(session));
    }),
  );

  router.post(
    "/auth/sign-in",
    ...unsafeSession,
    asyncHandler(async (req, res) => {
      const body = signInBody.parse(req.body);
      const session = await service.signIn(
        body,
        currentSession(req),
        requestMetadata(req),
      );
      setSessionCookie(res, runtime, session);
      res.json(responseSession(session));
    }),
  );

  router.post(
    "/auth/register",
    ...unsafeSession,
    asyncHandler(async (req, res) => {
      const body = registerBody.parse(req.body);
      const result = await service.register(
        body,
        currentSession(req),
        requestMetadata(req),
      );
      setSessionCookie(res, runtime, result.session);
      res.status(201).json({
        ...responseSession(result.session),
      });
    }),
  );

  router.post(
    "/auth/sign-out",
    ...unsafeSession,
    middlewares.requireAuthenticatedSession,
    asyncHandler(async (req, res) => {
      const session = await service.signOut(
        currentSession(req),
        requestMetadata(req),
      );
      setSessionCookie(res, runtime, session);
      res.json(responseSession(session));
    }),
  );

  router.post(
    "/auth/sign-out-all",
    ...unsafeSession,
    middlewares.requireAuthenticatedSession,
    asyncHandler(async (req, res) => {
      const result = await service.signOutAll(
        currentSession(req),
        requestMetadata(req),
      );
      setSessionCookie(res, runtime, result.session);
      res.json(responseSession(result.session));
    }),
  );

  router.post(
    "/auth/password/forgot",
    ...unsafeSession,
    asyncHandler(async (req, res) => {
      const body = forgotBody.parse(req.body);
      const result = await service.forgotPassword(
        body.email,
        currentSession(req),
        requestMetadata(req),
      );
      res.status(202).json({
        accepted: true,
        message:
          "If the account is eligible, the request was accepted. Message delivery is not configured.",
        ...(result.developmentToken
          ? { developmentToken: result.developmentToken }
          : {}),
      });
    }),
  );

  router.post(
    "/auth/password/reset",
    ...unsafeSession,
    asyncHandler(async (req, res) => {
      const body = resetBody.parse(req.body);
      await service.resetPassword(
        body,
        currentSession(req),
        requestMetadata(req),
      );
      res.json({
        accepted: true,
        message: "The password reset was completed.",
      });
    }),
  );

  router.post(
    "/auth/email-verification/request",
    ...unsafeSession,
    middlewares.requireAuthenticatedSession,
    asyncHandler(async (req, res) => {
      const result = await service.requestEmailVerification(
        currentSession(req),
        requestMetadata(req),
      );
      res.status(202).json({
        accepted: true,
        message: "The verification request was accepted. Message delivery is not configured.",
        ...(result.developmentToken
          ? { developmentToken: result.developmentToken }
          : {}),
      });
    }),
  );

  router.post(
    "/auth/email-verification/complete",
    ...unsafeSession,
    asyncHandler(async (req, res) => {
      const body = verificationBody.parse(req.body);
      await service.completeEmailVerification(
        body.token,
        currentSession(req),
        requestMetadata(req),
      );
      res.json({ accepted: true, message: "Email verification was completed." });
    }),
  );

  return router;
}
