import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { exchangeImpersonation } from "@/api/http/impersonation";
import { setImpersonation } from "@/lib/impersonation";
import { queryKeys } from "@/hooks/queryKeys";

/** Reads the one-time code from `#code=…` (preferred) or `?code=…`. */
function readCode(): string {
  const fromHash = (window.location.hash || "").match(/code=([^&]+)/);
  if (fromHash) return decodeURIComponent(fromHash[1] ?? "");
  const q = new URLSearchParams(window.location.search).get("code");
  return q ? q : "";
}

/**
 * Admin "view as user" entry. Exchanges the one-time code for a read-only
 * impersonation session, then drops into the portal as the patient. Rendered
 * BEFORE the auth gate (we arrive with only a code, no session yet).
 */
export default function ImpersonateExchange() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-invoke — code is single-use
    ran.current = true;

    const code = readCode();
    if (!code) {
      setError("This link is missing its access code.");
      return;
    }

    exchangeImpersonation(code)
      .then((res) => {
        if (!res.user) {
          setError("Could not start the viewing session.");
          return;
        }
        setImpersonation({ user: res.user, readOnly: res.readOnly });
        qc.setQueryData(queryKeys.auth.user(), res.user);
        // Strip the (spent) code from the URL, then land on the portal home.
        window.history.replaceState(null, "", "/");
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError("This link has expired or was already used. Ask the admin to generate a new one.");
      });
  }, [navigate, qc]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 text-center">
      {error ? (
        <div className="max-w-sm">
          <p className="text-lg font-semibold text-slate-900">Can’t open this session</p>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Opening the portal…</p>
        </div>
      )}
    </div>
  );
}
