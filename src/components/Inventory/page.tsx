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
  const [searchItem, setSearchItem] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [guageFilter, setGuageFilter] = useState("All");
  const [allSizes, setAllSizes] = useState<string[]>(["All"]);
  const [allGuages, setAllGuages] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();

      if (searchItem.trim()) query.append("search", searchItem.trim());
      if (typeFilter !== "All") query.append("type", typeFilter);
      if (sizeFilter !== "All") query.append("size", sizeFilter);
      if (guageFilter !== "All") query.append("guage", guageFilter);

      const res = await fetch(`/api/items?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch items");

      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch("/api/items/filters");
      if (!res.ok) throw new Error("Failed to fetch filters");
      const data = await res.json();

      if (data.success) {
        setAllSizes(data.sizes || ["All"]);
        setAllGuages(data.guages || ["All"]);
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchItems();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [searchItem, typeFilter, sizeFilter, guageFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data?.success) {
        fetchItems();
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
      {/* Search Field */}
      <div>
        <FormField
          label="Search your Item"
          value={searchItem}
          onChange={(value: string) => setSearchItem(value)}
          placeholder="Type here"
          fontSize="14px"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Type Filter */}
        <div>
          <label className="mr-2 text-white text-sm">Filter by Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
          >
            <option value="All">All</option>
            <option value="Hardware">Hardware</option>
            <option value="Pipe">Pipe</option>
            <option value="Pillars">Pillars</option>
          </select>
        </div>

        {/* Size Filter */}
        <div>
          <label className="mr-2 text-white text-sm">Filter by Size:</label>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
          >
            {allSizes.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All" : s}
              </option>
            ))}
          </select>
        </div>

        {/* Gauge Filter */}
        <div>
          <label className="mr-2 text-white text-sm">Filter by Gauge:</label>
          <select
            value={guageFilter}
            onChange={(e) => setGuageFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm"
          >
            {allGuages.map((g) => (
              <option key={g} value={g}>
                {g === "All" ? "All" : g}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSearchItem("");
            setTypeFilter("All");
            setSizeFilter("All");
            setGuageFilter("All");
          }}
          className="bg-BgColor hover:bg-IconBg text-white px-3 py-1 rounded text-sm"
        >
          Reset Filters
        </button>
      </div>

      {/* Table header */}
      <div
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
      </div>

      {/* Table Body */}
      <div className="max-h-[800px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading items…</p>
        ) : items.length > 0 ? (
          items.map((item) => {
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
          })
        ) : (
          <p className="text-center text-gray-400 py-8">
            No items match current filters.
          </p>
        )}
      </div>
    </div>
  );
}
