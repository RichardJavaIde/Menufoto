//src/components/admin/denied-toast.tsx
"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function DeniedToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) toast.error("No tienes permiso para acceder a esa sección", { id: "denied" });
  }, [show]);
  return null;
}