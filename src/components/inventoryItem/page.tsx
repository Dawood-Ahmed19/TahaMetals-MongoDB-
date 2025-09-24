"use client";

import { inventoryGridCols } from "@/layoutConfig";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";

interface InventoryItemsProps {
  _id: string;
  name: string;
  type: string;
  color?: string | null;
  gote?: number | string | null;
  guage?: number | string | null;
  size?: number | string | null;
  weight?: number | null;
  quantity: number;
  pricePerKg?: number | string | null;
  unitPrice?: number | string | null;
  date: string;
  onDelete: (id: string) => void;
}

export default function InventoryItem({
  _id,
  name,
  type,
  color,
  gote,
  guage,
  size,
  weight,
  quantity,
  pricePerKg,
  unitPrice,
  date,
  onDelete,
}: InventoryItemsProps) {
  const router = useRouter();

  const handleEditItem = () => {
    router.push(`/Inventory/edit/${_id}`);
  };

  // ✅ Universal formatter for missing/invalid values
  const renderValue = (value: any, suffix?: string) => {
    if (
      value === "N/A" ||
      value === "" ||
      value === null ||
      value === undefined ||
      value === 0 ||
      value === "0" ||
      Number.isNaN(value)
    ) {
      return <span className="text-gray-600 font-semibold">N/A</span>;
    }
    return suffix ? `${value} ${suffix}` : value;
  };

  // Special handling for "band" in hardware
  const isBand =
    type?.toLowerCase() === "hardware" && name?.toLowerCase() === "band";

  return (
    <div
      className={`${inventoryGridCols} px-[120px] py-[20px] border-b border-gray-800 text-xs items-center
  ${quantity === 0 ? "bg-gray-700 text-gray-400" : "bg-fieldBg text-white"}`}
    >
      <p>{renderValue(name)}</p>
      <p>{renderValue(type)}</p>
      <p>{renderValue(color)}</p>
      <p>{renderValue(guage)}</p>
      <p>{renderValue(gote)}</p>
      <p>{renderValue(size)}</p>

      <p>
        {isBand
          ? renderValue("N/A")
          : renderValue(weight ? Number(weight).toFixed(2) : "N/A", "KG")}
      </p>

      <p>
        {quantity === 0 ? (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        ) : (
          renderValue(quantity)
        )}
      </p>

      <p>{isBand ? renderValue("N/A") : renderValue(pricePerKg, "PKR")}</p>
      <p>{renderValue(unitPrice, "PKR")}</p>

      <div className="flex gap-2">
        <button
          onClick={handleEditItem}
          disabled={quantity === 0}
          className={`hover:cursor-pointer ${
            quantity === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(_id)}
          className="hover:cursor-pointer"
          disabled={quantity === 0}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      <p>{renderValue(new Date(date).toLocaleDateString())}</p>
    </div>
  );
}
