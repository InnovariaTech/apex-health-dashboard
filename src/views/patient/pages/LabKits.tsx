// @ts-nocheck
import { useMemo } from "react";
import { Truck, BarChart3, ShoppingCart } from "lucide-react";
import { useAuthUser } from "@/hooks/auth/useAuth";

/**
 * Lab Kits — verbatim port of `New Ui/8 Lab Kits/apex-lab-kits` mockup.
 * Static catalog page: 6 at-home diagnostic kits with hero image, eyebrow,
 * title, description, two ghost action buttons, and a red Purchase button
 * with the price right-aligned.
 *
 * No backend wiring — this is the same demo dataset the mockup ships with.
 * The previous Tasso-backed implementation (kit status timeline + test
 * results drawer) still lives on disk at:
 *   - src/views/patient/components/lab-kits/KitStatusTimeline.tsx
 *   - src/views/patient/components/lab-kits/TassoNotLinkedBanner.tsx
 *   - src/views/patient/components/lab-kits/TestResultDetailDrawer.tsx
 *   - src/hooks/tasso/usePatientTasso.ts
 * Re-import and route to those once the catalog gets a "My kits" peer tab.
 */

const MOCKUP = {
  ink: "#15171a",
  inkSoft: "#3a3d44",
  muted: "#6b7177",
  faint: "#9aa0a6",
  accent: "#E11816",
  accentDark: "#B70402",
  line: "#e9e7e2",
  lineSoft: "#f0eee9",
  card: "#ffffff",
} as const;

interface KitDef {
  key: string;
  image: string;
  eyebrow: string;
  title: string;
  desc: string;
  price: string;
}

const KITS: KitDef[] = [
  {
    key: "blood",
    image: "/lab-kits/blood.jpg",
    eyebrow: "100+ biomarkers",
    title: "Comprehensive Blood Work",
    desc:
      "A full read on metabolic health, cardiovascular risk, hormones, thyroid, inflammation, and organ function — the complete picture of how your body is working right now. Drawn at home, reviewed by your physician.",
    price: "from $249",
  },
  {
    key: "genetics",
    image: "/lab-kits/genetics.jpg",
    eyebrow: "DNA insights",
    title: "Genetics Testing",
    desc:
      "Your DNA reveals how you metabolize nutrients, medications, and caffeine, your predisposition to certain conditions, and the supplement and lifestyle strategies most likely to work for your unique makeup.",
    price: "$399",
  },
  {
    key: "bioage",
    image: "/lab-kits/bioage.jpg",
    eyebrow: "Cellular age",
    title: "Biological Age Test",
    desc:
      "Your age is just a number. We measure how old your cells actually are using epigenetic and biomarker analysis, then track it over time to prove your protocol is making you biologically younger.",
    price: "$399",
  },
  {
    key: "microbiome",
    image: "/lab-kits/microbiome.jpg",
    eyebrow: "Gut health",
    title: "Microbiome Testing",
    desc:
      "A deep look at your gut — bacterial diversity, intestinal permeability, digestion and absorption, inflammation, and SIBO — the foundation of your immunity, mood, metabolism, and overall health.",
    price: "$399",
  },
  {
    key: "micronutrient",
    image: "/lab-kits/micronutrient.jpg",
    eyebrow: "Vitamins & minerals",
    title: "Micronutrient Testing",
    desc:
      "We measure the vitamins, minerals, antioxidants, amino acids, and omega-3/6 fatty acids inside your cells — pinpointing exactly what your body is missing so supplementation is precise, not guesswork.",
    price: "$399",
  },
  {
    key: "foodsens",
    image: "/lab-kits/foodsens.jpg",
    eyebrow: "Trigger foods",
    title: "Food Sensitivity Test",
    desc:
      "Identifies the foods quietly triggering inflammation, bloating, fatigue, and skin or gut issues — so your nutrition plan is built around what fuels you and free of what holds you back.",
    price: "$399",
  },
];

function deriveMember(user) {
  const emailPrefix = (user?.email ?? "").split("@")[0] || "Member";
  const name = (user?.full_name && user.full_name.trim()) || emailPrefix;
  const initials = name
    .split(/\s+/)
    .map((p) => p?.[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const parts = [];
  if (user?.role) {
    parts.push(String(user.role).replace(/^\w/, (c) => c.toUpperCase()));
  }
  if (user?.email) parts.push(user.email);
  return {
    name,
    initials: initials || "M",
    meta: parts.join(" · "),
  };
}

export default function LabKits() {
  const { data: user } = useAuthUser();
  const member = useMemo(() => deriveMember(user), [user]);

  return (
    <div
      style={{
        background: "#ffffff",
        color: MOCKUP.ink,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 15,
        lineHeight: 1.5,
      }}
      className="min-h-screen"
    >
      <div
        style={{
          padding: "34px 40px 64px",
          maxWidth: 1320,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Breadcrumb */}
        <div
          className="flex items-center mb-6"
          style={{
            gap: 8,
            fontSize: 14,
            color: MOCKUP.muted,
            fontWeight: 500,
          }}
        >
          <span>Apex MD</span>
          <span style={{ color: MOCKUP.faint }}>›</span>
          <span style={{ color: MOCKUP.ink, fontWeight: 600 }}>Lab Kits</span>
        </div>

        {/* Page head */}
        <div
          className="flex flex-wrap items-start justify-between"
          style={{ gap: 24, marginBottom: 30 }}
        >
          <div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 800,
                letterSpacing: "-1.8px",
                lineHeight: 1.02,
                color: MOCKUP.ink,
              }}
            >
              Lab{" "}
              <em
                style={{
                  fontStyle: "italic",
                  fontWeight: 800,
                  color: MOCKUP.accent,
                }}
              >
                kits
              </em>
            </h1>
            <p
              style={{
                marginTop: 11,
                color: MOCKUP.muted,
                fontSize: 15,
                maxWidth: 560,
              }}
            >
              Physician-reviewed at-home diagnostics. Collect your sample at
              home, we handle the lab and read every result back to you.
            </p>
          </div>
          <MemberChip member={member} />
        </div>

        {/* Kit grid */}
        <section
          className="grid items-stretch"
          style={{
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 22,
          }}
        >
          {KITS.map((k) => (
            <KitCard key={k.key} kit={k} />
          ))}
        </section>
      </div>
    </div>
  );
}

function MemberChip({ member }) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: 12,
        background: "#fff",
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 14,
        padding: "9px 16px 9px 10px",
        flex: "0 0 auto",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#2a2d33,#15171a)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "0.5px",
        }}
      >
        {member.initials}
      </div>
      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: MOCKUP.ink,
            lineHeight: 1.25,
          }}
        >
          {member.name}
        </div>
        {member.meta && (
          <div
            style={{
              fontFamily:
                "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
              fontSize: 11,
              color: MOCKUP.faint,
              letterSpacing: "0.02em",
            }}
          >
            {member.meta}
          </div>
        )}
      </div>
    </div>
  );
}

function KitCard({ kit }: { kit: KitDef }) {
  return (
    <article
      className="flex flex-col overflow-hidden transition-all"
      style={{
        background: MOCKUP.card,
        border: `1px solid ${MOCKUP.line}`,
        borderRadius: 20,
        boxShadow: "0 1px 2px rgba(20,23,26,.03)",
      }}
    >
      <div style={{ background: "#0c0d0f", lineHeight: 0 }}>
        <img
          src={kit.image}
          alt={kit.title}
          loading="lazy"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      <div
        className="flex flex-col flex-1"
        style={{ padding: "22px 24px 24px" }}
      >
        <div
          className="uppercase"
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: MOCKUP.accent,
            marginBottom: 8,
          }}
        >
          {kit.eyebrow}
        </div>
        <h3
          style={{
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: MOCKUP.ink,
            marginBottom: 9,
          }}
        >
          {kit.title}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: MOCKUP.muted,
            lineHeight: 1.55,
            marginBottom: 20,
            flex: 1,
          }}
        >
          {kit.desc}
        </p>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <GhostBtn icon={<Truck className="w-4 h-4" strokeWidth={2} />}>
            Track my test
          </GhostBtn>
          <GhostBtn icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}>
            See my results
          </GhostBtn>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center w-full cursor-pointer transition-colors"
          style={{
            background: MOCKUP.accent,
            color: "#fff",
            border: "none",
            borderRadius: 11,
            padding: "13px 16px",
            fontSize: 14.5,
            fontWeight: 600,
            gap: 8,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = MOCKUP.accentDark)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = MOCKUP.accent)
          }
        >
          <ShoppingCart className="w-4 h-4" strokeWidth={2} />
          Purchase
          <span
            style={{
              fontFamily:
                "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
              fontWeight: 600,
              marginLeft: 4,
              paddingLeft: 10,
              borderLeft: "1px solid rgba(255,255,255,.32)",
            }}
          >
            {kit.price}
          </span>
        </button>
      </div>
    </article>
  );
}

function GhostBtn({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center cursor-pointer transition-colors"
      style={{
        background: "#fff",
        border: `1px solid ${MOCKUP.line}`,
        color: MOCKUP.inkSoft,
        borderRadius: 11,
        padding: "11px 14px",
        fontSize: 13.5,
        fontWeight: 600,
        gap: 8,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f6f5f1";
        e.currentTarget.style.borderColor = "#d9d6cf";
        e.currentTarget.style.color = MOCKUP.ink;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
        e.currentTarget.style.borderColor = MOCKUP.line;
        e.currentTarget.style.color = MOCKUP.inkSoft;
      }}
    >
      {icon}
      {children}
    </button>
  );
}
