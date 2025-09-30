"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";
import Select from "react-select";

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

const STORAGE_KEY = "current_invoice";

const QuotationTable: React.FC<{ onSaveSuccess?: () => void }> = ({
  onSaveSuccess,
}) => {
  const [rows, setRows] = useState<QuotationRow[]>([]);
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
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setRows(parsed.rows || []);
      setDiscount(parsed.discount || 0);
      setReceived(parsed.received || 0);
      setLoading(parsed.loading || 0);
      setQuotationId(parsed.quotationId || "");
    } else {
      setRows([
        {
          qty: 0,
          item: "",
          weight: 0,
          rate: 0,
          amount: 0,
          uniqueKey: uuidv4(),
          guage: "",
          size: "",
        },
      ]);
    }
    setMounted(true);
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rows, discount, received, loading, quotationId })
    );
  }, [rows, discount, received, loading, quotationId, mounted]);

  // Add row
  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        qty: 0,
        item: "",
        weight: 0,
        rate: 0,
        amount: 0,
        uniqueKey: uuidv4(),
        guage: "",
        size: "",
      },
    ]);
  };

  // New Invoice (reset everything)
  const newInvoice = () => {
    setRows([
      {
        qty: 0,
        item: "",
        weight: 0,
        rate: 0,
        amount: 0,
        uniqueKey: uuidv4(),
        guage: "",
        size: "",
      },
    ]);
    setDiscount(0);
    setReceived(0);
    setLoading(0);
    setQuotationId(""); // reset ID, so next save = new quotation
    localStorage.removeItem(STORAGE_KEY);
  };

  // Fetch inventory
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

  // Fetch rates
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
              const key = `${item.name.toLowerCase()}|${item.size ?? ""}|${
                item.guage ?? ""
              }`;
              rates[key] = {
                rate: Number(item.rate) || 0,
                ratePerUnit: Number(item.ratePerUnit) || 0,
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

  const handleChange = (
    index: number,
    field: keyof QuotationRow,
    value: any
  ) => {
    const newRows = [...rows];
    let numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) numValue = 0;

    if (field === "item") {
      const [name, size, guage] = (value ?? "").split("|");

      const selected = inventoryItems.find(
        (inv) =>
          inv.name === name &&
          (size === "" || inv.size?.toString() === size) &&
          (guage === "" || inv.guage?.toString() === guage)
      );

      if (selected) {
        let displayItem = "";
        if (selected.type.toLowerCase().includes("pillar")) {
          displayItem = `${selected.type} ${selected.size || ""} ${
            selected.gote &&
            selected.gote.trim() !== "" &&
            selected.gote.toLowerCase() !== "without gote"
              ? selected.gote
              : ""
          } - ${selected.guage || ""}`.trim();
        } else if (selected.type.toLowerCase() === "hardware") {
          displayItem = `${selected.name} ${
            selected.size ? selected.size : ""
          }${
            selected.color && selected.color.trim() !== "" ? selected.color : ""
          }`;
        } else {
          displayItem = `${selected.type} ${selected.size || ""} - ${
            selected.guage || ""
          }`.trim();
        }

        const qty =
          newRows[index].qty && newRows[index].qty > 0 ? newRows[index].qty : 1;

        const key = `${selected.name.toLowerCase()}|${selected.size ?? ""}|${
          selected.guage ?? ""
        }`;
        const rawRate = rateList[key]?.ratePerUnit || 0;
        const rateFromList = Number(rawRate) || 0;

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
          amount: Math.round(amount),
          guage: selected.guage?.toString() || "",
          gote: selected.gote?.toString() || "",
        };
      }
    } else if (field === "qty") {
      // ... same qty logic (shortened for brevity, you keep yours)
      newRows[index].qty = numValue;
    } else if (field === "rate") {
      numValue = Math.round(numValue);
      newRows[index] = { ...newRows[index], rate: numValue };
      const qty = Number(newRows[index].qty) || 0;
      newRows[index].amount = Math.round(qty * numValue);
    } else {
      newRows[index] = { ...newRows[index], [field]: numValue };
      const qty = Number(newRows[index].qty) || 0;
      const rate = Number(newRows[index].rate) || 0;
      newRows[index].amount = Math.round(qty * rate);
    }

    setRows(newRows);
  };

  const saveQuotation = async () => {
    const validRows = rows.filter((r) => r.item && r.qty && r.rate);
    if (validRows.length === 0) {
      alert("Please add at least one item before saving.");
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationId: quotationId || undefined, // send ID if overwriting
          items: validRows.map((row) => ({
            ...row,
            item: row.originalName || row.item,
          })),
          discount,
          total,
          loading,
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
      alert("✅ Quotation saved (overwrites until 'New Invoice')");
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error("Error in saveQuotation:", err?.message || err);
      alert("❌ Error saving quotation: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePdf = async (id?: string) => {
    if (!quotationId && !id) {
      alert("No quotation id to generate PDF for.");
      return;
    }
    setIsGeneratingPdf(true);
    try {
      await generateInvoicePDF(id || quotationId);
    } catch (err) {
      console.error("PDF error:", err);
      alert("Failed to generate PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!mounted) return null;

  const resetInvoice = () => {
    setRows([
      {
        qty: 0,
        item: "",
        weight: 0,
        rate: 0,
        amount: 0,
        uniqueKey: uuidv4(),
        guage: "",
        size: "",
      },
    ]);
    setDiscount(0);
    setReceived(0);
    setLoading(0);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rows: [],
        discount: 0,
        received: 0,
        loading: 0,
        quotationId,
      })
    );
  };

  return (
    <>
      <div
        id="invoice-section"
        className="flex justify-center items-start w-full max-w-[600px] bg-gray-900 overflow-auto text-xs"
      >
        <table className="text-white table-auto border-collapse border border-gray-600 w-full overflow-y-auto">
          <thead>
            <tr className="bg-gray-800 text-center h-[40px]">
              <th className="border border-white p-2 w-[60px]">Qty</th>
              <th className="border border-white p-2 w-[180px]">Item</th>
              <th className="border border-white p-2 w-[80px]">Guage</th>
              <th className="border border-white p-2 w-[80px]">Weight</th>
              <th className="border border-white p-2 w-[100px]">Rate</th>
              <th className="border border-white p-2 w-[100px]">Amount</th>
            </tr>
          </thead>
          <tbody className="align-top">
            {rows.map((row, i) => (
              <tr
                key={row.uniqueKey}
                className="text-center h-[30px] align-middle"
              >
                <td className="border border-white">
                  <input
                    min={0}
                    type="number"
                    step={1}
                    value={Number.isNaN(Number(row.qty)) ? "" : row.qty}
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
                        (inv) => inv.name === (row.item?.split(" ")[0] ?? "")
                      )?.quantity || undefined
                    }
                  />
                </td>

                <td className="border border-white p-2 w-[180px]">
                  <Select
                    options={inventoryItems
                      .filter((inv) => inv.quantity > 0)
                      .map((inv) => ({
                        value: `${inv.name}|${inv.size ?? ""}|${
                          inv.guage ?? ""
                        }`,
                        label: inv.type.toLowerCase().includes("pillar")
                          ? `${inv.type} ${inv.size || " "} ${
                              inv.gote &&
                              inv.gote.trim() !== "" &&
                              inv.gote.toLowerCase() !== "without gote"
                                ? inv.gote
                                : ""
                            } - ${inv.guage || ""}`.trim()
                          : inv.type.toLowerCase() === "hardware"
                          ? `${inv.name} ${inv.size ? inv.size : ""}${
                              inv.color && inv.color.trim() !== ""
                                ? inv.color
                                : ""
                            }`
                          : `${inv.type} ${inv.size ? inv.size : ""} - ${
                              inv.guage || ""
                            }`.trim(),
                      }))}
                    onChange={(selectedOption) =>
                      handleChange(i, "item", selectedOption?.value ?? "")
                    }
                    value={
                      row.originalName
                        ? {
                            value: `${row.originalName}|${row.size ?? ""}|${
                              row.guage ?? ""
                            }`,
                            label: row.item,
                          }
                        : null
                    }
                    placeholder="Select item..."
                    isSearchable
                    menuPortalTarget={document.body}
                    className="w-[180px] text-center"
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({
                        ...base,
                        maxHeight: 400,
                        overflowY: "auto",
                        backgroundColor: "#1f2937",
                        color: "white",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused
                          ? "#374151"
                          : "#1f2937",
                        color: "white",
                        cursor: "pointer",
                        textAlign: "center",
                      }),
                      control: (base) => ({
                        ...base,
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        minHeight: "24px",
                        height: "24px",
                        boxShadow: "none",
                        justifyContent: "center",
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "white",
                        textAlign: "center",
                        width: "100%",
                      }),
                      input: (base) => ({
                        ...base,
                        color: "white",
                        textAlign: "center",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#9CA3AF",
                        textAlign: "center",
                        width: "100%",
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        justifyContent: "center",
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        height: "24px",
                      }),
                    }}
                  />
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
                      row.weight !== "" && !Number.isNaN(Number(row.weight))
                        ? Number(row.weight).toLocaleString("en-US", {
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
                    value={Number.isNaN(Number(row.rate)) ? "" : row.rate}
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
                    : Number(row.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                </td>
              </tr>
            ))}

            {/* Totals */}
            <tr className="bg-gray-800 font-bold align-middle">
              <td colSpan={4} />
              <td className="border border-white text-center">TOTAL</td>
              <td className="border border-white text-center">
                {total.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold align-middle">
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

            <tr className="bg-gray-800 font-bold align-middle">
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

            <tr className="bg-gray-800 font-bold align-middle">
              <td colSpan={4} />
              <td className="border border-white text-center">BALANCE</td>
              <td className="border border-white text-center">
                {balance.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold align-middle">
              <td colSpan={4} />
              <td className="border border-white text-center">LOADING</td>
              <td className="border border-white text-center">
                <input
                  type="number"
                  min={0}
                  value={loading || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLoading(value === "" ? 0 : Number(value));
                  }}
                  className="bg-transparent text-center w-full outline-none"
                />
              </td>
            </tr>

            <tr className="bg-gray-800 font-bold align-middle">
              <td colSpan={4} />
              <td className="border border-white text-center">GRAND TOTAL</td>
              <td className="border border-white text-center">
                {grandTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex gap-3">
        <button
          onClick={addRow}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
        >
          + Add Row
        </button>

        <button
          onClick={newInvoice}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          New Invoice
        </button>

        <button
          onClick={resetInvoice}
          className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded text-white"
        >
          Reset Invoice
        </button>
      </div>

      <span className="no-print flex items-center gap-4">
        {!quotationId ? (
          <button
            onClick={saveQuotation}
            disabled={isSaving}
            className="mt-5 bg-blue-600 px-4 py-2 rounded text-white disabled:opacity-50"
          >
            {isSaving ? "Loading..." : "Save"}
          </button>
        ) : (
          <>
            <button
              onClick={saveQuotation}
              disabled={isSaving}
              className="mt-5 bg-yellow-600 px-4 py-2 rounded text-white disabled:opacity-50"
            >
              {isSaving ? "Loading..." : "Update Invoice"}
            </button>
            <button
              onClick={async () => await handleGeneratePdf()}
              disabled={isGeneratingPdf}
              className="mt-5 bg-green-600 px-4 py-2 rounded text-white disabled:opacity-50"
            >
              {isGeneratingPdf ? "Generating..." : "Download PDF"}
            </button>
          </>
        )}
      </span>
    </>
  );
};

export default QuotationTable;
