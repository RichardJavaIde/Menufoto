//src/lib/notify.ts
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

export function notify(result: ActionResult): boolean {
  if (result.ok) {
    toast.success(result.message);
    return true;
  }
  toast.error(result.error);
  return false;
}