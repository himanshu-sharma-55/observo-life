import { config } from "dotenv";
import { MongoClient } from "mongodb";

config({ path: ".env.local" });
config({ path: ".env" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "observolife";

if (!uri) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db(dbName);

  // Regular indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("usersettings").createIndex({ userId: 1 }, { unique: true });
  await db.collection("events").createIndex({ userId: 1, occurredAt: -1 });
  await db.collection("eventbatches").createIndex({ userId: 1 });
  await db.collection("wants").createIndex({ userId: 1 });
  await db.collection("hypotheses").createIndex({ userId: 1 });
  await db.collection("feeditems").createIndex({ userId: 1, feedScope: 1, analysisRunId: 1 });
  await db.collection("feeditems").createIndex({ userId: 1, feedScope: 1, createdAt: -1 });
  await db.collection("analysisruns").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("monthrecaps").createIndex({ userId: 1, month: 1 }, { unique: true });
  console.log("Regular indexes ensured.");

  // Atlas Search index (only available on MongoDB Atlas).
  try {
    await db.collection("events").createSearchIndex({
      name: "events_search",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            rawText: { type: "string" },
            userId: { type: "token" },
            occurredAt: { type: "date" },
          },
        },
      },
    });
    console.log("Atlas Search index 'events_search' created (provisioning may take a minute).");
  } catch (error) {
    console.warn(
      "Skipped Atlas Search index (requires MongoDB Atlas). Text search will be unavailable until it exists:",
      error?.message ?? error,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
