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
  height?: number | null;
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
  height,
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

  const renderValue = (
    value: any,
    suffix?: string,
    isOptional: boolean = false
  ) => {
    const isNA =
      isOptional &&
      (value === "N/A" ||
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && value === 0) ||
        (typeof value === "string" && value.trim() === "0"));

    if (isNA) {
      return (
        <span className="text-gray-600 font-semibold !important">N/A</span>
      );
    }

    if (
      typeof value === "string" &&
      !isNaN(Number(value)) &&
      value.trim() !== ""
    ) {
      const numValue = Number(value);
      const formattedValue = Number.isInteger(numValue)
        ? numValue
        : numValue.toFixed(2);
      return suffix ? `${formattedValue} ${suffix}` : formattedValue;
    }

    return value;
  };

  const isBand =
    type?.toLowerCase() === "hardware" && name?.toLowerCase() === "band";

  return (
    <div
      className={`${inventoryGridCols} 
      px-[30px] xl-only:px-[80px] py-[20px] border-b border-gray-800 
      text-xs items-center
      ${quantity === 0 ? "bg-gray-700 text-gray-400" : "bg-fieldBg text-white"}
      xl-only:px-[50px] xl-only:py-[15px] xl-only:text-[14px]`}
    >
      <p>{renderValue(name, undefined, false)}</p>
      <p>{renderValue(type, undefined, false)}</p>
      <p>{renderValue(color, undefined, true)}</p>
      <p>{renderValue(guage, undefined, true)}</p>
      <p>{renderValue(gote, undefined, true)}</p>
      <p>{renderValue(size, undefined, true)}</p>
      <p>{renderValue(height, undefined, true)}</p>
      <p>
        {isBand
          ? renderValue("N/A", "KG", true)
          : renderValue(weight !== undefined ? weight : "N/A", "KG", true)}
      </p>
      <p>
        {quantity === 0 ? (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        ) : (
          renderValue(quantity)
        )}
      </p>
      <p>
        {isBand
          ? renderValue("N/A", "PKR", true)
          : renderValue(pricePerKg, "PKR", true)}
      </p>
      <p>{renderValue(unitPrice, "PKR", true)}</p>
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
