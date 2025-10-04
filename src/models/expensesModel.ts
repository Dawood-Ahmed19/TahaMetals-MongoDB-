import mongoose, { Schema, models } from "mongoose";

const expenseSchema = new Schema(
  {
    month: { type: String, required: true }, // "2025-09"
    entries: [
      {
        date: { type: String, required: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default models.Expense || mongoose.model("Expense", expenseSchema);
