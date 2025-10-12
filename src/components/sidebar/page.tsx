"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, m } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

const AllsideBarPaths = [
  { name: "Dashboard", path: "/Dashboard" },
  { name: "Inventory", path: "/Inventory" },
  { name: "Add Item", path: "/addItem" },
  { name: "Invoice", path: "/Invoice" },
  { name: "Reports", path: "/Reports" },
  { name: "Return items", path: "/Returned" },
  { name: "Rate list", path: "/Ratelist" },
  { name: "Expenses", path: "/Expenses" },
  { name: "Settings", path: "/Settings" },
  { name: "Employees", path: "/Salary" },
  { name: "Pay Salary", path: "/AddSalary" },
  { name: "Admin", path: "/admin/hardware" },
];

const userAllowedPaths = [
  "/Dashboard",
  "/Inventory",
  "/addItem",
  "/Expenses",
  "/Invoice",
  "/Returned",
  "/Settings",
];

export default function Sidebar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedName = sessionStorage.getItem("username");
    const storedRole = sessionStorage.getItem("role");
    setUserName(storedName);
    setRole(storedRole);
  }, []);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);

    setTimeout(() => {
      sessionStorage.clear();
      router.push("/Login");
    }, 600);
  };

  const sideBarItems =
    role === "admin"
      ? AllsideBarPaths
      : AllsideBarPaths.filter((item) => userAllowedPaths.includes(item.path));

  return (
    <div className="w-64 px-[60px] py-[34px] bg-dashboardBg min-h-screen flex flex-col justify-between">
      <div className="flex flex-col items-center justify-center gap-5">
        <h1 className="text-white text-2xl font-bold">
          <span className="text-orange-300">Taha</span>Metal
        </h1>

        <div className="flex flex-col items-center">
          <p className="text-sm text-white font-bold">
            {userName ? userName : ""}
          </p>
          <p className="text-xs text-gray-400">
            {role === "admin" ? "Admin" : "Standard User"}
          </p>
        </div>
      </div>

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
      <div className="text-white text-xs flex flex-col items-center gap-5">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full bg-BgColor hover:bg-IconBg text-white font-semibold py-2 rounded-md transition-opacity ${
            loggingOut ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
        © {new Date().getFullYear()} TahaMetals
      </div>
    </div>
  );
}
