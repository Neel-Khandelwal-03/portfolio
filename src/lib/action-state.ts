import { z } from "zod";

/**
 * The shape every admin Server Action returns.
 *
 * `useActionState` in the form component renders `message` as a toast or inline
 * alert and maps `fieldErrors` onto the individual inputs, so validation
 * feedback is identical everywhere without each form inventing its own format.
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /**
   * What was submitted, echoed back on a rejected save.
   *
   * React resets an uncontrolled form once its action resolves, which would
   * otherwise wipe everything the user typed the moment one field failed
   * validation. Forms feed these back through `defaultValue`.
   */
  values?: Record<string, string>;
  /** Bumped on every response so the client can react to repeat submissions. */
  key?: number;
};

export const IDLE: ActionState = { status: "idle" };

export function success(message: string): ActionState {
  return { status: "success", message, key: Date.now() };
}

export function failure(
  message: string,
  fieldErrors?: Record<string, string>,
  values?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors, values, key: Date.now() };
}

/** Flattens submitted form data to plain strings so it can be echoed back. */
export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    if (key in values) continue;
    values[key] = value;
  }

  return values;
}

/** Flattens a Zod error into the one-message-per-field shape the forms expect. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error);
  const result: Record<string, string> = {};

  // `fieldErrors` is typed per-schema, so widen it to iterate generically.
  const fields = flat.fieldErrors as Record<string, string[] | undefined>;
  for (const [field, messages] of Object.entries(fields)) {
    if (messages && messages.length > 0) result[field] = messages[0];
  }

  if (flat.formErrors.length > 0) result._form = flat.formErrors[0];

  return result;
}

/**
 * Turns a FormData into a plain object.
 *
 * Repeated keys collapse to an array so multi-value inputs work, and File
 * entries are dropped — uploads are handled by the dedicated upload action.
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;

    if (key in result) {
      const existing = result[key];
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      result[key] = value;
    }
  }

  return result;
}
