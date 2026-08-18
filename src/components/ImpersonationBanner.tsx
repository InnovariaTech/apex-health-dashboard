import { useState } from "react";
import { Eye, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getImpersonation, clearImpersonation } from "@/lib/impersonation";
import { endImpersonation } from "@/api/http/impersonation";
import { queryKeys } from "@/hooks/queryKeys";

/**
 * Persistent "viewing as patient" bar shown while an admin impersonates a user.
 * Read-only session — the Exit button ends it and returns to a neutral screen.
 */
export default function ImpersonationBanner() {
  const imp = getImpersonation();
  const qc = useQueryClient();
  const [ending, setEnding] = useState(false);

  if (!imp) return null;

  const exit = async () => {
    setEnding(true);
    try {
      await endImpersonation();
    } catch {
      /* end anyway — clear locally */
    }
    clearImpersonation();
    qc.setQueryData(queryKeys.auth.user(), null);
    // The tab was opened by the admin console; close it if we can, else send
    // to a neutral page (the session is gone, so the app would bounce to login).
    window.close();
    window.location.replace("/login");
  };

  return (
    <div
      className="sticky top-0 z-[60] w-full flex items-center justify-center gap-3 px-4 py-2 text-[13px] font-medium"
      style={{ background: "#B54708", color: "#fff" }}
    >
      <Eye className="w-4 h-4" />
      <span>
        Viewing as <b>{imp.user.email}</b>
        {imp.readOnly ? " · read-only" : ""}
      </span>
      <button
        type="button"
        onClick={() => void exit()}
        disabled={ending}
        className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md text-[12px] font-semibold disabled:opacity-60"
        style={{ background: "rgba(255,255,255,0.18)" }}
      >
        {ending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Exit
      </button>
    </div>
  );
}
