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
  size: number;
  weight: number;
  quantity: number;
  price: number;
  unitPrice: number;
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
  price,
  unitPrice,
  date,
  onDelete,
}: InventoryItemsProps) {
  const router = useRouter();

  const handleEditItem = () => {
    router.push(`/Inventory/edit/${_id}`);
  };

  return (
    <div
      className={`${inventoryGridCols} px-[120px] py-[20px] border-b border-gray-800 text-xs items-center
  ${quantity === 0 ? "bg-gray-700 text-gray-400" : "bg-fieldBg text-white"}`}
    >
      <p>{name}</p>
      <p>{type}</p>
      <p>{guage}</p>
      <p>{gote}</p>
      <p>{size}</p>
      <p>{Number(weight).toFixed(2)}</p>
      <p>
        {quantity === 0 ? (
          <span className="text-red-500 font-semibold">Out of Stock</span>
        ) : (
          quantity
        )}
      </p>
      <p>{price} PKR</p>
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
          onClick={() => {
            console.log("Delete clicked:", _id);
            onDelete(_id);
          }}
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
