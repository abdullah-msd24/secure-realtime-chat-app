"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1️⃣ Verify login
        const loginRes = await fetch("http://localhost:8000/api/auth/verifyLogin", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok || loginData.status === false) {
          router.push("/Register");
          return;
        }

        // 2️⃣ Verify role
        const roleRes = await fetch("http://localhost:8000/api/auth/verifyrule", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const roleData = await roleRes.json();

        const role = roleData.role;

        if (role === "admin") {
          router.push("/admin/dashboard");
        } else if (role === "user") {
          router.push("/chatdashboard");
        } else {
          router.push("/Register");
        }

      } catch (error) {
        router.push("/Register");
      }
    };

    checkAuth();
  }, [router]);

  return <div>Loading...</div>;
}