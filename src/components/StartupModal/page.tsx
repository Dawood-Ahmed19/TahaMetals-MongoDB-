"use client";
import { useEffect, useState } from "react";

export default function StartupModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("adminNoticeShown");
    if (!shown) setOpen(true);
  }, []);

  const closeModal = () => {
    sessionStorage.setItem("adminNoticeShown", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      aria-modal
      role="dialog"
    >
      <div className="bg-[#2d3142] text-white p-8 rounded-2xl shadow-xl w-[90%] max-w-md text-center space-y-6">
        <h2 className="text-2xl font-bold text-orange-300">Important Notice</h2>
        <p className="text-sm leading-relaxed text-gray-200">
          An <strong>Admin&nbsp;account</strong> is required before you can
          create any user accounts. Keep in mind that only one&nbsp;Admin
          account can be created at&nbsp;maximum.
        </p>
        <button
          onClick={closeModal}
          className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Got&nbsp;it
        </button>
      </div>
    </div>
  );
}
