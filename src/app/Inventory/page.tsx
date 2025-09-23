"use client";

import InventoryCard from "@/components/Inventory/page";

export default function Inventory() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="px-[75px] py-[35px] h-full flex flex-col items-center gap-[50px]">
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Your Inventory</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      <InventoryCard />
    </div>
  );
}
