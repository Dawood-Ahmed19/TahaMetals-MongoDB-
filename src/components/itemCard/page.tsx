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

const GlassCutterSize = [`14mm`];

const DiskSizeOptions = [`4"`, `5"`];
const DiskAdditionalSizeOptions = [`14"`];

const stopperRoundSize = [
  `1/2" Gol`,
  `1/2" minar`,
  `1/2" steel`,
  `1/2" china`,
  `1" steel`,
  `5/8"`,
  `3/4"`,
  `1 - 1/4"`,
  `1 - 1/2"`,
  `2"`,
];

const ChinaBallSizeOptions = [`2"`, `2 - 1/2"`, `3"`];

const stopperSquareSize = [
  `1/2" x 1/2"`,
  `1" x 2"`,
  `1" x 1 - 1/2"`,
  `3/4" x 1 - 1/2"`,
  `1/2" x 1 - 1/2"`,
  `1/2" x 1"`,
  `2" x 2"`,
  `1 - 1/2" x 1 - 1/2"`,
  `1 - 1/4" x 1 - 1/4"`,
  `1" x 1"`,
];

const RingSize = [`2"`, `3"`];
const StarSize = [`2"`, `3"`, `4"`, `3" kingri`];
const ChutkniSize = [`4"`, `6"`, `8"`];

const CuttBallSizeOptions = [
  '1/2"',
  '5/8"',
  '3/4"',
  '1"',
  '1-1/2"',
  '2"',
  '3"',
];
const SquareItemSizeOptions = [
  '4" x 4"',
  '3" x 3"',
  '2" x 2"',
  '1-1/2" x 1-1/2"',
  '1-1/4" x 1-1/4"',
  '1" x 1"',
];

const VipBallsSize = [`3"`, `2 - 1/2"`, `2"`, `1 - 1/2"`, `1"`, `3" x 3"`];

const AdditionalSquareItemSizePillars = [`1" x 1 - 1/2"`, `1" x 2"`];

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
  `1" x 3"`,
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
const AdditionalRoundItemSizeOptions = ["3/4", '5/8"', '1/2"', '3/8"'];

const HardwareItemNameOptions = [
  "Plate",
  "Basecup",
  "Cutt Ball",
  "Band",
  "Draz",
  "Rod",
  "Gote",
  "Ring",
  "VIP Ball",
  "China Ball",
  "Stopper",
  "Star",
  "Chutkni",
  "Rawal Bolt CC 13mm",
  "Disk Red",
  "Disk White",
  "Disk Regmar",
  "Disk G.P",
  "Disk Cutting",
  "Glass Cutter",
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

const RodSizeOptions = ["14", "12"];
const DarazSizeOptions = ['8"', '12"', '18"'];
const CuttBallColorOptions = ["Silver", "Golden", "Multi"];
const RingColorOptions = ["Silver", "Golden"];
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
    color?: string;
  };
  isEdit?: boolean;
  onSubmit?: (updateData: any) => void;
}

export default function ItemCard({ initialData }: ItemCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hardwareItems, setHardwareItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchHardwareItems = async () => {
      try {
        const res = await fetch("/api/hardware-items");
        const data = await res.json();
        if (data.success) setHardwareItems(data.items);
      } catch (err) {
        console.error("Error fetching hardware items", err);
      }
    };
    fetchHardwareItems();
  }, []);

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
    color: "",
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
        height:
          initialData.height != null
            ? String(initialData.height)
            : initialData.type === "Pillars"
            ? "Normal"
            : "",
        color: initialData.color ?? "",
      }));
    }
  }, [initialData]);

  const isPillars = formData.itemType === "Pillars";
  const selectedHardware = hardwareItems.find(
    (item) => item.name === formData.itemName
  );
  const hardwareNameOptions = hardwareItems.map((h) => h.name);
  let sizeOptions: string[] = [];

  if (formData.itemType === "Hardware" && selectedHardware) {
    // item supports Round/Square
    if (selectedHardware.hasPipeTypes) {
      // pick the sizes array for the active pipeType
      const pipeKey = formData.pipeType?.trim();
      if (
        pipeKey &&
        selectedHardware.sizes &&
        typeof selectedHardware.sizes === "object"
      ) {
        const match =
          selectedHardware.sizes[pipeKey] ||
          selectedHardware.sizes[pipeKey.toLowerCase()] ||
          [];
        sizeOptions = (match as string[]).filter(Boolean);
      } else {
        sizeOptions = [];
      }
    } else {
      // simple hardware (no pipe type distinction)
      if (Array.isArray(selectedHardware.sizes)) {
        sizeOptions = selectedHardware.sizes as string[];
      } else if (
        typeof selectedHardware.sizes === "object" &&
        selectedHardware.sizes.general
      ) {
        sizeOptions = (selectedHardware.sizes.general as string[]).filter(
          Boolean
        );
      }
    }
  } else if (formData.itemType === "Pipe") {
    sizeOptions =
      formData.pipeType === "Round"
        ? [...RoundItemSizeOptions, ...AdditionalRoundItemSizeOptions]
        : formData.pipeType === "Square"
        ? [...SquareItemSizeOptions, ...AdditionalSquareItemSizeOptions]
        : [];
  } else if (formData.itemType === "Pillars") {
    sizeOptions =
      formData.pipeType === "Round"
        ? RoundItemSizeOptions
        : formData.pipeType === "Square"
        ? [...SquareItemSizeOptions, ...AdditionalSquareItemSizePillars]
        : [];
  } else {
    sizeOptions =
      formData.pipeType === "Round"
        ? RoundItemSizeOptions
        : SquareItemSizeOptions;
  }
  const hasSizes =
    formData.itemType === "Hardware"
      ? !!(
          selectedHardware &&
          selectedHardware.sizes &&
          Object.values(selectedHardware.sizes).some(
            (arr: any) => Array.isArray(arr) && arr.length > 0
          )
        )
      : true;
  const colorOptions = selectedHardware?.colors ?? [];
  const priceType = selectedHardware?.priceType ?? "unit";
  const isHardwareGote =
    formData.itemType === "Hardware" && formData.itemName === "Gote";
  const isHardwareStar =
    formData.itemType === "Hardware" && formData.itemName === "Star";

  // ================= Handle submit =====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPipe = formData.itemType === "Pipe";
    const isPillars = formData.itemType === "Pillars";
    const isHardware = formData.itemType === "Hardware";

    const isHardwareBand =
      isHardware && formData.itemName?.toLowerCase() === "band";
    const isHardwareCuttBall =
      isHardware && formData.itemName?.toLowerCase() === "cutt ball";
    const isHardwareDraz =
      isHardware && formData.itemName?.toLowerCase() === "draz";
    const isHardwarePlate =
      isHardware && formData.itemName?.toLowerCase() === "plate";
    const isHardwareBasecup =
      isHardware && formData.itemName?.toLowerCase() === "basecup";
    const isHardwareStopper =
      isHardware && formData.itemName?.toLowerCase() === "stopper";
    const isHardwareRing =
      formData.itemType === "Hardware" && formData.itemName === "Ring";
    const isHardwareBalls =
      formData.itemType === "Hardware" && formData.itemName === "VIP Ball";
    const isHardwareChutkni =
      formData.itemType === "Hardware" && formData.itemName === "Chutkni";
    const isHardwareBolt =
      formData.itemType === "Hardware" &&
      formData.itemName === "Rawal Bolt CC 13mm";
    const isHardwareChinaBall =
      formData.itemType === "Hardware" && formData.itemName === "China Ball";
    const isHardwareDiskRed =
      formData.itemType === "Hardware" && formData.itemName === "Disk Red";
    const isHardwareDiskWhite =
      formData.itemType === "Hardware" && formData.itemName === "Disk White";
    const isHardwareDiskRegmar =
      formData.itemType === "Hardware" && formData.itemName === "Disk Regmar";
    const isHardwareDiskGp =
      formData.itemType === "Hardware" && formData.itemName === "Disk G.P";
    const isHardwareDiskCutting =
      formData.itemType === "Hardware" && formData.itemName === "Disk Cutting";
    const isHardwareGlassCutter =
      formData.itemType === "Hardware" && formData.itemName === "Glass Cutter";

    // Validation
    if (
      !formData.itemType ||
      (isPipe && !formData.pipeType) ||
      (isPillars && !formData.pipeType) ||
      (isHardware && !formData.itemName) ||
      ((isHardwarePlate || isHardwareBasecup || isHardwareStopper) &&
        !formData.pipeType) ||
      ((formData.itemType === "Pillars" && formData.pipeType === "Fancy") ||
      isHardwareBolt
        ? false
        : !formData.itemSize) ||
      (formData.itemType === "Hardware" &&
      formData.itemName?.toLowerCase() === "plate"
        ? false
        : !formData.stock) ||
      !formData.price ||
      (isPillars
        ? formData.pipeType === "Fancy"
          ? false
          : !formData.gote
        : !formData.guage && !isHardware) ||
      (isHardwareCuttBall && !formData.color)
    ) {
      alert("Please fill all required fields before submitting.");
      return;
    }

    const newItem: any = {
      type: formData.itemType?.toLowerCase(),
      pipeType: formData.pipeType,
      size: formData.itemSize,
      guage: formData.guage,
      gote: formData.gote,
      quantity: Number(formData.stock),
      height: formData.height,
      date: new Date().toISOString(),
      color: formData.color,
    };

    if (isHardware) {
      newItem.name = formData.itemName?.trim();
    }

    if (
      isHardwareBand ||
      isHardwareCuttBall ||
      isHardwareDraz ||
      isPillars ||
      isHardwareGote ||
      isHardwareBasecup ||
      isHardwareStopper ||
      isHardwareRing ||
      isHardwareStar ||
      isHardwareBalls ||
      isHardwareChutkni ||
      isHardwareBolt ||
      isHardwareChinaBall ||
      isHardwareDiskRed ||
      isHardwareDiskWhite ||
      isHardwareDiskRegmar ||
      isHardwareDiskGp ||
      isHardwareDiskCutting ||
      isHardwareGlassCutter
    ) {
      newItem.pricePerUnit = Number(formData.price);
    } else {
      newItem.pricePerKg = Number(formData.price);
      newItem.weight = Number(formData.weight);
    }

    setIsLoading(true);

    try {
      console.log("📤 Sending to API →", newItem);

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

  // Logics.

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
          height: value === "Pillars" ? "Normal" : "",
          itemName: "",
          color: "",
        })),
    },
    ...(formData.itemType === "Pipe" || formData.itemType === "Pillars"
      ? [pipeTypeFieldForPipeAndPillars]
      : []),

    ...(!["Pipe", "Pillars"].includes(formData.itemType)
      ? [
          {
            label: "Item Name",
            value: formData.itemName,
            type: "select",
            options:
              formData.itemType === "Hardware" ? hardwareNameOptions : [],
            placeholder: "Select Item Name",
            onChange: (value: string) =>
              setFormData((prev) => ({
                ...prev,
                itemName: value,
                itemSize: "",
                color: "",
              })),
          },
        ]
      : []),

    ...(formData.itemType === "Hardware" && selectedHardware?.hasPipeTypes
      ? [hardwareTypeField]
      : []),

    {
      label: "Item Size",
      value: formData.itemSize,
      type: "select",
      options:
        formData.itemType === "Hardware"
          ? sizeOptions
          : formData.itemType === "Pipe"
          ? formData.pipeType === "Round"
            ? [...RoundItemSizeOptions, ...AdditionalRoundItemSizeOptions]
            : formData.pipeType === "Square"
            ? [...SquareItemSizeOptions, ...AdditionalSquareItemSizeOptions]
            : []
          : formData.itemType === "Pillars"
          ? formData.pipeType === "Round"
            ? RoundItemSizeOptions
            : formData.pipeType === "Square"
            ? [...SquareItemSizeOptions, ...AdditionalSquareItemSizePillars]
            : []
          : formData.pipeType === "Round"
          ? RoundItemSizeOptions
          : SquareItemSizeOptions,
      hidden:
        !hasSizes ||
        (formData.itemType === "Pillars" && formData.pipeType === "Fancy") ||
        formData.itemName === "Rawal Bolt CC 13mm",
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, itemSize: value })),
    },
    ...(formData.itemType === "Hardware" && colorOptions.length > 0
      ? [
          {
            label: "Color",
            value: formData.color,
            type: "select",
            options: colorOptions,
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, color: value })),
          },
        ]
      : []),

    ...(isPillars
      ? [
          ...(formData.pipeType !== "Fancy"
            ? [
                {
                  label: "Gote",
                  value: formData.gote,
                  type: "select",
                  options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
                  onChange: (value: string) =>
                    setFormData((prev) => ({ ...prev, gote: value })),
                },
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
          {
            label: "Height (ft)",
            value: formData.height,
            type: "text",
            placeholder: "Enter height in ft",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, height: value })),
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

    // ---- Pricing and Weight Fields ----
    ...(formData.itemType === "Hardware" || formData.itemType === "Pillars"
      ? [
          {
            label:
              priceType === "unit"
                ? "Price Per Unit (PKR)"
                : "Price Per Kg (PKR)",
            value: formData.price,
            placeholder:
              priceType === "unit"
                ? "Enter per-item price"
                : "Enter price per kg",
            onChange: (value: string) =>
              setFormData((prev) => ({ ...prev, price: value })),
          },
          ...(priceType === "weight"
            ? [
                {
                  label: "Weight (KG)",
                  value: formData.weight,
                  placeholder: "Enter weight in KG",
                  onChange: (value: string) =>
                    setFormData((prev) => ({ ...prev, weight: value })),
                },
              ]
            : []),
        ]
      : formData.itemType === "Pipe"
      ? [
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
        ]
      : []),

    {
      label: "Total Stock",
      value: formData.stock,
      hidden:
        formData.itemType === "Hardware" &&
        formData.itemName?.toLowerCase() === "plate",
      placeholder: "Total Stock value here",
      onChange: (value: string) =>
        setFormData((prev) => ({ ...prev, stock: value })),
    },
  ];

  return (
    <span className="bg-cardBg px-12 py-10 h-full w-full max-w-[715px] rounded-xl flex flex-col justify-between mx-auto">
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
