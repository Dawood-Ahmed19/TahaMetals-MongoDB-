"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type QuotationRow = {
  qty: number | "";
  item: string;
  weight: number | "";
  rate: number | "";
  amount: number;
  uniqueKey: string;
};

interface InventoryItem {
  name: string;
  weight: number;
  rate: number;
  quantity: number;
  price: number;
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
    }))
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [received, setReceived] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (data.success) {
          setInventoryItems(data.items || []);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    };
    fetchInventory();
  }, []);

  // Totals
  const total = rows.reduce((acc, row) => acc + row.amount, 0);
  const grandTotal = total - discount;
  const balance = grandTotal - received;

  // ========== Save Quotation ==============
  const saveQuotation = async () => {
    const validRows = rows.filter((r) => r.item && r.qty && r.rate);

    if (validRows.length === 0) {
      alert("Please add at least one item before saving.");
      return;
    }

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validRows.map((r) => ({
            item: r.item,
            qty: Number(r.qty),
            weight: Number(r.weight),
            rate: Number(r.rate),
          })),
          discount,
          total,
          grandTotal,
          payments:
            received > 0
              ? [{ amount: received, date: new Date().toISOString() }]
              : [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to save quotation");
      }

      setQuotationId(data.quotation?.quotationId || "");
      alert("✅ Quotation saved & inventory updated!");

      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error("Error in saveQuotation:", err.message);
      alert("❌ Error saving quotation: " + err.message);
    }
  };

  // =================== HandleChange Function ===================
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
        const singlePieceWeight =
          selected.quantity > 0 ? selected.weight / selected.quantity : 0;
        const sellingPricePerKg = selected.price + 10;
        const unitPrice = singlePieceWeight * sellingPricePerKg;
        const qty = 1;
        const weight = qty * singlePieceWeight;
        const rate = qty * unitPrice;
        const amount = rate;

        newRows[index] = {
          ...newRows[index],
          item: value,
          qty,
          weight,
          rate,
          amount,
        };
      } else {
        newRows[index] = { ...newRows[index], item: value };
      }
    } else if (field === "qty") {
      const selected = inventoryItems.find(
        (inv) => inv.name === newRows[index].item
      );

      if (selected) {
        if (numValue > selected.quantity) {
          numValue = selected.quantity;
          alert(`Only ${selected.quantity} units available in stock!`);
        }

        newRows[index] = { ...newRows[index], qty: numValue };

        if (numValue > 0) {
          const singlePieceWeight =
            selected.quantity > 0 ? selected.weight / selected.quantity : 0;
          const sellingPricePerKg = selected.price + 10;
          const unitPrice = singlePieceWeight * sellingPricePerKg;
          const weight = numValue * singlePieceWeight;
          const rate = numValue * unitPrice;
          const amount = rate;

          newRows[index].weight = weight;
          newRows[index].rate = rate;
          newRows[index].amount = amount;
        } else {
          newRows[index].weight = 0;
          newRows[index].rate = 0;
          newRows[index].amount = 0;
        }
      } else {
        newRows[index].qty = numValue;
      }
    } else {
      newRows[index] = { ...newRows[index], [field]: numValue };
      const qty = Number(newRows[index].qty) || 0;
      const rate = Number(newRows[index].rate) || 0;
      newRows[index].amount = qty * rate;
    }

    setRows(newRows);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const brandX = 40;
      const brandY = 30;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(253, 186, 116);
      doc.text("Taha", brandX, brandY);
      const tahaWidth = (doc as any).getTextWidth("Taha");
      doc.setTextColor(0, 0, 0);
      doc.text("Metals", brandX + tahaWidth + 6, brandY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Invoice / Quotation", brandX, brandY + 18);

      const pageWidth =
        typeof doc.internal.pageSize.getWidth === "function"
          ? doc.internal.pageSize.getWidth()
          : (doc.internal.pageSize as any).width;
      const rightX = pageWidth - 50;
      const today = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${today}`, rightX, brandY, { align: "right" });

      if (quotationId) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(`Quotation ID: ${quotationId}`, rightX, brandY + 15, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0); // reset to black for rest
      }

      const head = [["Qty", "Item", "Weight", "Rate", "Amount"]];
      const body = rows
        .filter((r) => r.item && r.qty && r.rate)
        .map((r) => [
          String(r.qty),
          r.item,
          Number.isNaN(Number(r.weight)) ? "0.00" : Number(r.weight).toFixed(2),
          Number.isNaN(Number(r.rate)) ? "0.00" : Number(r.rate).toFixed(2),
          Number.isNaN(Number(r.amount)) ? "0.00" : Number(r.amount).toFixed(2),
        ]);

      const startY = 100;
      (autoTable as any)(doc, {
        head,
        body,
        startY,
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [45, 55, 72], textColor: 255 },
        margin: { left: 40, right: 40 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;

      // Totals block on right
      doc.setFontSize(11);
      const rightXTotal = pageWidth - 160;

      doc.text(
        `TOTAL: ${Number.isNaN(total) ? "0.00" : total.toFixed(2)}`,
        rightXTotal,
        finalY
      );
      doc.text(
        `DISCOUNT: ${Number.isNaN(discount) ? "0.00" : discount.toFixed(2)}`,
        rightXTotal,
        finalY + 16
      );
      doc.text(
        `BALANCE: ${Number.isNaN(balance) ? "0.00" : balance.toFixed(2)}`,
        rightXTotal,
        finalY + 32
      );
      doc.text(
        `GRAND TOTAL: ${
          Number.isNaN(grandTotal) ? "0.00" : grandTotal.toFixed(2)
        }`,
        rightXTotal,
        finalY + 48
      );

      // Footer
      doc.setFontSize(10);
      doc.text(
        "Thank you for Purchasing!",
        40,
        (doc.internal.pageSize as any).height - 40
      );

      const filename = `invoice_${
        quotationId || new Date().toISOString().slice(0, 10)
      }.pdf`;
      doc.save(filename);

      // Reset all fields after successful PDF generation
      setRows(
        Array.from({ length: 14 }, () => ({
          qty: 0,
          item: "",
          weight: 0,
          rate: 0,
          amount: 0,
          uniqueKey: uuidv4(),
        }))
      );
      setDiscount(0);
      setReceived(0);
      setQuotationId("");
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
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
              <th className="border border-white p-2 w-[100px]">Weight</th>
              <th className="border border-white p-2 w-[120px]">Rate</th>
              <th className="border border-white p-2 w-[140px]">Amount</th>
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
                      inventoryItems.find((inv) => inv.name === row.item)
                        ?.quantity || undefined
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
                    min={0}
                    type="text"
                    value={
                      row.weight && !Number.isNaN(row.weight)
                        ? Number(row.weight).toFixed(2)
                        : ""
                    }
                    readOnly
                    onChange={(e) => handleChange(i, "weight", e.target.value)}
                    className="bg-transparent text-center w-full outline-none"
                  />
                </td>

                <td className="border border-white">
                  <input
                    min={0}
                    type="number"
                    value={
                      Number.isNaN(row.rate) || row.rate === 0
                        ? ""
                        : Number(row.rate).toFixed(2)
                    }
                    onChange={(e) => handleChange(i, "rate", e.target.value)}
                    className="bg-transparent text-center w-full outline-none"
                  />
                </td>

                <td className="border border-white">
                  {Number.isNaN(row.amount) || row.amount === 0
                    ? ""
                    : Number(row.amount).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">TOTAL</td>
              <td className="border border-white text-center">
                {Number.isNaN(total) ? "0" : total.toFixed(2)}
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">DISCOUNT</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsedValue = value === "" ? 0 : parseFloat(value);
                    setDiscount(
                      Number.isNaN(parsedValue)
                        ? 0
                        : parseFloat(parsedValue.toFixed(2))
                    );
                  }}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">RECEIVED</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={received}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsedValue = value === "" ? 0 : parseFloat(value);
                    setReceived(
                      Number.isNaN(parsedValue)
                        ? 0
                        : parseFloat(parsedValue.toFixed(2))
                    );
                  }}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">BALANCE</td>
              <td className="border border-white text-center">
                {Number.isNaN(balance) ? "0.00" : balance.toFixed(2)}
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold">
              <td colSpan={3} />
              <td className="border border-white text-center">GRAND TOTAL</td>
              <td className="border border-white text-center">
                {Number.isNaN(grandTotal) ? "0.00" : grandTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <span className="no-print flex items-center gap-4">
        <button
          onClick={saveQuotation}
          className="mt-4 bg-blue-600 px-4 py-2 rounded text-white hover:cursor-pointer"
        >
          Save
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf || !quotationId}
          className="mt-4 bg-green-600 px-4 py-2 rounded text-white hover:cursor-pointer"
        >
          {isGeneratingPdf
            ? "Generating..."
            : !quotationId
            ? "Save first"
            : "Download PDF"}
        </button>
      </span>
    </>
  );
};

export default QuotationTable;
