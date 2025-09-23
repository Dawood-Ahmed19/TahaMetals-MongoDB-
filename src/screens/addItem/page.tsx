"use Client";

import ItemCard from "@/components/itemCard/page";

const AddItem = () => {
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
        <h1 className="text-xl font-bold text-white">Add Item to Inventory</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      <ItemCard />
    </div>
  );
};

export default AddItem;
