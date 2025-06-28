import "dotenv/config";
import { drizzle, NodePgClient } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(
  process.env.DATABASE_URL! as unknown as NodePgClient,
  { schema: schema }
);
