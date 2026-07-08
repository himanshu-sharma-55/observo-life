import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
export const DB_NAME = process.env.MONGODB_DB || "observolife";

function requireUri(): string {
  if (!uri) throw new Error("MONGODB_URI is not set");
  return uri;
}

/**
 * Native MongoClient promise, used by the Auth.js MongoDB adapter.
 * Cached on globalThis so dev hot-reload reuses a single connection.
 */
declare global {
  var __observolifeMongoClient: Promise<MongoClient> | undefined;
  var __observolifeMongoose: Promise<typeof mongoose> | undefined;
}

export const clientPromise: Promise<MongoClient> =
  global.__observolifeMongoClient ?? new MongoClient(requireUri()).connect();

// Attach a no-op catch so a failed initial connection doesn't surface as an
// unhandled rejection (real awaiters still receive the error on `await`).
clientPromise.catch(() => {});

if (process.env.NODE_ENV !== "production") {
  global.__observolifeMongoClient = clientPromise;
}

/**
 * Cached Mongoose connection. App collections (events, wants, etc.) are
 * accessed via Mongoose models; this shares the same database as the adapter.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!global.__observolifeMongoose) {
    global.__observolifeMongoose = mongoose
      .connect(requireUri(), {
        dbName: DB_NAME,
        bufferCommands: true,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error) => {
        global.__observolifeMongoose = undefined;
        throw error;
      });
  }

  return global.__observolifeMongoose;
}
