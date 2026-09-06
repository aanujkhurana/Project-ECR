// A modest input bound for the demo, not a restriction on name characters.
export const MAX_CUSTOMER_NAME_LENGTH = 200;

// Share this rule across the form, HTTP boundary and service to avoid disagreement.
// Client checks provide feedback; server checks are required because callers can bypass the UI.
export function getCustomerNameError(value: string): string | null {
  const name = value.trim();
  if (!name) return "Enter your name.";
  if (name.length > MAX_CUSTOMER_NAME_LENGTH) {
    return `Use ${MAX_CUSTOMER_NAME_LENGTH} characters or fewer for your name.`;
  }
  return null;
}
