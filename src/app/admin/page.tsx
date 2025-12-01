"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin-master-data");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-400">Redirecting to Admin Master Data...</p>
    </div>
  );
}
