"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_SITE_PASSWORD) {
      sessionStorage.setItem("loggedIn", "true");
      router.push("/Dashboard");
    } else {
      alert("Wrong password!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          TahaMetals Login
        </h1>

        <label
          htmlFor="password"
          className="block mb-2 font-medium text-gray-700"
        >
          Enter Password
        </label>

        <div className="relative w-full mb-6">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 pr-16 border rounded-lg w-full outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  );
}
