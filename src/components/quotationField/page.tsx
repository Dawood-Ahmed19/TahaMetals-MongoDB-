"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";

type QuotationRow = {
  qty: number | "";
  item: string;
  weight: number | "";
  rate: number | "";
  amount: number;
  uniqueKey: string;
  guage: string | number | "";
};

interface InventoryItem {
  name: string;
  type: string;
  weight?: number;
  quantity: number;
  pricePerKg?: number;
  pricePerUnit?: number;
  size?: string;
  guage?: string | number;
}

const QuotationTable: React.FC<{ onSaveSuccess?: () => void }> = ({
  onSaveSuccess,
}) => {
  const [rows, setRows] = useState<QuotationRow[]>(
    Array.from({ length: 14 }, () => ({
      qty: 0,
      item: "",
      weight: 0,
      rate: 0,
      amount: 0,
      uniqueKey: uuidv4(),
      guage: "",
    }))
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [received, setReceived] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");
  const [loading, setLoading] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (data.success) {
          console.log("Fetched Inventory Items with Guage:", data.items);
          setInventoryItems(data.items || []);
        } else {
          console.error("Fetch failed:", data.message);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    };
    fetchInventory();
  }, []);

  const total = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const grandTotal = total - discount;
  const balance = grandTotal - received;

  const calculateRow = (selected: InventoryItem, qty: number) => {
    let weight = 0;
    let rate = 0;
    let amount = 0;
    let guage = "";

    if (!selected || !selected.name) {
      console.warn("Invalid selected item:", selected);
      return { weight, rate, amount, guage };
    }

    if (
      selected.type?.toLowerCase() === "hardware" &&
      (selected.name?.toLowerCase() === "band" ||
        selected.name?.toLowerCase() === "cutt ball" ||
        selected.name?.toLowerCase() === "draz")
    ) {
      weight = 0;
      rate = Math.round(selected.pricePerUnit ?? 0);
      amount = qty * rate;
    } else {
      const singlePieceWeight =
        selected.quantity > 0 ? (selected.weight ?? 0) / selected.quantity : 0;
      const sellingPricePerKg = selected.pricePerKg ?? 0;
      const unitPrice = Math.round(singlePieceWeight * sellingPricePerKg);
      weight = qty * singlePieceWeight;
      rate = unitPrice;
      amount = qty * rate;
    }

    guage = selected.guage !== undefined ? selected.guage.toString() : "";
    return { weight, rate, amount, guage };
  };

  // =================== HandleChange ===================
  const handleChange = (
    index: number,
    field: keyof QuotationRow,
    value: any
  ) => {
    const newRows = [...rows];
    let numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) numValue = 0;

    if (field === "item") {
      const selected = inventoryItems.find((inv) => inv.name === value);
      if (selected) {
        const displayItem = `${selected.type} ${selected.size || ""}`.trim();
        const qty = newRows[index].qty || 1;
        const { weight, rate, amount, guage } = calculateRow(selected, qty);
        newRows[index] = {
          ...newRows[index],
          item: displayItem,
          qty,
          weight,
          rate,
          amount,
          guage,
        };
      } else {
        newRows[index] = {
          ...newRows[index],
          item: value,
          rate: 0,
          weight: 0,
          amount: 0,
          guage: "",
        };
      }
    } else if (field === "qty") {
      const [type, size] = newRows[index].item.split(" "); // Match full item (type and size)
      const selected = inventoryItems.find(
        (inv) =>
          inv.type.toLowerCase() === type.toLowerCase() && inv.size === size
      );
      if (selected) {
        if (numValue > selected.quantity) {
          numValue = selected.quantity;
          alert(`Only ${selected.quantity} units available in stock!`);
        }
        newRows[index] = { ...newRows[index], qty: numValue };
        const { weight, rate, amount, guage } = calculateRow(
          selected,
          numValue
        );
        newRows[index].weight = weight;
        newRows[index].rate = rate;
        newRows[index].amount = amount;
        newRows[index].guage = guage;
      } else {
        newRows[index].qty = numValue; // Only update qty, preserve other fields
      }
    } else if (field === "rate") {
      numValue = Math.round(numValue);
      newRows[index] = { ...newRows[index], rate: numValue };
      const qty = Number(newRows[index].qty) || 0;
      newRows[index].amount = qty * numValue;
    } else {
      newRows[index] = { ...newRows[index], [field]: numValue };
      const qty = Number(newRows[index].qty) || 0;
      const rate = Number(newRows[index].rate) || 0;
      newRows[index].amount = qty * rate;
    }

    setRows(newRows);
  };

  // ========================== Reset Form ==========================

  const resetForm = () => {
    setRows(
      Array.from({ length: 14 }, () => ({
        qty: 0,
        item: "",
        weight: 0,
        rate: 0,
        amount: 0,
        uniqueKey: uuidv4(),
        guage: "",
      }))
    );
    setDiscount(0);
    setReceived(0);
    setLoading(0);
    setQuotationId("");
  };

  // =================== Save Quotation ===================
  const saveQuotation = async () => {
    const validRows = rows.filter((r) => r.item && r.qty && r.rate);

    if (validRows.length === 0) {
      alert("Please add at least one item before saving.");
      return;
    }

    try {
      setIsSaving(true);

      // Deduct stock for each valid row
      for (const row of validRows) {
        const [type] = row.item.split(" "); // Extract type to find original name
        const selectedItem = inventoryItems.find(
          (inv) =>
            inv.type.toLowerCase() === type.toLowerCase() &&
            inv.size === row.item.split(" ")[1]
        );
        if (selectedItem) {
          const deductQty = Number(row.qty);
          const deductWeight = Number(row.weight);

          await fetch("/api/inventory", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: selectedItem.name, // Use original name (e.g., "p001")
              qty: deductQty,
              weight: deductWeight,
            }),
          });
        }
      }

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validRows.map((r) => {
            const [type] = r.item.split(" ");
            const selected = inventoryItems.find(
              (inv) =>
                inv.type.toLowerCase() === type.toLowerCase() &&
                inv.size === r.item.split(" ")[1]
            );
            return {
              item: selected ? selected.name : r.item,
              qty: Number(r.qty),
              weight: Number(r.weight),
              rate: Number(r.rate),
              amount: Number(r.amount),
              guage: selected ? selected.guage : r.guage,
            };
          }),
          discount,
          total,
          grandTotal,
          payments:
            received > 0
              ? [{ amount: received, date: new Date().toISOString() }]
              : [],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || "Failed to save quotation");
      }

      setQuotationId(data.quotation?.quotationId || "");
      alert("✅ Quotation saved & inventory updated (profits included)!");

      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error("Error in saveQuotation:", err.message);
      alert("❌ Error saving quotation: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        id="invoice-section"
        className="flex justify-center items-center max-w-[600px] max-h-[600px] h-full bg-gray-900 text-xs"
      >
        <table
          className="text-white"
          style={{ width: "600px", height: "600px" }}
        >
          <thead>
            <tr className="bg-gray-800 text-center">
              <th className="border border-white p-2 w-[60px]">Qty</th>
              <th className="border border-white p-2 w-[180px]">Item</th>
              <th className="border border-white p-2 w-[80px]">Guage</th>
              <th className="border border-white p-2 w-[80px]">Weight</th>
              <th className="border border-white p-2 w-[100px]">Rate</th>
              <th className="border border-white p-2 w-[100px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="text-center">
                <td className="border border-white">
                  <input
                    min={0}
                    type="number"
                    step={1}
                    value={Number.isNaN(row.qty) ? "" : row.qty}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue =
                        value === "" ? 0 : parseInt(value, 10);
                      handleChange(
                        i,
                        "qty",
                        Number.isNaN(parsedValue) ? 0 : parsedValue
                      );
                    }}
                    className="bg-transparent text-center w-full outline-none"
                    max={
                      inventoryItems.find(
                        (inv) => inv.name === row.item.split(" ")[0]
                      )?.quantity || undefined
                    }
                  />
                </td>

                <td className="border border-white">
                  <input
                    type="text"
                    value={row.item || ""}
                    onChange={(e) => handleChange(i, "item", e.target.value)}
                    className="bg-transparent text-center w-full outline-none"
                    list="inventory-options"
                  />
                  <datalist id="inventory-options">
                    {inventoryItems
                      .filter((inv) => inv.quantity > 0)
                      .map((inv, idx) => (
                        <option key={idx} value={inv.name} />
                      ))}
                  </datalist>
                </td>

                <td className="border border-white">
                  <input
                    type="text"
                    value={
                      row.guage && !Number.isNaN(Number(row.guage))
                        ? row.guage.toString()
                        : row.guage || ""
                    }
                    readOnly
                    className="bg-transparent text-center w-full outline-none"
                  />
                </td>

                <td className="border border-white">
                  <input
                    min={0}
                    type="text"
                    value={
                      row.weight && !Number.isNaN(row.weight)
                        ? row.weight.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                        : ""
                    }
                    readOnly
                    className="bg-transparent text-center w-full outline-none"
                  />
                </td>

                <td className="border border-white">
                  <input
                    min={0}
                    type="number"
                    step={1}
                    value={Number.isNaN(row.rate) ? "" : row.rate}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue =
                        value === "" ? 0 : parseInt(value, 10);
                      handleChange(
                        i,
                        "rate",
                        Number.isNaN(parsedValue) ? 0 : parsedValue
                      );
                    }}
                    className="bg-transparent text-center w-full outline-none"
                  />
                </td>

                <td className="border border-white">
                  {Number.isNaN(row.amount) || row.amount === 0
                    ? ""
                    : row.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr className="bg-gray-800 font-bold">
              <td colSpan={4} />
              <td className="border border-white text-center">TOTAL</td>
              <td className="border border-white text-center">
                {total.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={4} />
              <td className="border border-white text-center">DISCOUNT</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={4} />
              <td className="border border-white text-center">RECEIVED</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={received}
                  onChange={(e) => setReceived(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={4} />
              <td className="border border-white text-center">BALANCE</td>
              <td className="border border-white text-center">
                {balance.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
            <tr className="bg-gray-800 font-bold">
              <td colSpan={4} />
              <td className="border border-white text-center">LOADING</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={loading || ""}
                  onChange={(e) => setLoading(Number(e.target.value) || 0)}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold">
              <td colSpan={4} />
              <td className="border border-white text-center">GRAND TOTAL</td>
              <td className="border border-white text-center">
                {grandTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <span className="no-print flex items-center gap-4">
        {!quotationId ? (
          <button
            onClick={saveQuotation}
            disabled={isSaving}
            className="mt-5 bg-blue-600 px-4 py-2 rounded text-white hover:cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Loading..." : "Save"}
          </button>
        ) : (
          <button
            onClick={async () => {
              if (!quotationId) return;
              await generateInvoicePDF(quotationId);
              resetForm();
            }}
            disabled={isGeneratingPdf}
            className="mt-5 bg-green-600 px-4 py-2 rounded text-white hover:cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPdf ? "Generating..." : "Download PDF"}
          </button>
        )}
      </span>
    </>
  );
};

export default QuotationTable;
