"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/page";

export default function Login() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD;

    if (password !== sitePassword) {
      alert("Wrong password!");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("role", role || "");
      if (role === "user") {
        sessionStorage.setItem("username", username);
      }
      router.push("/Dashboard");
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader />
        <p className="mt-4 text-gray-600 font-medium">Logging in...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-96 text-center">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Login Type</h1>
          <button
            onClick={() => setRole("admin")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg mb-4"
          >
            Admin Login
          </button>
          <button
            onClick={() => setRole("user")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
          >
            User Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {role === "admin" ? "Admin Login" : "User Login"}
        </h1>

        {role === "user" && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="p-3 border rounded-lg w-full outline-none"
            />
          </div>
        )}

        <div className="relative w-full mb-6">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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
          disabled={role === "user" && username.trim() === ""}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Login
        </button>

        <p
          onClick={() => {
            setRole(null);
            setPassword("");
            setUsername("");
          }}
          className="mt-4 text-blue-500 hover:underline cursor-pointer text-center"
        >
          Go back
        </p>
      </div>
    </div>
  );
}
