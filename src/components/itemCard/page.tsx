"use client";

import { useState, useEffect } from "react";
import FormField from "../FormField/page";
import { useRouter } from "next/navigation";

const GuageOptions = ["1.35", "1.1", "1.0", "0.9", "0.8", "0.7"];
const GuageAdditionalOptions = ["0.6", "0.5", "0.4", "0.35", "0.3"];

const SquareitemSizeOptions = [
  `4" x 4"`,
  `3" x 3"`,
  `2" x 2"`,
  `1 - 1/2" x 1 - 1/2"`,
  `1 - 1/4" x 1 - 1/4"`,
  `1" x 1"`,
];

const additionalSquareItemSizeOptions = [
  `3/4" x 3/4"`,
  `1/2" x 1/2"`,
  `1 - 1/2" x 3"`,
  `1" x 2"`,
  `1" x 1 - 1/2"`,
  `3/4" x 1 - 1/2"`,
  `1/2" x 1 - 1/2"`,
  `1/2" x 1"`,
  `3/4" x 3/8"`,
];

const RounditemSizeOptions = [
  `4"`,
  `3"`,
  `2 - 1/2"`,
  `2"`,
  `1 - 1/2"`,
  `1 - 1/4"`,
  `1"`,
];

const additionalRoundItemSizeOptions = [`3/4"`, `5/8"`, `1/2"`, `3/8"`];

interface ItemCardProps {
  initialData?: {
    id: string;
    name: string;
    type: string;
    pipeType: string;
    guage?: number | string;
    gote?: number | string;
    size: string;
    weight: number;
    price: number;
    quantity: number;
    height?: number | string;
    date: string;
    index: number;
  };
  isEdit?: boolean;
  onSubmit?: (updateData: any) => void;
}

export default function ItemCard({ initialData }: ItemCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    id: "",
    itemType: "",
    itemName: "",
    pipeType: "",
    itemSize: "",
    weight: "",
    guage: "",
    gote: "",
    price: "",
    stock: "",
    height: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        id: initialData.id,
        itemType: initialData.type ?? "",
        pipeType: initialData.pipeType ?? "",
        itemName: initialData.name ?? "",
        itemSize: initialData.size ?? "",
        weight: String(initialData.weight ?? ""),
        guage: initialData.guage != null ? String(initialData.guage) : "",
        gote: initialData.gote != null ? String(initialData.gote) : "",
        price: String(initialData.price ?? ""),
        stock: String(initialData.quantity ?? ""),
        height: initialData.height != null ? String(initialData.height) : "",
      }));
    }
  }, [initialData]);

  const isPillars = formData.itemType === "Pillars";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPipe = formData.itemType === "Pipe";
    const isPillars = formData.itemType === "Pillars";
    const isHardware = formData.itemType === "Hardware";

    if (
      !formData.itemType ||
      (isPipe && !formData.pipeType) ||
      (isPillars && !formData.pipeType) ||
      (isHardware && !formData.itemName) ||
      !formData.itemSize ||
      !formData.stock ||
      !formData.price ||
      (isPillars ? !formData.gote : !formData.guage)
    ) {
      alert("Please fill all required fields before submitting.");
      return;
    }

    const newItem = {
      name: formData.itemName,
      type: formData.itemType,
      pipeType: formData.pipeType,
      size: formData.itemSize,
      guage: formData.guage,
      gote: formData.gote,
      weight: Number(formData.weight),
      price: Number(formData.price),
      quantity: Number(formData.stock),
      height: formData.height,
      date: new Date().toISOString(),
    };

    setIsLoading(true);

    try {
      const res = await fetch(
        initialData ? `/api/items/${initialData.id}` : "/api/items",
        {
          method: initialData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        }
      );
      if (!res.ok) throw new Error("Failed to save item");

      alert("Item saved successfully ✅");
      router.push("/Inventory");
    } catch (err) {
      console.error("Error saving item:", err);
      alert("Could not save item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const computedGuageOptions =
    formData.pipeType === "Round" && formData.itemSize === `1"`
      ? [...GuageOptions, ...GuageAdditionalOptions]
      : GuageOptions;

  const fields: any[] = [
    {
      label: "Item Type",
      value: formData.itemType,
      type: "select",
      options: ["Pipe", "Hardware", "Pillars"],
      onChange: (value: string) =>
        setFormData((prev) => ({
          ...prev,
          itemType: value,
          pipeType: "",
          itemSize: "",
          guage: "",
          gote: "",
          height: "",
        })),
    },
    ...(formData.itemType === "Pipe" || formData.itemType === "Pillars"
      ? [
          {
            label: "Pipe Type",
            value: formData.pipeType,
            type: "select",
            options:
              formData.itemType === "Pipe"
                ? ["Round", "Square"]
                : ["Round", "Square", "Fancy"],
            onChange: (value: string) =>
              setFormData((prev) => ({
                ...prev,
                pipeType: value,
                itemSize: "",
              })),
          },
        ]
      : []),
    ...(formData.itemType === "Pipe"
      ? []
      : [
          {
            label: "Item Name",
            value: formData.itemName,
            placeholder: "Enter Item Name",
            type: "text",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, itemName: value })),
          },
        ]),
    {
      label: "Item Size",
      value: formData.itemSize,
      type: "select",
      options:
        formData.itemType === "Pipe"
          ? formData.pipeType === "Round"
            ? [...RounditemSizeOptions, ...additionalRoundItemSizeOptions]
            : formData.pipeType === "Square"
            ? [...SquareitemSizeOptions, ...additionalSquareItemSizeOptions]
            : []
          : formData.pipeType === "Round"
          ? RounditemSizeOptions
          : SquareitemSizeOptions,
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, itemSize: value })),
    },
    ...(isPillars
      ? [
          {
            label: "Gote",
            value: formData.gote,
            type: "select",
            options: ["1", "2", "3", "4", "5", "6", "7", "8"],
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, gote: value })),
          },
          {
            label: "Height (ft)",
            value: formData.height,
            placeholder: "Enter pillar height",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, height: value })),
          },
        ]
      : [
          {
            label: "Guage",
            value: formData.guage,
            type: "select",
            options: computedGuageOptions,
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, guage: value })),
            hidden: !formData.itemSize,
          },
        ]),
    {
      label: "Price Per Kg (PKR)",
      value: formData.price,
      placeholder: "Put price here",
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, price: value })),
    },
    {
      label: "Total Stock",
      value: formData.stock,
      placeholder: "Total Stock value here",
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, stock: value })),
    },
    {
      label: "Weight (KG)",
      value: formData.weight,
      placeholder: "Type item Weight here",
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, weight: value })),
    },
  ];

  return (
    <span className="bg-cardBg px-[75px] py-[55px] h-full max-w-[715px] w-full rounded-xl flex flex-col justify-between">
      <h1 className="font-bold text-base text-white">
        {initialData ? "Edit Item" : "Add Item"}
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {fields
          .filter((field) => !(field.hidden === true))
          .map((field) => (
            <FormField key={field.label} {...field} />
          ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          {isLoading
            ? initialData
              ? "Updating..."
              : "Adding..."
            : initialData
            ? "Update Item"
            : "Add Item"}
        </button>
      </div>
    </span>
  );
}
