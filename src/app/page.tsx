"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const loggedIn = sessionStorage.getItem("loggedIn");

    if (loggedIn === "true") {
      router.push("/Dashboard");
    } else {
      router.push("/Login");
    }
  }, [router]);

  return null;
}
