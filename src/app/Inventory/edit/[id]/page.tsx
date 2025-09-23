"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditItemPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/items/${id}`);
        const result = await res.json();

        if (result.success) {
          setItem(result.item);
        } else {
          console.error("Item not found:", result.error);
        }
      } catch (err) {
        console.error("Failed to fetch item:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchItem();
  }, [id]);

  const handleUpdate = async (updatedData: any) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await res.json();

      if (result.success) {
        setItem(result.item);
        router.push("/inventory");
      } else {
        console.error("Update failed:", result.error);
      }
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  if (loading) return <p className="text-white">Loading...</p>;
  if (!item) return <p className="text-red-400">Item not found</p>;

  return (
    <div className="px-[50px] py-[30px] text-white">
      <h1 className="text-xl font-bold mb-4">Edit Item</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleUpdate({
            name: formData.get("name"),
            quantity: Number(formData.get("quantity")),
            weight: Number(formData.get("weight")),
          });
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          name="name"
          defaultValue={item.name}
          className="bg-gray-700 text-white px-3 py-2 rounded"
        />
        <input
          type="number"
          name="quantity"
          defaultValue={item.quantity}
          className="bg-gray-700 text-white px-3 py-2 rounded"
        />
        <input
          type="number"
          name="weight"
          defaultValue={item.weight}
          className="bg-gray-700 text-white px-3 py-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
