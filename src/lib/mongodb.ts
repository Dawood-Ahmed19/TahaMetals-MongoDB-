import { MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || "";
if (!uri) throw new Error("Please add your MongoDB URI to .env.local");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("TahaMetals");
}

export async function listCollections() {
  const db = await getDb();
  const collections = await db.listCollections().toArray();
  return collections.map((c) => c.name);
}

if (require.main === module) {
  listCollections()
    .then((names) => console.log("Collections under TahaMetals:", names))
    .catch((err) => console.error("Error listing collections:", err))
    .finally(() => process.exit(0));
}
