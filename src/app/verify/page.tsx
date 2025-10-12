"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Verify() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function submit() {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    setMsg(data.message);
    if (data.success) setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-dashboardBg)] text-white">
      <div className="bg-[var(--color-BgColor)] p-8 rounded-xl w-80 space-y-4 shadow-lg">
        <h1 className="text-xl font-semibold text-center">Verify Email</h1>
        <p className="text-sm text-gray-400 text-center">
          Enter the 6-digit code sent to {email}
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Verification Code"
          className="w-full p-3 rounded-md outline-none text-center text-white placeholder-gray-400"
          style={{
            backgroundColor: "var(--color-cardBg)",
            border: "1px solid var(--color-IconBg)",
          }}
        />
        {msg && <p className="text-center text-sm">{msg}</p>}
        <button
          onClick={submit}
          className="w-full bg-[var(--color-iconColor)] hover:opacity-90 py-2 rounded-md font-semibold"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
