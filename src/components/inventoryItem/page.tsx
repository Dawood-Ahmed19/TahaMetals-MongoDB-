"use client";

import { inventoryGridCols } from "@/layoutConfig";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";

interface InventoryItemsProps {
  _id: string;
  name: string;
  type: string;
  gote: number | string;
  guage: number | string;
  size: number | string;
  weight?: number;
  quantity: number;
  pricePerKg?: number | string;
  unitPrice: number | string;
  date: string;
  onDelete: (id: string) => void;
}

export default function InventoryItem({
  _id,
  name,
  type,
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
  const isBand =
    type.toLowerCase() === "hardware" && name.toLowerCase() === "band";

  const handleEditItem = () => {
    router.push(`/Inventory/edit/${_id}`);
  };

  // 🎯 Helper: red if "N/A"
  const renderValue = (value: any) => {
    if (value === "N/A") {
      return <span className="text-red-500 font-semibold">{value}</span>;
    }
    return value;
  };

  return (
    <div
      className={`${inventoryGridCols} px-[120px] py-[20px] border-b border-gray-800 text-xs items-center
  ${quantity === 0 ? "bg-gray-700 text-gray-400" : "bg-fieldBg text-white"}`}
    >
      <p>{name}</p>
      <p>{type}</p>
      <p>{renderValue(guage || "N/A")}</p>
      <p>{renderValue(gote || "N/A")}</p>
      <p>{size}</p>

      {/* ✅ Weight */}
      <p>
        {isBand
          ? renderValue("N/A")
          : weight !== undefined
          ? Number(weight).toFixed(2)
          : renderValue("N/A")}
      </p>

      {/* ✅ Quantity */}
      <p>
        {quantity === 0 ? (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        ) : (
          quantity
        )}
      </p>

      {/* ✅ Price Per Kg */}
      <p>{isBand ? renderValue("N/A") : `${pricePerKg ?? 0} PKR`}</p>

      {/* ✅ Price Per Unit */}
      <p>{unitPrice} PKR</p>

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

      <p>{new Date(date).toLocaleDateString()}</p>
    </div>
  );
}
