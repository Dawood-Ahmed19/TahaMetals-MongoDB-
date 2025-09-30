"use client";

import { useState, useEffect } from "react";

const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

interface ItemRow {
  _id: string;
  name: string;
  type?: string;
  pipeType?: string;
  guage?: string | number | null;
  gote?: string | number | null;
  weight?: number | null;
  quantity?: number;
  rate?: string;
  ratePerUnit?: string;
  size?: string | number;
  color?: string;

  pricePerKg?: number;
  pricePerUnit?: number;

  // inline error fields
  errorRate?: string;
  errorUnit?: string;
}

const Ratelist = () => {
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  const getDisplayName = (item: ItemRow) => {
    if (!item) return "";
    const type = item.type?.toLowerCase() || "";

    if (type === "hardware") {
      return `${item.name || ""}${item.size ? " " + item.size : ""}${
        item.color && item.color.trim() !== "" ? " " + item.color : ""
      }`.trim();
    }
    if (type.includes("pillar")) {
      return `${item.type || "Pillar"} ${
        item.size ? " " + item.size : ""
      }`.trim();
    }
    if (type === "pipe") {
      return `${item.type || "Pipe"} ${
        item.size ? " " + item.size : ""
      }`.trim();
    }
    return `${item.type || ""} ${item.size ?? ""}`.trim();
  };

  const fetchInventory = async (search = "") => {
    try {
      const query = search.trim()
        ? `?search=${encodeURIComponent(search)}`
        : "";

      const inventoryRes = await fetch(`/api/inventory${query}`);
      const inventoryData = await inventoryRes.json();

      if (!inventoryData.success || !Array.isArray(inventoryData.items)) {
        setRows([]);
        return;
      }

      const inventoryItems = inventoryData.items;

      const ratesRes = await fetch("/api/ratelist");
      const ratesData = await ratesRes.json();
      const savedRates: Record<string, any> = {};

      if (ratesData.success && Array.isArray(ratesData.items)) {
        ratesData.items.forEach((item: any) => {
          const key = `${item.name.toLowerCase()}|${item.size ?? ""}|${
            item.guage ?? ""
          }`;
          savedRates[key] = {
            rate: item.rate ?? "",
            ratePerUnit: item.ratePerUnit ?? "",
          };
        });
      }

      const mergedRows = inventoryItems.map((item: any) => {
        const key = `${item.name.toLowerCase()}|${item.size ?? ""}|${
          item.guage ?? ""
        }`;
        return {
          _id: item._id,
          name: item.name ?? "N/A",
          type: item.type ?? "",
          pipeType: item.pipeType ?? "",
          size: item.size ?? "",
          guage: item.guage ?? "",
          gote: item.gote ?? "",
          color: item.color ?? "",
          weight: item.weight ?? 0,
          quantity: item.quantity ?? 1,

          // only show values from ratelist (start empty unless saved)
          rate: savedRates[key]?.rate ?? "",
          ratePerUnit: savedRates[key]?.ratePerUnit ?? "",

          // inventory base values (for validation)
          pricePerKg: item.pricePerKg ?? 0,
          pricePerUnit: item.pricePerUnit ?? 0,

          errorRate: "",
          errorUnit: "",
        };
      });
      setRows(mergedRows);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setRows([]);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchInventory("");
      return;
    }

    const handler = setTimeout(() => {
      fetchInventory(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const saveRows = async () => {
    // prevent save if there are errors
    const hasErrors = rows.some((row) => row.errorRate || row.errorUnit);
    if (hasErrors) {
      alert("⚠️ Please fix errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/ratelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Rate list saved successfully ✅");
        fetchInventory();
      } else {
        alert("Failed to save ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving ❌");
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = Math.ceil(rows.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  const hasErrors = rows.some((row) => row.errorRate || row.errorUnit);

  return (
    <div className="h-full flex flex-col items-center gap-[50px] px-[75px] py-[35px]">
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Rate List</h1>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items..."
          className="px-3 py-2 rounded bg-gray-900 text-white outline-none border border-gray-600 focus:border-green-500 transition w-[250px]"
        />
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-white border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-800 text-center text-sm">
              <th className="border border-gray-600 p-3">S.no</th>
              <th className="border border-gray-600 p-3">Item Name</th>
              <th className="border border-gray-600 p-3">Guage</th>
              <th className="border border-gray-600 p-3">Gote</th>
              <th className="border border-gray-600 p-3">Weight per Unit</th>
              <th className="border border-gray-600 p-3">Rate Per Kg</th>
              <th className="border border-gray-600 p-3">Rate per Unit</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, index) => {
                const weightPerUnit =
                  row.quantity && row.quantity > 0 && row.weight
                    ? (row.weight / row.quantity).toFixed(2)
                    : "N/A";

                return (
                  <tr
                    key={row._id}
                    className="text-center text-sm hover:bg-gray-700"
                  >
                    <td className="border border-gray-700 p-2">
                      {startIndex + index + 1}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {getDisplayName(row)}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {row.guage ?? "N/A"}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {row.gote ?? "N/A"}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {weightPerUnit}
                    </td>

                    {/* Rate Per Kg */}
                    <td className="border border-gray-700 p-2">
                      <input
                        type="text"
                        value={row.rate ?? ""}
                        readOnly={!(row.weight && row.weight > 0)}
                        onChange={(e) => {
                          if (row.weight && row.weight > 0) {
                            const value = e.target.value;
                            const newRows = [...rows];
                            newRows[startIndex + index].rate = value;

                            // Validate
                            newRows[startIndex + index].errorRate = "";
                            if (value !== "") {
                              const numericRate = parseFloat(value);
                              if (
                                !isNaN(numericRate) &&
                                numericRate < (row.pricePerKg || 0)
                              ) {
                                newRows[
                                  startIndex + index
                                ].errorRate = `Must be ≥ ${row.pricePerKg}`;
                              } else if (
                                newRows[startIndex + index].quantity &&
                                newRows[startIndex + index].weight &&
                                !isNaN(numericRate)
                              ) {
                                const wpu =
                                  newRows[startIndex + index].weight! /
                                  newRows[startIndex + index].quantity!;
                                newRows[startIndex + index].ratePerUnit = (
                                  numericRate * wpu
                                ).toFixed(2);
                              }
                            }

                            setRows(newRows);
                          }
                        }}
                        className={`w-full px-2 py-1 rounded outline-none ${
                          row.errorRate ? "border border-red-500" : ""
                        } ${
                          row.weight && row.weight > 0
                            ? "bg-gray-900 text-white"
                            : "bg-gray-800 text-gray-400 cursor-not-allowed"
                        }`}
                      />
                      {row.errorRate && (
                        <div className="text-red-500 text-xs">
                          {row.errorRate}
                        </div>
                      )}
                    </td>

                    {/* Rate Per Unit */}
                    <td className="border border-gray-700 p-2">
                      <input
                        type="text"
                        value={row.ratePerUnit ?? ""}
                        readOnly={!!(row.weight && row.weight > 0)}
                        onChange={(e) => {
                          if (!row.weight || row.weight === 0) {
                            const value = e.target.value;
                            const newRows = [...rows];
                            newRows[startIndex + index].ratePerUnit = value;
                            newRows[startIndex + index].errorUnit = "";

                            // Validate
                            if (value !== "") {
                              const numericRate = parseFloat(value);
                              if (
                                !isNaN(numericRate) &&
                                numericRate < (row.pricePerUnit || 0)
                              ) {
                                newRows[
                                  startIndex + index
                                ].errorUnit = `Must be ≥ ${row.pricePerUnit}`;
                              }
                            }

                            setRows(newRows);
                          }
                        }}
                        className={`w-full px-2 py-1 rounded outline-none ${
                          row.errorUnit ? "border border-red-500" : ""
                        } ${
                          row.weight && row.weight > 0
                            ? "bg-gray-800 text-white"
                            : "bg-gray-900 text-white"
                        }`}
                      />
                      {row.errorUnit && (
                        <div className="text-red-500 text-xs">
                          {row.errorUnit}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 p-4">
                  No items available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center w-full max-w-[700px] mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end w-full max-w-[700px] mt-4">
        <button
          onClick={saveRows}
          disabled={isSaving || hasErrors}
          className={`px-4 py-2 rounded transition ${
            isSaving || hasErrors
              ? "bg-gray-500 cursor-not-allowed text-gray-200"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isSaving ? "Saving..." : hasErrors ? "Fix Errors First" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default Ratelist;
