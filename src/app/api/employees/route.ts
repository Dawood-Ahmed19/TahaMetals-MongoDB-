import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, role, monthlySalary } = body;
    const db = await getDb();

    const result = await db.collection("employees").insertOne({
      name,
      role,
      monthlySalary: Number(monthlySalary),
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add employee" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const employees = await db.collection("employees").find({}).toArray();
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
