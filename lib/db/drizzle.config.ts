import { defineConfig } from "drizzle-kit";
import path from "path";

const dbUrl = process.env.PRODUCTION_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  // verbose: true, // uncomment to debug migration steps
});
