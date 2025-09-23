"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

const sideBarItems = [
  { name: "Dashboard", path: "/Dashboard" },
  { name: "Inventory", path: "/Inventory" },
  { name: "Add Item", path: "/addItem" },
  { name: "Invoice", path: "/Invoice" },
  { name: "Rate list", path: "/RateList" },
];

export default function Sidebar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-64 px-[70px] py-[34px] bg-dashboardBg min-h-screen flex flex-col justify-between">
      {/* Logo */}
      <div className="flex items-center justify-center">
        <h1 className="text-white text-2xl font-bold">
          <span className="text-orange-300">Taha</span>Metal
        </h1>
      </div>

      {/* Sidebar Items */}
      <div className="relative flex flex-col space-y-1">
        {sideBarItems.map((item, index) => {
          const isActive = pathname === item.path;

          return (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    layoutId="hoverBg"
                    className="absolute inset-0 bg-[#2d3142] rounded-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>

              <button
                onClick={() => router.push(item.path)}
                className={`relative z-10 text-left w-full px-4 py-2 font-medium hover:cursor-pointer ${
                  isActive ? "text-orange-300" : "text-white"
                }`}
              >
                {item.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-white text-xs">
        © {new Date().getFullYear()} TahaMetals
      </div>
    </div>
  );
}
