"use client";

import QuotationField from "@/components/quotationField/page";

export default function Quotations() {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col w-full h-full py-[35px] px-[72px] gap-[35px]">
      <div className="flex justify-between items-center w-full mb-6">
        <h1 className="text-xl font-bold text-white">Invoice</h1>
        <p className="text-sm text-white">{formattedDate}</p>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        <QuotationField />
      </div>
    </div>
  );
}
