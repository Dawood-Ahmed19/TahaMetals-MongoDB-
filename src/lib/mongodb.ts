import { MongoClient } from "mongodb";

// Extend the global interface to include _mongoClientPromise
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri: string = process.env.MONGODB_URI || "";
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
