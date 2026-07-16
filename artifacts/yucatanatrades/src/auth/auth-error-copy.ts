import { getAuthErrorCode } from "./auth-client";
import {
  safeAuthErrorMessageForCode,
  type AuthFlow,
} from "./auth-error-messages";

export function safeAuthErrorMessage(error: unknown, flow: AuthFlow): string {
  return safeAuthErrorMessageForCode(getAuthErrorCode(error), flow);
}
