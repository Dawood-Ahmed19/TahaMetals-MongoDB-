"use client";

import { useEffect, useState } from "react";
import FormField from "../FormField/page";
import { inventoryGridCols } from "@/layoutConfig";
import InventoryItem from "../inventoryItem/page";

export interface Item {
  _id: string;
  name: string;
  type: string;
  color?: string;
  gote: number | string;
  guage: number | string;
  size: number | string;
  weight?: number;
  quantity: number;
  pricePerKg?: number;
  pricePerUnit?: number;
  date: string;
}

export default function InventoryCard() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchItem, setSearchitem] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  const filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchItem.toLowerCase()) &&
      (filterType === "All" ||
        item.type.toLowerCase() === filterType.toLowerCase())
  );

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/items");
        if (!res.ok) throw new Error("Failed to fetch items");

        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };

    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data?.success) {
        setItems((prev) => prev.filter((item) => item._id !== id));
      } else {
        alert("❌ Failed to delete: " + (data?.error || res.statusText));
      }
    } catch (err) {
      console.error("Error deleting item", err);
    }
  };

  return (
    <div className="max-w-[1530px] w-full bg-cardBg h-full rounded-lg py-[80px] px-[80px] flex flex-col gap-5">
      <span>
        <FormField
          label="Search your Item"
          value={searchItem}
          onChange={(value: string) => setSearchitem(value)}
          placeholder="Type here"
          fontSize="14px"
        />
      </span>

      <span className="flex items-center gap-4 mb-4">
        <label className="text-white text-sm">Filter by Type:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-fieldBg text-white p-2 rounded"
        >
          <option value="All">All</option>
          <option value="Hardware">Hardware</option>
          <option value="Pipe">Pipe</option>
          <option value="Pillars">Pillars</option>
        </select>
      </span>

      <span className="max-h-[400px] overflow-y-auto">
        <span
          className={`${inventoryGridCols} px-[120px] py-[20px] bg-fieldBg border-b rounded-t-sm border-gray-600 text-white text-xs`}
        >
          <p>Item name</p>
          <p>Item type</p>
          <p>Color</p>
          <p>Gauge</p>
          <p>Gote</p>
          <p>Size</p>
          <p>Weight (KG)</p>
          <p>Quantity Available</p>
          <p>Price Per KG</p>
          <p>Price Per Unit</p>
          <p>Actions</p>
          <p>Date</p>
        </span>

        {filteredItems.map((item) => {
          let pricePerKg: string | number | undefined;
          let unitPrice: string | number | undefined;

          if (
            item.type?.toLowerCase() === "hardware" &&
            (item.name?.toLowerCase() === "band" ||
              item.name?.toLowerCase() === "cutt ball" ||
              item.name?.toLowerCase() === "draz")
          ) {
            pricePerKg = "N/A";
            unitPrice = item.pricePerUnit ?? "N/A";
          } else {
            pricePerKg = item.pricePerKg ?? "N/A";
            unitPrice =
              item.quantity > 0 && item.pricePerKg
                ? (
                    ((item.weight ?? 0) / item.quantity) *
                    (item.pricePerKg ?? 0)
                  ).toFixed(2)
                : "N/A";
          }

          const colorValue =
            item.color && item.color.trim() !== "" ? item.color : "N/A";

          return (
            <InventoryItem
              key={item._id}
              {...item}
              color={colorValue}
              pricePerKg={pricePerKg}
              unitPrice={unitPrice}
              weight={item.weight}
              onDelete={handleDelete}
            />
          );
        })}
      </span>
    </div>
  );
}
