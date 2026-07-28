"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** RN-413.12: atualização automática do painel a cada 30s, sem recarregar a página. */
export default function AdminAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
