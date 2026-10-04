export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export function actionOk<T = undefined>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Errors we deliberately raise and are safe to show to the user verbatim. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Maps unknown thrown values to a safe, user-friendly message. Unexpected
 * errors are logged server-side and replaced with a generic message so raw
 * database/stack details never reach the client.
 */
export function toUserMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof DomainError) return error.message;
  console.error("[action-error]", error);
  return fallback;
}
