"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/page";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("loggedIn");

    if (loggedIn === "true") {
      router.push("/Dashboard");
    } else {
      router.push("/Login");
    }

    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader />
        <p className="mt-4 text-gray-600 font-medium">Redirecting...</p>
      </div>
    );
  }

  return null;
}
