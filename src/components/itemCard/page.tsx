"use client";

import { useState, useEffect } from "react";
import FormField from "../FormField/page";
import { useRouter } from "next/navigation";

const GuageOptions = ["1.35", "1.1", "1.0", "0.9", "0.8", "0.7"];
const GuageAdditionalOptions = ["0.6", "0.5", "0.4", "0.35", "0.3"];

const BandSizeOptions = [
  '1/2"',
  '5/8"',
  '3/4"',
  '1"',
  '1-1/4"',
  '1-1/2"',
  '2"',
  '2-1/2"',
  '3"',
  '4"',
];

const SquareItemSizeOptions = [
  '4" x 4"',
  '3" x 3"',
  '2" x 2"',
  '1-1/2" x 1-1/2"',
  '1-1/4" x 1-1/4"',
  '1" x 1"',
];

const AdditionalSquareItemSizeOptions = [
  '3/4" x 3/4"',
  '1/2" x 1/2"',
  '1-1/2" x 3"',
  '1" x 2"',
  '1" x 1-1/2"',
  '3/4" x 1-1/2"',
  '1/2" x 1-1/2"',
  '1/2" x 1"',
  '3/4" x 3/8"',
];

const RoundItemSizeOptions = [
  '4"',
  '3"',
  '2-1/2"',
  '2"',
  '1-1/2"',
  '1-1/4"',
  '1"',
];

const AdditionalRoundItemSizeOptions = ['3/4"', '5/8"', '1/2"', '3/8"'];

const HardwareItemNameOptions = [
  "Plate",
  "Basecup",
  "Cutt Ball",
  "Band",
  "Draz",
  "Rod",
];

const PlateSizeRoundOptions = [
  '2" x 4"',
  '3" x 5"',
  '1-1/2" x 3"',
  '3"',
  '3-1/2"',
  '4"',
  '5"',
  '1/2" x 2"',
  '1/2" x 1-1/2"',
];

const PlateSizeSquareOptions = [
  '1/2" x 1-1/2" x 1-1/2"',
  '1/2" x 2" x 1"',
  '1/2" x 3" x 3"',
  '1/2" x 2" x 2"',
];

const BasecupSizeRoundOptions = [
  '1/2" x 2"',
  '1/2" x 1-1/2"',
  '5/8" x 1-1/2"',
  '3/4" x 3"',
  '2" x 4"',
  '1-1/2" x 3"',
  '1" x 3"',
  '1-1/4" x 3"',
  '3" x 5"',
  '4" x 6"',
  '2-1/2" x 5"',
];

const BasecupSizeSquareOptions = [
  '3/4" x 3/4" x 3"',
  '1" x 1" x 3"',
  '1-1/4" x 1-1/4" x 3"',
  '1-1/2" x 1-1/2" x 4"',
  '2" x 2" x 4"',
  '3" x 3" x 5"',
  '1" x 1-1/2" x 4"',
  '1" x 2" x 4"',
  '4" x 4" x 6"',
];

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
    pricePerKg?: number;
    pricePerUnit?: number;
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
        price: initialData.pricePerUnit
          ? String(initialData.pricePerUnit)
          : String(initialData.pricePerKg ?? ""),
        stock: String(initialData.quantity ?? ""),
        height: initialData.height != null ? String(initialData.height) : "",
      }));
    }
  }, [initialData]);

  const isPillars = formData.itemType === "Pillars";
  const isHardwarePlate =
    formData.itemType === "Hardware" && formData.itemName === "Plate";
  const isHardwareBasecup =
    formData.itemType === "Hardware" && formData.itemName === "Basecup";
  const isHardwareBand =
    formData.itemType === "Hardware" && formData.itemName === "Band";

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
      ((isHardwarePlate || isHardwareBasecup) && !formData.pipeType) ||
      !formData.itemSize ||
      !formData.stock ||
      !formData.price ||
      (isPillars ? !formData.gote : !formData.guage && !isHardware)
    ) {
      alert("Please fill all required fields before submitting.");
      return;
    }

    const newItem: any = {
      name: formData.itemName,
      type: formData.itemType,
      pipeType: formData.pipeType,
      size: formData.itemSize,
      guage: formData.guage,
      gote: formData.gote,
      quantity: Number(formData.stock),
      height: formData.height,
      date: new Date().toISOString(),
    };

    if (isHardwareBand) {
      newItem.pricePerUnit = Number(formData.price); // ✅ save per-unit
    } else {
      newItem.pricePerKg = Number(formData.price); // ✅ save per-kg
      newItem.weight = Number(formData.weight);
    }

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
    formData.pipeType === "Round" && formData.itemSize === '1"'
      ? [...GuageOptions, ...GuageAdditionalOptions]
      : GuageOptions;

  const pipeTypeFieldForPipeAndPillars = {
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
  };

  const hardwareTypeField = {
    label: formData.itemType === "Hardware" ? "Hardware Type" : "Pipe Type",
    value: formData.pipeType,
    type: "select",
    options: ["Round", "Square"],
    onChange: (value: string) =>
      setFormData((prev) => ({
        ...prev,
        pipeType: value,
        itemSize: "",
      })),
  };

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
          itemName: "",
        })),
    },
    ...(formData.itemType === "Pipe" || formData.itemType === "Pillars"
      ? [pipeTypeFieldForPipeAndPillars]
      : []),
    ...(formData.itemType !== "Pipe"
      ? [
          {
            label: "Item Name",
            value: formData.itemName,
            type: formData.itemType === "Hardware" ? "select" : "text",
            options:
              formData.itemType === "Hardware" ? HardwareItemNameOptions : [],
            placeholder:
              formData.itemType === "Hardware"
                ? "Select Item Name"
                : "Enter Item Name",
            onChange: (value: string) =>
              setFormData((prev) => ({
                ...prev,
                itemName: value,
                pipeType: "",
                itemSize: "",
              })),
          },
        ]
      : []),
    ...(isHardwarePlate || isHardwareBasecup ? [hardwareTypeField] : []),
    {
      label: "Item Size",
      value: formData.itemSize,
      type: "select",
      options:
        formData.itemType === "Pipe"
          ? formData.pipeType === "Round"
            ? [...RoundItemSizeOptions, ...AdditionalRoundItemSizeOptions]
            : formData.pipeType === "Square"
            ? [...SquareItemSizeOptions, ...AdditionalSquareItemSizeOptions]
            : []
          : isHardwarePlate
          ? formData.pipeType === "Round"
            ? PlateSizeRoundOptions
            : PlateSizeSquareOptions
          : isHardwareBasecup
          ? formData.pipeType === "Round"
            ? BasecupSizeRoundOptions
            : BasecupSizeSquareOptions
          : isHardwareBand
          ? BandSizeOptions
          : formData.pipeType === "Round"
          ? RoundItemSizeOptions
          : SquareItemSizeOptions,
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
          },
        ]
      : formData.itemType !== "Hardware"
      ? [
          {
            label: "Guage",
            value: formData.guage,
            type: "select",
            options: computedGuageOptions,
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, guage: value })),
            hidden: !formData.itemSize,
          },
        ]
      : []),
    ...(isHardwareBand
      ? [
          {
            label: "Price Per Unit (PKR)", // ✅ clear per-unit field
            value: formData.price,
            placeholder: "Enter per-item price",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, price: value })),
          },
        ]
      : [
          {
            label: "Price Per Kg (PKR)",
            value: formData.price,
            placeholder: "Enter price per kg",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, price: value })),
          },
          {
            label: "Weight (KG)",
            value: formData.weight,
            placeholder: "Enter weight in KG",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, weight: value })),
          },
        ]),
    {
      label: "Total Stock",
      value: formData.stock,
      placeholder: "Total Stock value here",
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, stock: value })),
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
