import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface Item {
  _id?: ObjectId | string;
  name: string;
  type: string;
  pipeType: string;
  guage: number | string;
  gote: number | string;
  size: number | string;
  weight: number | string;
  quantity: number | string;
  price: number | string;
  height?: number | string | null;
  index: number;
  date: string; // using ISO string format
}

// ✅ Get all items
export async function getItems() {
  const client = await clientPromise;
  const db = client.db("yourDatabaseName");
  return db.collection<Item>("items").find().toArray();
}

// ✅ Add new item
export async function addItem(item: Omit<Item, "_id">) {
  const client = await clientPromise;
  const db = client.db("yourDatabaseName");

  const newItem = {
    ...item,
    date: new Date().toISOString(),
  };

  const result = await db.collection<Item>("items").insertOne(newItem);
  return result;
}

// ✅ Delete item by ID
export async function deleteItem(id: string) {
  const client = await clientPromise;
  const db = client.db("yourDatabaseName");
  return db.collection<Item>("items").deleteOne({ _id: new ObjectId(id) });
}

// ✅ Update item (optional if you need it)
export async function updateItem(id: string, updates: Partial<Item>) {
  const client = await clientPromise;
  const db = client.db("yourDatabaseName");
  return db
    .collection<Item>("items")
    .updateOne({ _id: new ObjectId(id) }, { $set: updates });
}
