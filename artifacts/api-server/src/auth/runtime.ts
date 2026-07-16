import type { AuthEnvironment } from "../config/auth-env";
import { createAuthMiddlewares, type AuthMiddlewares } from "../middlewares/auth";
import { DbAuthStore } from "./db-store";
import { MemoryAuthStore } from "./memory-store";
import { AuthService } from "./service";
import { withAuthStoreTimeout } from "./timed-store";
import type { AuthStore } from "./types";

export interface AuthRuntime {
  environment: AuthEnvironment;
  store: AuthStore;
  service: AuthService;
  middlewares: AuthMiddlewares;
}

export function createAuthRuntime(environment: AuthEnvironment): AuthRuntime {
  const baseStore: AuthStore =
    environment.storeMode === "database"
      ? new DbAuthStore()
      : new MemoryAuthStore();
  const store = withAuthStoreTimeout(
    baseStore,
    environment.storeOperationTimeoutMs,
  );
  const service = new AuthService(store, {
    enabled: environment.enabled,
    secret: environment.sessionSecret,
    exposeDevelopmentTokens: environment.exposeDevelopmentTokens,
    features: environment.features,
    password: environment.password,
    session: environment.session,
    tokenTtl: environment.tokenTtl,
  });
  return {
    environment,
    store,
    service,
    middlewares: createAuthMiddlewares(service, environment),
  };
}
