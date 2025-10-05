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
  amount: number;
}

export default function InventoryCard() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchItem, setSearchitem] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const query = new URLSearchParams();
        if (filterType !== "All") query.append("type", filterType);
        if (searchItem.trim()) query.append("search", searchItem.trim());

        const res = await fetch(`/api/items?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch items");

        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };

    fetchItems();
  }, [filterType, searchItem]);

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
    <div
      className="max-w-[1530px] w-full bg-cardBg max-h-[750px] rounded-lg 
      py-[80px] px-[80px] flex flex-col gap-5
      2xl:px-[80px] 2xl:py-[80px]
      xl-only:px-[50px] xl-only:py-[50px]"
    >
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
        <label className="text-white text-sm xl-only:text-xs">
          Filter by Type:
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-fieldBg text-white p-2 rounded text-sm xl-only:text-xs"
        >
          <option value="All">All</option>
          <option value="Hardware">Hardware</option>
          <option value="Pipe">Pipe</option>
          <option value="Pillars">Pillars</option>
        </select>
      </span>
      <span
        className={`${inventoryGridCols} px-[30px] xl-only:px-[80px] py-[20px] bg-fieldBg border-b rounded-t-sm border-gray-600 
          text-white text-xs xl-only:text-[14px]`}
      >
        <p>Item name</p>
        <p>Item type</p>
        <p>Size</p>
        <p>Color</p>
        <p>Gauge</p>
        <p>Gote</p>
        <p>Height (FT)</p>
        <p>Weight (KG)</p>
        <p>Quantity Available</p>
        <p>Price Per KG</p>
        <p>Price Per Unit</p>
        <p>Amount</p>
        <p>Actions</p>
        <p>Date</p>
      </span>

      <span className="max-h-[800px] overflow-y-auto">
        {/* Header row */}

        {/* Data rows */}
        {items.map((item) => {
          const pricePerKg = item.pricePerKg ?? "N/A";
          const unitPrice = item.pricePerUnit ?? "N/A";

          const colorValue =
            item.color && item.color.trim() !== "" ? item.color : "N/A";
          const formattedWeight = item.weight
            ? Number.isInteger(item.weight)
              ? item.weight
              : Number(item.weight.toFixed(2))
            : undefined;

          return (
            <InventoryItem
              key={item._id}
              {...item}
              color={colorValue}
              pricePerKg={pricePerKg}
              unitPrice={unitPrice}
              weight={formattedWeight}
              onDelete={handleDelete}
            />
          );
        })}
      </span>
    </div>
  );
}
