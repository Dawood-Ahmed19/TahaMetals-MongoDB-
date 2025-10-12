// import { MongoClient } from "mongodb";

// declare global {
//   var _mongoClientPromise: Promise<MongoClient> | undefined;
// }

// const uri = process.env.MONGODB_URI || "";
// if (!uri) throw new Error("Please add your MongoDB URI to .env.local");

// let client: MongoClient;
// let clientPromise: Promise<MongoClient>;

// if (process.env.NODE_ENV === "development") {
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   client = new MongoClient(uri);
//   clientPromise = client.connect();
// }

// export default clientPromise;

// export async function getDb() {
//   const client = await clientPromise;
//   return client.db("TahaMetals");
// }

// export async function listCollections() {
//   const db = await getDb();
//   const collections = await db.listCollections().toArray();
//   return collections.map((c) => c.name);
// }

// if (require.main === module) {
//   listCollections()
//     .then((names) => console.log("Collections under TahaMetals:", names))
//     .catch((err) => console.error("Error listing collections:", err))
//     .finally(() => process.exit(0));
// }

import { MongoClient } from "mongodb";

declare global {
  // Allow reuse of connection across hot reloads in dev mode
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Load Mongo URI from environment
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "TahaMetals";

if (!uri) {
  console.error("❌ MONGODB_URI is missing from environment variables.");
  throw new Error(
    "Please add MONGODB_URI to your .env or Vercel Environment Variables."
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Debug logs
console.log("🔍 Initializing MongoDB connection...");
console.log("🔍 MONGODB_URI present:", !!uri);
console.log("🔍 DB Name:", dbName);

try {
  if (process.env.NODE_ENV === "development") {
    // Use global variable in dev to prevent multiple connections
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production (Vercel), always create a new client
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
} catch (err) {
  console.error("❌ MongoDB client connection failed:", err);
  throw err;
}

export default clientPromise;

/**
 * Get the database instance
 */
export async function getDb() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    console.log("✅ Connected to MongoDB:", dbName);
    return db;
  } catch (err) {
    console.error("❌ Failed to get database connection:", err);
    throw err;
  }
}

/**
 * List all collections in the database
 */
export async function listCollections() {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    console.log(
      "📦 Collections under",
      dbName,
      ":",
      collections.map((c) => c.name)
    );
    return collections.map((c) => c.name);
  } catch (err) {
    console.error("❌ Error listing collections:", err);
    throw err;
  }
}

// For local debugging (node lib/mongodb.ts)
if (require.main === module) {
  listCollections()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error listing collections:", err);
      process.exit(1);
    });
}
