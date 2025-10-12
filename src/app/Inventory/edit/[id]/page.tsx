"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditItemPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/items/${id}`);
        const data = await res.json();
        if (data.success) setItem(data.item);
      } catch (e) {
        console.error("Failed to fetch item:", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updatedItem = {
      type: form.get("type"),
      name: form.get("name"),
      color: form.get("color"),
      gote: form.get("gote"),
      guage: form.get("guage"),
      size: form.get("size"),
      quantity: Number(form.get("quantity")),
      weight: Number(form.get("weight")),
      pricePerKg: Number(form.get("pricePerKg")),
      pricePerUnit: Number(form.get("pricePerUnit")),
    };

    try {
      setSaving(true);
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });

      const result = await res.json();
      if (result.success) router.push("/Inventory");
      else console.error("Update failed:", result.error);
    } catch (e) {
      console.error("Update error:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading item…
      </div>
    );

  if (!item)
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        Item not found.
      </div>
    );

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayNumber = (val: any) => {
    const num = Number(val);
    if (isNaN(num)) return "";
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  const handleDecimalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      if (decPart.length > 2) {
        e.target.value = `${intPart}.${decPart.slice(0, 2)}`;
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col items-center 
      gap-[50px] px-[75px] py-[35px] 
      2xl:px-[75px] 2xl:py-[35px] 
      xl:px-[40px] xl:py-[25px] xl:gap-[35px]"
    >
      <span className="flex justify-between w-full">
        <h1 className="text-xl font-bold text-white">Your Inventory</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </span>

      <div className="flex justify-center items-start py-10 px-4">
        <div
          className="w-full max-w-4xl rounded-xl shadow-md p-10"
          style={{ backgroundColor: "var(--color-cardBg)" }}
        >
          <h1 className="text-2xl font-bold mb-8 text-center text-white">
            Edit Item
          </h1>

          <form
            onSubmit={handleUpdate}
            className="grid grid-cols-2 gap-6 text-white"
          >
            {/* Item Type */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Item Type</label>
              <select
                name="type"
                defaultValue={item.type}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              >
                <option value="Hardware">Hardware</option>
                <option value="Pipe">Pipe</option>
                <option value="Pillars">Pillars</option>
              </select>
            </div>

            {/* Item Name */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Item Name</label>
              <input
                type="text"
                name="name"
                defaultValue={item.name}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Size */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Size</label>
              <input
                type="text"
                name="size"
                defaultValue={item.size}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Gauge */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Gauge</label>
              <input
                type="text"
                name="guage"
                defaultValue={item.guage}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Gote */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Gote</label>
              <input
                type="text"
                name="gote"
                defaultValue={item.gote}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Color */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Color</label>
              <input
                type="text"
                name="color"
                defaultValue={item.color || ""}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Quantity */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Quantity</label>
              <input
                type="number"
                name="quantity"
                defaultValue={item.quantity}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Weight */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Weight (KG)</label>
              <input
                type="number"
                step="0.01"
                name="weight"
                defaultValue={displayNumber(item.weight)}
                onInput={handleDecimalInput}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Price per KG */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Price per KG</label>
              <input
                type="number"
                step="0.01"
                name="pricePerKg"
                defaultValue={displayNumber(item.pricePerKg)}
                onInput={handleDecimalInput}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Price per Unit */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Price per Unit</label>
              <input
                type="number"
                step="0.01"
                name="pricePerUnit"
                defaultValue={displayNumber(item.pricePerUnit)}
                onInput={handleDecimalInput}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-fieldBg)",
                  borderColor: "transparent",
                  color: "white",
                }}
              />
            </div>

            {/* Save Button */}
            <div className="col-span-2 mt-6 flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="font-semibold px-6 py-2 rounded-lg transition-all ease-in-out"
                style={{
                  backgroundColor: saving
                    ? "var(--color-IconBg)"
                    : "var(--color-iconColor)",
                  color: "white",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
