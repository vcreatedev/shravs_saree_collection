/** How product codes are compared: ignoring case, spaces and dashes, so
 * "SRV-001", "srv 001" and "SRV001" count as the same code. */
export function codeKey(code: string | null | undefined): string {
  return String(code ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "");
}
