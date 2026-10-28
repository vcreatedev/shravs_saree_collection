import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Reads published content - safe in any server code; the dataset is public. */
export const client = createClient({ projectId, dataset, apiVersion, useCdn: true });
