import "server-only";
import { client } from "./client";

/** Reads and writes with SANITY_API_WRITE_TOKEN (an Editor token): saving
 * orders, updating stock, and reading the private order documents. Server
 * only - the token must never reach the browser. "raw" sees private
 * documents (orders.*) and never a draft's unpublished changes, so stock and
 * prices always come from what is published. */
export const writeClient = client.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

export const hasWriteToken = Boolean(process.env.SANITY_API_WRITE_TOKEN);
