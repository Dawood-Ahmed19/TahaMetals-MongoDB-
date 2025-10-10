"use client";
import { useState, useEffect } from "react";

export default function HardwareAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // ─── Load existing hardware items ───────────────────────────────
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

  // ─── Handle submit ───────────────────────────────────────────────
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

    try {
      const res = await fetch("/api/hardware-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        alert("Hardware item added");
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
        const updated = await fetch("/api/hardware-items").then((r) =>
          r.json()
        );
        setItems(updated.items);
      } else {
        alert("Failed to add item ❌");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Could not add hardware item.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────
  return (
    <main className="bg-[var(--color-BgColor)] text-white min-h-screen flex flex-col items-center justify-center px-6 font-[var(--font-poppins)]">
      <h1 className="text-xl font-semibold text-white mb-6">Admin Panel</h1>

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
                <option value="yes">Has Pipe Types (Round / Square)</option>
                <option value="no">Simple Hardware (General Sizes)</option>
                <option value="none">No Size Category</option>{" "}
              </select>

              {form.hasPipeTypes === "yes" ? (
                <>
                  {/* Round Sizes */}
                  <input
                    className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                    placeholder='Round Sizes (comma separated, e.g. 2" x 4", 3" x 5")'
                    value={form.roundSizes}
                    onChange={(e) =>
                      setForm({ ...form, roundSizes: e.target.value })
                    }
                  />
                  {/* Square Sizes */}
                  <input
                    className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                    placeholder='Square Sizes (comma separated, e.g. 1/2" x 2" x 1", 1/2" x 3" x 3")'
                    value={form.squareSizes}
                    onChange={(e) =>
                      setForm({ ...form, squareSizes: e.target.value })
                    }
                  />
                  {/* Pipe Types */}
                  <input
                    className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                    placeholder="Pipe types (Round, Square)"
                    value={form.pipeTypes}
                    onChange={(e) =>
                      setForm({ ...form, pipeTypes: e.target.value })
                    }
                  />
                </>
              ) : (
                <input
                  className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                  placeholder="General Sizes (comma separated, e.g. Small, Medium, Large)"
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
                <option value="no">No Color Options</option>
                <option value="yes">Has Color Options</option>
              </select>

              {/* Colors input (shown only if hasColors = yes) */}
              {form.hasColors === "yes" && (
                <input
                  className="bg-[var(--color-fieldBg)] text-white px-3 py-2 rounded border border-[var(--color-IconBg)] focus:outline-none focus:border-[var(--color-iconColor)] col-span-2"
                  placeholder="Colors (comma separated, e.g. Silver, Golden, Black)"
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
              {isLoading ? "Saving..." : "Add Hardware Item"}
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
            <PaginatedItems items={items} perPage={5} />
          )}
        </section>
      </div>
    </main>
  );
}

function PaginatedItems({
  items,
  perPage = 5,
}: {
  items: any[];
  perPage?: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / perPage);

  const startIndex = (page - 1) * perPage;
  const visibleItems = items.slice(startIndex, startIndex + perPage);

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };
  const handleNext = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  return (
    <div className="bg-[var(--color-cardBg)] rounded-xl p-4">
      <div className="space-y-2">
        {visibleItems.map((it) => (
          <div
            key={it._id}
            className="flex justify-between bg-[var(--color-fieldBg)] px-3 py-2 rounded border border-[var(--color-IconBg)]"
          >
            <div>
              <p className="font-semibold text-white">{it.name}</p>
              <p className="text-xs text-gray-400">
                {it.priceType === "unit" ? "Per Unit" : "Per Kg"}{" "}
                {it.hasPipeTypes ? (
                  <>
                    | Round:{" "}
                    {it.sizes?.Round?.length
                      ? it.sizes.Round.join(", ")
                      : "- No Round Sizes -"}
                    | Square:{" "}
                    {it.sizes?.Square?.length
                      ? it.sizes.Square.join(", ")
                      : "- No Square Sizes -"}
                  </>
                ) : (
                  <>
                    | Sizes:{" "}
                    {it.sizes?.general?.length
                      ? it.sizes.general.join(", ")
                      : "- No Sizes -"}
                  </>
                )}
              </p>
              {it.hasColors && it.colors?.length > 0 && (
                <p className="text-xs text-gray-400">
                  Colors: {it.colors.join(", ")}
                </p>
              )}
            </div>
            <span className="text-[var(--color-iconColor)] text-xs">
              {new Date(it.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination bar */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-3">
          <button
            onClick={handlePrev}
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
            Page {page} of {totalPages}
          </span>

          <button
            onClick={handleNext}
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
