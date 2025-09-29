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
}

const Ratelist = () => {
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  // Helper: generate frontend display name
  const getDisplayName = (item: ItemRow) => {
    if (!item) return "";
    let displayItem = item.name ?? "";

    if (item.type?.toLowerCase() === "hardware") {
      displayItem += item.size ? ` ${item.size}` : "";
      if (
        item.gote &&
        item.gote.toString().trim() !== "" &&
        item.gote.toString().toLowerCase() !== "without gote"
      ) {
        displayItem += ` - G ${item.gote}`;
      }
    } else if (item.type?.toLowerCase().includes("pillar")) {
      displayItem =
        item.pipeType?.toLowerCase() === "fancy"
          ? "Pillar Fancy"
          : `Pillar${item.size ? " " + item.size : ""}${
              item.gote &&
              item.gote.toString().trim() !== "" &&
              item.gote.toString().toLowerCase() !== "without gote"
                ? ` - G ${item.gote}`
                : ""
            }`;
    } else {
      displayItem = item.size
        ? `${item.type} ${item.size}`
        : item.type ?? item.name;
      if (
        item.gote &&
        item.gote.toString().trim() !== "" &&
        item.gote.toString().toLowerCase() !== "without gote"
      ) {
        displayItem += ` - G ${item.gote}`;
      }
    }

    return displayItem;
  };

  const fetchInventory = async (search = "") => {
    try {
      // ✅ pass search to backend
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

      // ✅ fetch saved rates for matching items
      const ratesRes = await fetch("/api/ratelist");
      const ratesData = await ratesRes.json();
      const savedRates: Record<string, any> = {};
      if (ratesData.success && Array.isArray(ratesData.items)) {
        ratesData.items.forEach((item: any) => {
          savedRates[item._id] = {
            rate: item.rate ?? "",
            ratePerUnit: item.ratePerUnit ?? "",
          };
        });
      }

      // ✅ merge inventory + saved rates
      const mergedRows = inventoryItems.map((item: any) => ({
        _id: item._id,
        name: item.name ?? "N/A",
        type: item.type ?? "",
        pipeType: item.pipeType ?? "",
        size: item.size ?? "",
        guage: item.guage ?? "N/A",
        gote: item.gote ?? "N/A",
        weight: item.weight ?? 0,
        quantity: item.quantity ?? 1,
        rate: savedRates[item._id]?.rate ?? "",
        ratePerUnit: savedRates[item._id]?.ratePerUnit ?? "",
      }));

      const finalRows =
        search.trim() === ""
          ? mergedRows
          : mergedRows.filter((row) =>
              getDisplayName(row).toLowerCase().includes(search.toLowerCase())
            );

      setRows(finalRows);

      setRows(finalRows);
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

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRateChange = (index: number, value: string) => {
    const newRows = [...rows];
    newRows[index].rate = value;

    const weightPerUnit =
      newRows[index].weight &&
      newRows[index].quantity &&
      newRows[index].quantity > 0
        ? newRows[index].weight / newRows[index].quantity
        : null;

    if (weightPerUnit && value) {
      const numericRate = parseFloat(value);
      if (!isNaN(numericRate)) {
        newRows[index].ratePerUnit = (numericRate * weightPerUnit).toFixed(2);
      } else {
        newRows[index].ratePerUnit = "";
      }
    } else {
      newRows[index].ratePerUnit = "";
    }

    setRows(newRows);
  };

  const saveRows = async () => {
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
      } else {
        alert("Failed to save rate list ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving rate list ❌");
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = Math.ceil(rows.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="h-full flex flex-col items-center gap-[50px] px-[75px] py-[35px] 2xl:px-[75px] 2xl:py-[35px] xl-only:px-[40px] xl-only:py-[25px] xl-only:gap-[35px]">
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

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-white border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-800 text-center text-sm">
              <th className="border border-gray-600 p-3">S.no</th>
              <th className="border border-gray-600 p-3">Item Name</th>
              <th className="border border-gray-600 p-3">Guage</th>
              <th className="border border-gray-600 p-3">Gote</th>
              <th className="border border-gray-600 p-3">Weight per Unit</th>
              <th className="border border-gray-600 p-3">Rate Per kg</th>
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
                    <td className="border border-gray-700 p-2">
                      <input
                        type="text"
                        value={row.rate}
                        onChange={(e) =>
                          handleRateChange(startIndex + index, e.target.value)
                        }
                        className="w-full bg-gray-900 text-white px-2 py-1 rounded outline-none"
                      />
                    </td>
                    <td className="border border-gray-700 p-2">
                      <input
                        type="text"
                        value={row.ratePerUnit ?? ""}
                        readOnly={row.weight && row.weight > 0}
                        onChange={(e) => {
                          if (!row.weight || row.weight === 0) {
                            const newRows = [...rows];
                            newRows[startIndex + index].ratePerUnit =
                              e.target.value;
                            setRows(newRows);
                          }
                        }}
                        className={`w-full px-2 py-1 rounded outline-none ${
                          row.weight && row.weight > 0
                            ? "bg-gray-800 text-white"
                            : "bg-gray-900 text-white"
                        }`}
                      />
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
          disabled={isSaving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default Ratelist;
