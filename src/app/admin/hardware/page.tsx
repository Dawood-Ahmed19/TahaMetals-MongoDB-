"use client";
import { useState, useEffect } from "react";

export default function HardwareAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    hasPipeTypes: "yes",
    hasColors: "no",
    roundSizes: "",
    squareSizes: "",
    generalSizes: "",
    colors: "",
    pipeTypes: "",
    priceType: "unit",
  });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/hardware-items");
        const data = await res.json();
        if (data.success) setItems(data.items);
      } catch (err) {
        console.error("Error loading hardware items:", err);
      }
    };
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hardware item?")) return;

    try {
      const res = await fetch(`/api/hardware-items?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("Item deleted 🗑️");
        const updated = await fetch("/api/hardware-items").then((r) =>
          r.json()
        );
        setItems(updated.items);
      } else {
        alert("⚠️ " + data.message);
      }
    } catch (err: any) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      name: form.name.trim(),
      hasPipeTypes: form.hasPipeTypes === "yes",
      hasColors: form.hasColors === "yes",
      sizes:
        form.hasPipeTypes === "yes"
          ? {
              Round: form.roundSizes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              Square: form.squareSizes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : form.hasPipeTypes === "no"
          ? {
              general: form.generalSizes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : { general: [] },
      colors:
        form.hasColors === "yes"
          ? form.colors
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : [],
      pipeTypes:
        form.hasPipeTypes === "yes"
          ? form.pipeTypes
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
      priceType: form.priceType,
    };

    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch("/api/hardware-items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { _id: editingId, ...payload } : payload
        ),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      alert(editingId ? "Item updated ✅" : "Item added ✅");

      const updated = await fetch("/api/hardware-items").then((r) => r.json());
      setItems(updated.items);

      setForm({
        name: "",
        hasPipeTypes: "yes",
        hasColors: "no",
        roundSizes: "",
        squareSizes: "",
        generalSizes: "",
        colors: "",
        pipeTypes: "",
        priceType: "unit",
      });
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      alert("⚠️ " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      hasPipeTypes: item.hasPipeTypes ? "yes" : "no",
      hasColors: item.hasColors ? "yes" : "no",
      roundSizes: item.sizes?.Round?.join(", ") || "",
      squareSizes: item.sizes?.Square?.join(", ") || "",
      generalSizes: item.sizes?.general?.join(", ") || "",
      colors: item.colors?.join(", ") || "",
      pipeTypes: item.pipeTypes?.join(", ") || "",
      priceType: item.priceType || "unit",
    });
  };

  return (
    <main className="bg-[var(--color-BgColor)] text-white min-h-screen flex flex-col items-center justify-center px-6 font-[var(--font-poppins)]">
      <h1 className="text-xl font-semibold text-white mb-6">Admin Panel</h1>

      <div className="w-full max-w-3xl">
        {/* FORM CARD */}
        <section className="bg-[var(--color-cardBg)] rounded-xl p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <input
                className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)]"
                placeholder="Name (e.g. Plate)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              {/* Price Type */}
              <select
                className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)]"
                value={form.priceType}
                onChange={(e) =>
                  setForm({ ...form, priceType: e.target.value })
                }
              >
                <option value="unit">Price Per Unit</option>
                <option value="weight">Price Per Kg</option>
              </select>

              {/* Toggle - has pipe types */}
              <select
                className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                value={form.hasPipeTypes}
                onChange={(e) =>
                  setForm({ ...form, hasPipeTypes: e.target.value })
                }
              >
                <option value="yes">Has Pipe Types (Round/Square)</option>
                <option value="no">Simple Hardware (General Sizes)</option>
                <option value="none">No Size Category</option>
              </select>

              {form.hasPipeTypes === "yes" ? (
                <>
                  {/* Round Sizes */}
                  <input
                    className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                    placeholder='Round Sizes (comma separated, e.g. 2" x 4")'
                    value={form.roundSizes}
                    onChange={(e) =>
                      setForm({ ...form, roundSizes: e.target.value })
                    }
                  />
                  {/* Square Sizes */}
                  <input
                    className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                    placeholder='Square Sizes (comma separated, e.g. 1/2" x 2" x 1")'
                    value={form.squareSizes}
                    onChange={(e) =>
                      setForm({ ...form, squareSizes: e.target.value })
                    }
                  />
                  {/* Pipe Types */}
                  <input
                    className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                    placeholder="Pipe types (Round, Square)"
                    value={form.pipeTypes}
                    onChange={(e) =>
                      setForm({ ...form, pipeTypes: e.target.value })
                    }
                  />
                </>
              ) : (
                <input
                  className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                  placeholder="General Sizes (e.g. Small, Medium)"
                  value={form.generalSizes}
                  onChange={(e) =>
                    setForm({ ...form, generalSizes: e.target.value })
                  }
                />
              )}

              {/* Toggle - has color options */}
              <select
                className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                value={form.hasColors}
                onChange={(e) =>
                  setForm({ ...form, hasColors: e.target.value })
                }
              >
                <option value="no">No Color Options</option>
                <option value="yes">Has Color Options</option>
              </select>

              {form.hasColors === "yes" && (
                <input
                  className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                  placeholder="Colors (e.g. Silver, Golden, Black)"
                  value={form.colors}
                  onChange={(e) => setForm({ ...form, colors: e.target.value })}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded-md font-semibold transition ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-[var(--color-iconColor)] hover:bg-blue-500"
              }`}
            >
              {isLoading
                ? "Saving..."
                : editingId
                ? "Update Hardware Item"
                : "Add Hardware Item"}
            </button>
          </form>
        </section>

        {/* EXISTING ITEMS */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Existing Items</h2>

          {items.length === 0 ? (
            <p className="text-gray-400 text-sm bg-[var(--color-cardBg)] rounded-xl p-4">
              No hardware items added yet.
            </p>
          ) : (
            <PaginatedItems
              items={items}
              perPage={2}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
    </main>
  );
}

/* Pagination & item list component */
function PaginatedItems({
  items,
  perPage = 2,
  onEdit,
  onDelete,
}: {
  items: any[];
  perPage?: number;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / perPage);
  const startIndex = (page - 1) * perPage;
  const visibleItems = items.slice(startIndex, startIndex + perPage);

  return (
    <div className="bg-[var(--color-cardBg)] rounded-xl p-4">
      <div className="space-y-2">
        {visibleItems.map((it) => (
          <div
            key={it._id}
            className="flex justify-between items-start bg-[var(--color-fieldBg)] px-3 py-2 rounded border border-[var(--color-IconBg)]"
          >
            <div>
              <p className="font-semibold text-white">{it.name}</p>
              <p className="text-xs text-gray-400">
                {it.priceType === "unit" ? "Per Unit" : "Per Kg"}{" "}
                {it.hasPipeTypes ? (
                  <>
                    | Round:{" "}
                    {it.sizes?.Round?.length
                      ? it.sizes.Round.join(", ")
                      : "– No Round Sizes –"}
                    | Square:{" "}
                    {it.sizes?.Square?.length
                      ? it.sizes.Square.join(", ")
                      : "– No Square Sizes –"}
                  </>
                ) : (
                  <>
                    | Sizes:{" "}
                    {it.sizes?.general?.length
                      ? it.sizes.general.join(", ")
                      : "– No Sizes –"}
                  </>
                )}
              </p>
              {it.hasColors && it.colors?.length > 0 && (
                <p className="text-xs text-gray-400">
                  Colors: {it.colors.join(", ")}
                </p>
              )}
            </div>

            {/* Right‑side actions */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[var(--color-iconColor)] text-xs">
                {new Date(it.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(it)}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(it._id)}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination bar (unchanged) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${
              page === 1
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-[var(--color-iconColor)] hover:bg-blue-500 text-white"
            }`}
          >
            ←
          </button>

          <span className="text-sm text-gray-300">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-[var(--color-iconColor)] hover:bg-blue-500 text-white"
            }`}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
