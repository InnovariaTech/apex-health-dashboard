import { useState } from "react";
import { FolderOpen, MessageSquare } from "lucide-react";
import CareTeamChatPanel from "@/views/patient/components/messages/CareTeamChatPanel";
import CareTeamDocumentsPanel from "@/views/patient/components/messages/CareTeamDocumentsPanel";

/** Chat and Documents with the care team, as two tabs under the patient's treatments. */
export default function CareTeamTabs() {
  const [tab, setTab] = useState<"chat" | "documents">("chat");
  const tabs = [
    { key: "chat" as const, label: "Chat", icon: MessageSquare },
    { key: "documents" as const, label: "Documents", icon: FolderOpen },
  ];
  return (
    <div>
      <div role="tablist" className="mb-3 inline-flex gap-1 rounded-[12px] border border-border bg-card p-1 shadow-[var(--shadow-card)]">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-[9px] px-4 py-2 text-[14px] font-semibold transition ${
                active ? "text-white shadow-sm" : "text-ink-2 hover:bg-black/[0.04] hover:text-foreground"
              }`}
              style={active ? { background: "var(--apex-accent-bright)" } : undefined}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>
      {tab === "chat" ? <CareTeamChatPanel /> : <CareTeamDocumentsPanel />}
    </div>
  );
}
