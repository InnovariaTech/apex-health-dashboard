import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ACC } from "@/data/shop/apexShopCatalog";
import { useShopCatalog } from "@/hooks/shop/useShopCatalog";
import type {
  AccentKey,
  ShopProduct,
  ShopSection,
  ShopTab,
  TabIconKey,
} from "@/types/shop/liveCatalog_types";
import "./apexShop.css";

/**
 * Shop — ported from the `apex-md-shop` New UI demo. Renders the tabbed
 * catalog (Medical / Supplements / Concierge Program / Fitness Programs /
 * Training) with the demo's card design and assets (`public/shop/apex-md-shop`).
 *
 * Every purchasable product's "Shop" link / CTA is wired to `product.externalUrl`
 * and opens in a new tab. When the URL is empty the control renders inert
 * (dimmed, non-clickable) until the real store link is supplied.
 */

export default function Shop() {
  const { data: tabs = [], isLoading, isError, refetch, isFetching } = useShopCatalog();
  const [activeTab, setActiveTab] = useState<string>("");

  // The catalog is fetched, so the active tab can't reference a hard-coded
  // first tab — fall back to the first one the server returned.
  const activeId = activeTab || tabs[0]?.id || "";

  return (
    <div className="apex-shop p-4 md:p-9 max-w-[1640px] mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="shop-eyebrow">Shop</div>
      <h1 className="shop-title">
        Apex MD <em>shop</em>
      </h1>
      <p className="shop-sub">
        Clinical programs, supplements, memberships, and personal training —
        everything in one place.
      </p>

      <div className="shop-head-rule" />

      {isLoading ? (
        <ShopState kind="loading" />
      ) : isError ? (
        <ShopState kind="error" onRetry={() => refetch()} busy={isFetching} />
      ) : tabs.length === 0 ? (
        <ShopState kind="empty" />
      ) : (
        <>
          {/* Tabs */}
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeId === t.id}
                className={`tab${activeId === t.id ? " active" : ""}`}
                onClick={() => {
                  setActiveTab(t.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <TabIcon name={t.icon} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Panels */}
          {tabs.map((t) => (
            <div key={t.id} className={`panel${activeId === t.id ? " active" : ""}`}>
              {activeId === t.id ? <TabPanel tab={t} /> : null}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Loading / empty / error states ────────────────────────────────────────

function ShopState({
  kind,
  onRetry,
  busy,
}: {
  kind: "loading" | "empty" | "error";
  onRetry?: () => void;
  busy?: boolean;
}) {
  if (kind === "loading") {
    return (
      <div className="shop-state" role="status" aria-live="polite">
        <span className="shop-spinner" aria-hidden="true" />
        <p className="shop-state-title">Loading the shop…</p>
      </div>
    );
  }
  if (kind === "empty") {
    return (
      <div className="shop-state">
        <p className="shop-state-title">The shop is being updated</p>
        <p className="shop-state-sub">
          New products are on their way — check back soon.
        </p>
      </div>
    );
  }
  return (
    <div className="shop-state">
      <p className="shop-state-title">We couldn’t load the shop</p>
      <p className="shop-state-sub">
        Something went wrong reaching the store. Please try again.
      </p>
      {onRetry ? (
        <button type="button" className="shop-retry" onClick={onRetry} disabled={busy}>
          {busy ? "Retrying…" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}

// ─── Tab panel (pills + sections) ──────────────────────────────────────────

function TabPanel({ tab }: { tab: ShopTab }) {
  const [activePill, setActivePill] = useState<string>(
    tab.pills?.[0]?.sec ?? "",
  );

  // Scroll-spy: highlight the pill for whichever section is in view.
  useEffect(() => {
    if (!tab.pills) return;
    const ids = tab.sections.map((s) => `sec-${s.id}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActivePill(e.target.id.replace(/^sec-/, ""));
          }
        });
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [tab]);

  const onPill = (sec: string) => {
    setActivePill(sec);
    const el = document.getElementById(`sec-${sec}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {tab.pills ? (
        <div className="pills">
          {tab.pills.map((p, i) => (
            <button
              key={`${p.label}-${i}`}
              type="button"
              className={`pill${activePill === p.sec ? " active" : ""}`}
              onClick={() => onPill(p.sec)}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}

      {tab.sections.map((s) => (
        <Section key={s.id} section={s} planIcon={tab.planIcon} />
      ))}
    </>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────

function Section({
  section: s,
  planIcon,
}: {
  section: ShopSection;
  planIcon?: ShopTab["planIcon"];
}) {
  const acc = ACC[s.accent];
  return (
    <section
      className="cat"
      id={`sec-${s.id}`}
      style={{ ["--acc" as string]: acc }}
    >
      <div className="cat-bar" />
      <div className="cat-head">
        <div>
          <span className="cat-badge" style={{ background: acc }}>
            {s.badge}
          </span>
          <h2 className="cat-title">{s.title}</h2>
          <p
            className="cat-sub"
            dangerouslySetInnerHTML={{ __html: s.sub }}
          />
        </div>
        {s.action ? (
          <ExternalControl
            url={s.actionUrl ?? ""}
            className="quiz-btn"
            title={s.action}
          >
            {s.action} <ExtIcon />
          </ExternalControl>
        ) : null}
      </div>
      <div className="grid">
        {s.products.map((p, i) => (
          <Card
            key={`${p.name ?? "card"}-${i}`}
            product={p}
            accent={s.accent}
            planIcon={planIcon}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

function Card({
  product: p,
  accent,
  planIcon,
}: {
  product: ShopProduct;
  accent: AccentKey;
  planIcon?: ShopTab["planIcon"];
}) {
  // Intro card (HRT "Don't know what you want?")
  if (p.type === "intro") {
    return (
      <article className="card intro-card">
        <div className="prod-img prod-img--photo">
          <img className="prod-fill fill-cover" src={p.img} alt="" />
        </div>
        <div className="card-body">
          <h4 className="intro-title">
            {p.lead}
            <br />
            <span className="intro-accent">{p.lead2}</span>
          </h4>
          <span className="intro-rule" />
          <p className="pdesc">{p.desc}</p>
          <div className="card-foot">
            <ExternalControl
              url={p.externalUrl}
              className="cta-btn intro-btn"
              title={p.cta ?? "Get Started"}
            >
              {p.cta} <ArrowIcon />
            </ExternalControl>
          </div>
        </div>
      </article>
    );
  }

  const poster = p.fit === "poster";
  const hasImg = Boolean(p.img);
  const imgCls =
    "prod-img" +
    (hasImg ? " prod-img--photo" : "") +
    (poster ? " prod-img--poster" : "");

  const badge = p.badge ? (
    <span className={`pbadge pbadge--${p.badge.color}`}>{p.badge.text}</span>
  ) : null;

  const clickable = Boolean(p.clickable);
  const asLink = clickable && Boolean(p.externalUrl);

  const inner = (
    <>
      <div
        className={imgCls}
        style={hasImg ? { background: p.tile || "#ececea" } : undefined}
      >
        {hasImg ? (
          <img
            className={`prod-fill${p.fit === "cover" ? " fill-cover" : ""}${poster ? " fill-poster" : ""}`}
            src={p.img}
            alt={p.name ?? ""}
          />
        ) : (
          <div className="plan-mark" style={{ background: ACC[accent] }}>
            <PlanIcon name={planIcon ?? "programs"} />
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-top">
          <h4 className="pname">
            {p.name}
            {p.topPrice ? ` - ${p.topPrice}` : ""}
          </h4>
          {badge}
        </div>
        {p.topNote ? (
          <div
            style={{
              fontWeight: 500,
              fontSize: 12,
              color: "var(--shop-ink-3)",
              letterSpacing: 0,
              marginTop: 2,
            }}
          >
            {p.topNote}
          </div>
        ) : null}
        <p className="pdesc">{p.desc}</p>

        {p.features ? <ReadMore features={p.features} /> : null}

        {/* Footer */}
        {p.soon ? (
          <div className="card-foot soon">
            <span className="soon-date">
              <CalIcon /> {p.soon}
            </span>
          </div>
        ) : p.cta ? (
          <div className="card-foot">
            <ExternalControl
              url={p.externalUrl}
              className="cta-btn"
              title={p.cta}
            >
              {p.cta}
            </ExternalControl>
          </div>
        ) : (
          <div className="card-foot">
            <div className="price">
              {p.price}
              {p.per ? <span className="per">{p.per}</span> : null}
            </div>
            {clickable ? null : (
              <ExternalControl
                url={p.externalUrl}
                className="shop-link"
                title={`Shop ${p.name ?? ""}`.trim()}
              >
                Shop <ExtIcon />
              </ExternalControl>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (asLink) {
    return (
      <a
        className={`card card-clickable${p.soon ? " is-soon" : ""}`}
        href={p.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }

  return (
    <article
      className={`card${clickable ? " card-clickable" : ""}${p.soon ? " is-soon" : ""}`}
      aria-disabled={clickable ? true : undefined}
    >
      {inner}
    </article>
  );
}

// ─── Read-more (collapsible feature list) ──────────────────────────────────

function ReadMore({
  features,
}: {
  features: NonNullable<ShopProduct["features"]>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.maxHeight = open ? `${el.scrollHeight}px` : "0px";
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="readmore-btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="rm-label">{open ? "Hide Details" : "See Details"}</span>
        <svg className="rm-chev" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div ref={wrapRef} className={`readmore-wrap${open ? " open" : ""}`}>
        <div style={{ margin: "2px 0 4px" }}>
          {features.map((f, i) => (
            <div className="feat-row" key={i}>
              <div>
                <div
                  className="feat-name"
                  dangerouslySetInnerHTML={{ __html: f.name }}
                />
                <div className="feat-desc">{f.desc}</div>
              </div>
              <span
                className="feat-mark"
                style={{
                  color:
                    f.inc === false ? "var(--shop-ink-3)" : "var(--shop-ink)",
                }}
              >
                {f.inc === false ? "—" : "✓"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── External-link control (link when url set, inert when empty) ────────────

function ExternalControl({
  url,
  className,
  title,
  children,
}: {
  url: string;
  className: string;
  title: string;
  children: React.ReactNode;
}) {
  if (url) {
    return (
      <a
        className={className}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
      >
        {children}
      </a>
    );
  }
  return (
    <span
      className={`${className} is-disabled`}
      aria-disabled="true"
      title="Link coming soon"
    >
      {children}
    </span>
  );
}

// ─── Icons (ported from the demo's app.js) ─────────────────────────────────

function TabIcon({ name }: { name: TabIconKey }) {
  const paths: Record<TabIconKey, React.ReactNode> = {
    medical: (
      <>
        <rect x="8.3" y="2.5" width="7.4" height="3.4" rx="1.3" />
        <path d="M9.3 5.9v1.3l-1.1 1.1A2 2 0 0 0 7.6 9.7V19a2 2 0 0 0 2 2h4.8a2 2 0 0 0 2-2V9.7a2 2 0 0 0-.6-1.4l-1.1-1.1V5.9" />
        <path d="M12 12.3v4M10 14.3h4" />
      </>
    ),
    supplements: (
      <>
        <path d="M10.5 20.5a6 6 0 0 1-8.5-8.5l7-7a6 6 0 0 1 8.5 8.5z" />
        <path d="M8.5 8.5l7 7" />
      </>
    ),
    memberships: (
      <>
        <circle cx="12" cy="6" r="3.3" />
        <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
        <path d="M9.2 12.4v2.1a2.8 2.8 0 0 0 5.6 0v-1" />
        <circle cx="16.8" cy="14" r="1.4" />
      </>
    ),
    programs: (
      <>
        <path d="M4 19h12.5a1.5 1.5 0 0 0 1.5-1.5V7.5a2.5 2.5 0 0 0-5 0V10a4.5 4.5 0 0 1-4.5 4.5H4Z" />
        <path d="M4 14.5c0-3 2-5.5 5-5.5" />
        <path d="M13.5 7.5v-2M16 7.5v-2" />
      </>
    ),
    training: <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />,
  };
  return <svg viewBox="0 0 24 24">{paths[name]}</svg>;
}

function PlanIcon({ name }: { name: NonNullable<ShopTab["planIcon"]> }) {
  return <TabIcon name={name} />;
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

function ExtIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
