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

  // Error states
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();

  const showTempError = (setter: (msg: string) => void, message: string) => {
    setter(message);
    setTimeout(() => setter(""), 1500);
  };

  const handleLogin = () => {
    if (loading) return;

    const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD;
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    let hasError = false;

    setUsernameError("");
    setPasswordError("");

    if (!role) {
      return;
    }

    if (role === "user" && username.trim() === "") {
      showTempError(setUsernameError, "Please enter your name.");
      hasError = true;
    }

    if (password.trim() === "") {
      showTempError(setPasswordError, "Please enter your password.");
      hasError = true;
    }

    const isPasswordCorrect =
      role === "admin" ? password === adminPassword : password === sitePassword;

    if (!hasError && !isPasswordCorrect) {
      showTempError(setPasswordError, "Incorrect password.");
      hasError = true;
    }

    if (hasError) return;

    // === All good → proceed ===
    setLoading(true);

    setTimeout(() => {
      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("role", role || "");
      if (role === "user") {
        sessionStorage.setItem("username", username.trim());
      }

      router.push("/Dashboard");
    }, 1000);
  };

  // === Loader Screen ===
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader />
        <p className="mt-4 text-gray-600 font-medium">Logging in...</p>
      </div>
    );
  }

  // === Role Selection ===
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

  // === Login Form ===
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {role === "admin" ? "Admin Login" : "User Login"}
        </h1>

        {/* Username – Users Only */}
        {role === "user" && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`p-3 border rounded-lg w-full outline-none ${
                usernameError ? "border-red-500" : ""
              }`}
            />
            {usernameError && (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            )}
          </div>
        )}

        {/* Password */}
        <div className="relative w-full mb-4">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`p-3 pr-16 border rounded-lg w-full outline-none ${
              passwordError ? "border-red-500" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Login
        </button>

        {/* Back Button */}
        <p
          onClick={() => {
            if (loading) return;
            setRole(null);
            setPassword("");
            setUsername("");
            setUsernameError("");
            setPasswordError("");
          }}
          className="mt-4 text-blue-500 hover:underline cursor-pointer text-center"
        >
          Go back
        </p>
      </div>
    </div>
  );
}
