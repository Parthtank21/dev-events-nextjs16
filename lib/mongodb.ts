import mongoose, { Mongoose } from "mongoose";

/**
 * Extend the globalThis object to hold a cached mongoose connection across module reloads.
 * This prevents creating multiple connections during development when modules are reloaded.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongoose:
    | {
        conn: Mongoose | null;
        promise?: Promise<Mongoose>;
      }
    | undefined;
}

// Read the MongoDB connection string from the environment. Fail fast if missing.
const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

// Optional mongoose settings. Keep these minimal and typed.
const mongooseOptions: mongoose.ConnectOptions = {};

/**
 * Establish (or return cached) Mongoose connection.
 *
 * - Returns the connected `Mongoose` instance.
 * - Caches both the in-flight promise and the resolved connection on `globalThis._mongoose`.
 * - This avoids multiple connections during hot-reloads in development.
 *
 * Usage:
 *   const mongoose = await connectToDatabase();
 *
 * Errors: throws when MONGODB_URI is not defined or when connection fails.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // If a connection already exists, return it immediately.
  if (globalThis._mongoose?.conn) {
    return globalThis._mongoose.conn;
  }

  // Create the global cache object if it doesn't exist yet.
  if (!globalThis._mongoose) {
    globalThis._mongoose = { conn: null, promise: undefined };
  }

  // If there's no promise in-flight, start a new connection and cache the promise.
  if (!globalThis._mongoose.promise) {
    globalThis._mongoose.promise = mongoose
      .connect(MONGODB_URI, mongooseOptions)
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        // Clear the promise so subsequent calls can retry the connection.
        globalThis._mongoose!.promise = undefined;
        throw error;
      });
  }

  // Await the connection promise and cache the resolved connection.
  globalThis._mongoose.conn = await globalThis._mongoose.promise;
  return globalThis._mongoose.conn;
}

export default connectToDatabase;
