"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";

type QuotationRow = {
  qty: number | "";
  item: string;
  originalName?: string;
  size?: string | number | "";
  weight: number | "";
  rate: number | "";
  amount: number;
  uniqueKey: string;
  guage: string | number | "";
  gote?: string | "";
};

interface InventoryItem {
  name: string;
  type: string;
  weight?: number;
  quantity: number;
  pricePerKg?: number;
  pricePerUnit?: number;
  size?: string | number;
  guage?: string | number;
  gote?: string;
  pipeType?: string;
  color?: string;
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
      size: "",
    }))
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [received, setReceived] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [quotationId, setQuotationId] = useState<string>("");
  const [loading, setLoading] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [rateList, setRateList] = useState<
    Record<string, { rate: number; ratePerUnit: number }>
  >({});

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (data.success) {
          console.log("Fetched Inventory:", data.items);
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

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("/api/ratelist");
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          const rates: Record<string, { rate: number; ratePerUnit: number }> =
            {};
          data.items.forEach((item) => {
            if (item.name) {
              rates[item.name.toLowerCase()] = {
                rate: item.rate ?? 0,
                ratePerUnit: item.ratePerUnit ?? 0,
              };
            }
          });
          setRateList(rates);
        }
      } catch (err) {
        console.error("Failed to fetch rate list:", err);
      }
    };

    fetchRates();
  }, []);

  const total = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const grandTotal = total - discount;
  const balance = grandTotal - received;

  // const calculateRow = (selected: InventoryItem, qty: number) => {
  //   let weight = 0;
  //   let rate = 0;
  //   let amount = 0;
  //   let guage = "";

  //   if (!selected || !selected.name) {
  //     return { weight, rate, amount, guage };
  //   }

  //   if (
  //     selected.type?.toLowerCase() === "hardware" &&
  //     (selected.name?.toLowerCase() === "band" ||
  //       selected.name?.toLowerCase() === "cutt ball" ||
  //       selected.name?.toLowerCase() === "draz")
  //   ) {
  //     rate = Math.round(selected.pricePerUnit ?? 0);
  //     amount = qty * rate;
  //   } else {
  //     const singlePieceWeight =
  //       selected.quantity > 0 ? (selected.weight ?? 0) / selected.quantity : 0;
  //     const sellingPricePerKg = selected.pricePerKg ?? 0;
  //     const unitPrice = Math.round(singlePieceWeight * sellingPricePerKg);
  //     weight = qty * singlePieceWeight;
  //     rate = unitPrice;
  //     amount = qty * rate;
  //   }

  //   guage = selected.guage !== undefined ? selected.guage.toString() : "";
  //   return { weight, rate, amount, guage };
  // };

  // =================== HandleChange ===================

  // const handleChange = (
  //   index: number,
  //   field: keyof QuotationRow,
  //   value: any
  // ) => {
  //   const newRows = [...rows];
  //   let numValue = Number(value);
  //   if (isNaN(numValue) || numValue < 0) numValue = 0;

  //   if (field === "item") {
  //     // Match inventory (case-insensitive)
  //     const selected = inventoryItems.find(
  //       (inv) => inv.name.toLowerCase() === value.toLowerCase()
  //     );

  //     if (selected) {
  //       // Build display name
  //       let displayItem = selected.name;
  //       if (selected.type.toLowerCase() === "hardware") {
  //         displayItem += selected.size ? ` ${selected.size}` : "";
  //         if (
  //           selected.gote &&
  //           selected.gote.trim() !== "" &&
  //           selected.gote.toLowerCase() !== "without gote"
  //         ) {
  //           displayItem += ` - G ${selected.gote}`;
  //         }
  //       } else if (selected.type.toLowerCase().includes("pillar")) {
  //         displayItem =
  //           selected.pipeType?.toLowerCase() === "fancy"
  //             ? "Pillar Fancy"
  //             : `Pillar${selected.size ? " " + selected.size : ""}${
  //                 selected.gote &&
  //                 selected.gote.trim() !== "" &&
  //                 selected.gote.toLowerCase() !== "without gote"
  //                   ? ` - G ${selected.gote}`
  //                   : ""
  //               }`;
  //       } else {
  //         displayItem = selected.size
  //           ? `${selected.type} ${selected.size}`
  //           : selected.type;
  //         if (
  //           selected.gote &&
  //           selected.gote.trim() !== "" &&
  //           selected.gote.toLowerCase() !== "without gote"
  //         ) {
  //           displayItem += ` - G ${selected.gote}`;
  //         }
  //       }

  //       const qty = newRows[index].qty || 1;

  //       // ✅ Use ratePerUnit from rateList
  //       const rateFromList =
  //         rateList[selected.name.toLowerCase()]?.ratePerUnit ??
  //         selected.pricePerUnit ??
  //         0;

  //       // Calculate weight and amount
  //       let weight = 0;
  //       let amount = 0;
  //       if (
  //         selected.type.toLowerCase() === "hardware" ||
  //         selected.type.toLowerCase().includes("pillar")
  //       ) {
  //         amount = qty * rateFromList;
  //       } else {
  //         const singleWeight = selected.quantity
  //           ? (selected.weight ?? 0) / selected.quantity
  //           : 0;
  //         weight = singleWeight * qty;
  //         amount = rateFromList * qty;
  //       }

  //       newRows[index] = {
  //         ...newRows[index],
  //         item: displayItem,
  //         originalName: selected.name,
  //         size: selected.size?.toString() || "",
  //         qty,
  //         weight,
  //         rate: rateFromList,
  //         amount,
  //         guage: selected.guage?.toString() || "",
  //         gote: selected.gote?.toString() || "",
  //       };
  //     } else {
  //       // Free-text fallback
  //       newRows[index] = {
  //         ...newRows[index],
  //         item: value,
  //         originalName: value,
  //         size: "",
  //         qty: 0,
  //         weight: 0,
  //         rate: 0,
  //         amount: 0,
  //         guage: "",
  //         gote: "",
  //       };
  //     }
  //   } else if (field === "qty") {
  //     const selected = inventoryItems.find(
  //       (inv) =>
  //         inv.name.toLowerCase() ===
  //           newRows[index].originalName?.toLowerCase() &&
  //         inv.size?.toString() === newRows[index].size?.toString()
  //     );

  //     if (selected) {
  //       if (numValue > selected.quantity) {
  //         numValue = selected.quantity;
  //         alert(`Only ${selected.quantity} units available in stock!`);
  //       }

  //       const rateFromList =
  //         rateList[selected.name.toLowerCase()]?.ratePerUnit ??
  //         selected.pricePerUnit ??
  //         0;

  //       let weight = 0;
  //       let amount = 0;
  //       if (
  //         selected.type.toLowerCase() === "hardware" ||
  //         selected.type.toLowerCase().includes("pillar")
  //       ) {
  //         amount = numValue * rateFromList;
  //       } else {
  //         const singleWeight = selected.quantity
  //           ? (selected.weight ?? 0) / selected.quantity
  //           : 0;
  //         weight = singleWeight * numValue;
  //         amount = rateFromList * numValue;
  //       }

  //       newRows[index] = {
  //         ...newRows[index],
  //         qty: numValue,
  //         weight,
  //         rate: rateFromList,
  //         amount,
  //         guage: selected.guage?.toString() || "",
  //         gote: selected.gote?.toString() || "",
  //       };
  //     } else {
  //       newRows[index].qty = numValue;
  //     }
  //   } else if (field === "rate") {
  //     numValue = Math.round(numValue);
  //     newRows[index] = { ...newRows[index], rate: numValue };
  //     const qty = Number(newRows[index].qty) || 0;
  //     newRows[index].amount = qty * numValue;
  //   } else {
  //     newRows[index] = { ...newRows[index], [field]: numValue };
  //     const qty = Number(newRows[index].qty) || 0;
  //     const rate = Number(newRows[index].rate) || 0;
  //     newRows[index].amount = qty * rate;
  //   }

  //   setRows(newRows);
  // };

  const handleChange = (
    index: number,
    field: keyof QuotationRow,
    value: any
  ) => {
    const newRows = [...rows];
    let numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) numValue = 0;

    if (field === "item") {
      const selected = inventoryItems.find(
        (inv) => inv.name.toLowerCase() === value.toLowerCase()
      );

      if (selected) {
        let displayItem = "";
        if (selected.type.toLowerCase().includes("pillar")) {
          displayItem = `${selected.type} ${
            selected.size ? selected.size : ""
          } ${
            selected.gote &&
            selected.gote.trim() !== "" &&
            selected.gote.toLowerCase() !== "without gote"
              ? selected.gote
              : ""
          } - ${selected.guage || ""}`.trim();
        } else if (selected.type.toLowerCase() === "hardware") {
          displayItem = `${selected.name}${selected.size ? selected.size : ""}${
            selected.color && selected.color.trim() !== "" ? selected.color : ""
          }`;
        } else {
          displayItem = `${selected.type} ${
            selected.size ? selected.size : ""
          } - ${selected.guage || ""}`.trim();
        }

        const qty = newRows[index].qty || 1;
        const rateFromList =
          rateList[selected.name.toLowerCase()]?.ratePerUnit ??
          selected.pricePerUnit ??
          0;

        let weight = 0;
        let amount = 0;
        if (
          selected.type.toLowerCase() === "hardware" ||
          selected.type.toLowerCase().includes("pillar")
        ) {
          amount = qty * rateFromList;
        } else {
          const singleWeight = selected.quantity
            ? (selected.weight ?? 0) / selected.quantity
            : 0;
          weight = singleWeight * qty;
          amount = rateFromList * qty;
        }

        newRows[index] = {
          ...newRows[index],
          item: displayItem,
          originalName: selected.name,
          size: selected.size?.toString() || "",
          qty,
          weight,
          rate: rateFromList,
          amount,
          guage: selected.guage?.toString() || "",
          gote: selected.gote?.toString() || "",
        };
      } else {
        newRows[index] = {
          ...newRows[index],
          item: value,
          originalName: value,
          size: "",
          qty: 0,
          weight: 0,
          rate: 0,
          amount: 0,
          guage: "",
          gote: "",
        };
      }
    } else if (field === "qty") {
      // Existing qty logic remains unchanged
      const selected = inventoryItems.find(
        (inv) =>
          inv.name.toLowerCase() ===
            newRows[index].originalName?.toLowerCase() &&
          inv.size?.toString() === newRows[index].size?.toString()
      );

      if (selected) {
        if (numValue > selected.quantity) {
          numValue = selected.quantity;
          alert(`Only ${selected.quantity} units available in stock!`);
        }

        const rateFromList =
          rateList[selected.name.toLowerCase()]?.ratePerUnit ??
          selected.pricePerUnit ??
          0;

        let weight = 0;
        let amount = 0;
        if (
          selected.type.toLowerCase() === "hardware" ||
          selected.type.toLowerCase().includes("pillar")
        ) {
          amount = numValue * rateFromList;
        } else {
          const singleWeight = selected.quantity
            ? (selected.weight ?? 0) / selected.quantity
            : 0;
          weight = singleWeight * numValue;
          amount = rateFromList * numValue;
        }

        newRows[index] = {
          ...newRows[index],
          qty: numValue,
          weight,
          rate: rateFromList,
          amount,
          guage: selected.guage?.toString() || "",
          gote: selected.gote?.toString() || "",
        };
      } else {
        newRows[index].qty = numValue;
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

  // Reset form

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

      // Deduct stock
      for (const row of validRows) {
        const selectedItem = inventoryItems.find(
          (inv) =>
            inv.name.toLowerCase() === row.originalName?.toLowerCase() &&
            inv.size?.toString() === row.size?.toString()
        );

        if (selectedItem) {
          const deductQty = Number(row.qty);
          const deductWeight = Number(row.weight);

          await fetch("/api/inventory", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: selectedItem.name,
              qty: deductQty,
              weight: deductWeight,
            }),
          });
        } else {
          console.warn(`⚠️ No inventory match for "${row.item}"`);
        }
      }

      // Save quotation
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validRows.map((r) => {
            const selected = inventoryItems.find(
              (inv) =>
                inv.name.toLowerCase() === r.originalName?.toLowerCase() &&
                inv.size?.toString() === r.size?.toString()
            );

            return {
              item: selected ? selected.name : r.originalName || r.item,
              size: selected ? selected.size : r.size,
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
      alert("✅ Quotation saved & inventory updated!");

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
                {/* <td className="border border-white p-2 w-[180px]">
                  <input
                    type="text"
                    value={row.item || ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const matchedItem = inventoryItems.find(
                        (inv) =>
                          inv.name.toLowerCase() === inputValue.toLowerCase()
                      );
                      if (matchedItem) {
                        handleChange(i, "item", matchedItem.name);
                      } else {
                        handleChange(i, "item", inputValue);
                      }
                    }}
                    onFocus={(e) => {
                      e.target.value = "";
                      setRows([...rows]);
                    }}
                    className="bg-transparent text-center w-full outline-none"
                    list="inventory-options"
                    autoComplete="on"
                  />
                  <datalist id="inventory-options">
                    {inventoryItems
                      .filter((inv) => inv.quantity > 0)
                      .map((inv, idx) => {
                        let displayValue = "";
                        if (inv.type.toLowerCase().includes("pillar")) {
                          displayValue = `${inv.type} ${
                            inv.size ? inv.size : ""
                          } ${
                            inv.gote &&
                            inv.gote.trim() !== "" &&
                            inv.gote.toLowerCase() !== "without gote"
                              ? inv.gote
                              : ""
                          } - ${inv.guage || ""}`.trim();
                        } else if (inv.type.toLowerCase() === "hardware") {
                          displayValue = `${inv.name}${
                            inv.size ? inv.size : ""
                          }${
                            inv.color && inv.color.trim() !== ""
                              ? inv.color
                              : ""
                          }`;
                        } else {
                          displayValue = `${inv.type} ${
                            inv.size ? inv.size : ""
                          } - ${inv.guage || ""}`.trim();
                        }
                        return (
                          <option
                            key={idx}
                            value={inv.name}
                            label={displayValue}
                          />
                        );
                      })}
                  </datalist>
                </td> */}

                <td className="border border-white p-2 w-[180px]">
                  <input
                    type="text"
                    value={row.item || ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const matchedItem = inventoryItems.find(
                        (inv) =>
                          inv.name.toLowerCase() === inputValue.toLowerCase()
                      );
                      if (matchedItem) {
                        handleChange(i, "item", matchedItem.name);
                      } else {
                        handleChange(i, "item", inputValue);
                      }
                    }}
                    onFocus={(e) => {
                      e.target.value = "";
                      setRows([...rows]);
                    }}
                    className="bg-transparent text-center w-full outline-none"
                    list="inventory-options"
                    autoComplete="on"
                  />
                  <datalist id="inventory-options">
                    {inventoryItems
                      .filter((inv) => inv.quantity > 0)
                      .slice(0, 10) // Limit to 10 items (adjust as needed)
                      .map((inv, idx) => {
                        let displayValue = "";
                        if (inv.type.toLowerCase().includes("pillar")) {
                          displayValue = `${inv.type} ${
                            inv.size ? inv.size : ""
                          } ${
                            inv.gote &&
                            inv.gote.trim() !== "" &&
                            inv.gote.toLowerCase() !== "without gote"
                              ? inv.gote
                              : ""
                          } - ${inv.guage || ""}`.trim();
                        } else if (inv.type.toLowerCase() === "hardware") {
                          displayValue = `${inv.name}${
                            inv.size ? inv.size : ""
                          }${
                            inv.color && inv.color.trim() !== ""
                              ? inv.color
                              : ""
                          }`;
                        } else {
                          displayValue = `${inv.type} ${
                            inv.size ? inv.size : ""
                          } - ${inv.guage || ""}`.trim();
                        }
                        return (
                          <option
                            key={idx}
                            value={inv.name}
                            label={displayValue}
                          />
                        );
                      })}
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
