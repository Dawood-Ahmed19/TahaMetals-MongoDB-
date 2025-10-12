import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthKey = searchParams.get("month");
    if (!monthKey) return NextResponse.json({ success: false, total: 0 });

    const [yearStr, monthNumStr] = monthKey.split("-");
    const year = Number(yearStr);
    const monthName = MONTHS[Number(monthNumStr) - 1];

    const client = await clientPromise;
    const db = client.db("TahaMetals");

    const agg = await db
      .collection("salaries")
      .aggregate([
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    {
                      $cond: [
                        { $eq: [{ $type: "$year" }, "string"] },
                        { $toInt: "$year" },
                        "$year",
                      ],
                    },
                    year,
                  ],
                },
                {
                  $regexMatch: {
                    input: "$month",
                    regex: `^${monthName.trim()}$`,
                    options: "i",
                  },
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $add: ["$paidAmount", "$advancePaid"] } },
          },
        },
      ])
      .toArray();

    const total = agg[0]?.total || 0;
    return NextResponse.json({ success: true, total });
  } catch (error) {
    console.error("GET /api/salaries/total error:", error);
    return NextResponse.json({ success: false, total: 0 });
  }
}
