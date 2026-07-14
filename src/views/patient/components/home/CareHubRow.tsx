import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowRight,
  CheckSquare,
  Loader2,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { useThreads } from "@/hooks/trainerize/useMessaging";
import { useTrainerizeLink } from "@/hooks/trainerize/useLinkage";
import { useTrainerizeProfile } from "@/hooks/trainerize/useLinkage";
import {
  getThreadDisplayName,
  readThreadPreview,
  readThreadUpdatedAt,
  readThreadUnreadCount,
} from "@/types/trainerize/messaging_types";
import shopCatalog from "@/data/shop/apexmdCatalog.json";
import type { ShopCatalog } from "@/types/shop/catalog_types";
import {
  useDashboardTasks,
  type DashboardTask,
  type DashboardTaskTone,
} from "@/views/patient/hooks/useDashboardTasks";
import { createPageUrl } from "@/utils";

/**
 * "Care hub" 3-column row matching the New Ui mockup — Messages / Upcoming
 * tasks / Store. Each card is self-contained so a card with no data shows
 * an empty state instead of disappearing.
 *
 * - Messages pull from Trainerize threads (live patient↔trainer DMs).
 * - Tasks are placeholder until a tasks endpoint exists (see CLAUDE notes).
 * - Store picks 3 items from the static `apexmdCatalog.json` shipped with
 *   the Shop page.
 */
export default function CareHubRow() {
  const linkQuery = useTrainerizeLink();
  const linked = !!linkQuery.data;

  // Aggregate "Care hub" eyebrow counts come from the children.
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="apex-section-title">Care hub</h2>
        </div>
        <Link
          to={createPageUrl("Chat")}
          className="font-mono text-[12px] text-[var(--opt-d)] hover:text-[var(--opt)] inline-flex items-center gap-1.5"
        >
          Message care team
          <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.4fr] gap-4">
        <MessagesCard linked={linked} />
        <UpcomingTasksCard />
        <StoreFeaturedCard />
      </div>
    </div>
  );
}

// ─── Messages ────────────────────────────────────────────────────────────

function MessagesCard({ linked }: { linked: boolean }) {
  const threadsQuery = useThreads("inbox", 0, 5);
  const profileQuery = useTrainerizeProfile();
  const selfId = useMemo(() => {
    const id = (profileQuery.data as { id?: number; userID?: number } | null)?.id;
    return typeof id === "number" ? id : undefined;
  }, [profileQuery.data]);

  const items = useMemo(() => {
    const list = (threadsQuery.data as { items?: unknown[]; threads?: unknown[] } | undefined);
    const raw = (list?.items ?? list?.threads ?? []) as unknown[];
    return raw.slice(0, 2);
  }, [threadsQuery.data]);

  const unreadTotal = useMemo<number>(
    () =>
      items.reduce<number>(
        (sum, t) => sum + readThreadUnreadCount(t as never),
        0,
      ),
    [items],
  );

  return (
    <CareCard
      icon={<MessageSquare className="w-5 h-5" strokeWidth={1.9} />}
      iconBg="var(--info-soft)"
      iconColor="var(--info)"
      title="Messages"
      badge={unreadTotal > 0 ? `${unreadTotal} new` : "Inbox"}
      badgeAlert={unreadTotal > 0}
      footHref={createPageUrl("TrainerChat")}
      footLabel="Open Inbox"
      footAccent
    >
      {!linked && !threadsQuery.isLoading ? (
        <EmptyText>Link a trainer to start a conversation.</EmptyText>
      ) : threadsQuery.isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyText>No messages yet.</EmptyText>
      ) : (
        <ul className="flex flex-col">
          {items.map((thread, i) => {
            const name = getThreadDisplayName(thread as never, selfId);
            const preview = readThreadPreview(thread as never) ?? "";
            const updatedAt = readThreadUpdatedAt(thread as never);
            const hasUnread = readThreadUnreadCount(thread as never) > 0;
            return (
              <li
                key={i}
                className="flex gap-3 items-start py-2.5 border-t border-[var(--line)] first:border-t-0 first:pt-0"
              >
                <div className="w-[31px] h-[31px] rounded-[9px] grid place-items-center text-[11px] font-bold text-white shrink-0 bg-gradient-to-br from-[var(--opt)] to-[var(--opt-d)]">
                  {name
                    .split(/\s+/)
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold flex items-center gap-1.5">
                    <span className="truncate">{name}</span>
                    {hasUnread && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "var(--apex-accent)" }}
                      />
                    )}
                    <span className="ml-auto font-mono text-[10.5px] text-mute font-normal shrink-0">
                      {updatedAt
                        ? formatDistanceToNowStrict(new Date(updatedAt), {
                            addSuffix: false,
                          }).replace(/ (minute|hour|day|week|month|year)s?/, (_, w) => {
                            // 1 hour -> 1h, 3 days -> 3d.
                            const map: Record<string, string> = {
                              minute: "m",
                              hour: "h",
                              day: "d",
                              week: "w",
                              month: "mo",
                              year: "y",
                            };
                            return map[w] ?? w;
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-ink-2 truncate mt-0.5">
                    {preview}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CareCard>
  );
}

// ─── Upcoming tasks (derived from existing data) ─────────────────────────

function UpcomingTasksCard() {
  const { tasks, isLoading } = useDashboardTasks();
  const badge = isLoading ? "—" : tasks.length === 0 ? "All clear" : `${tasks.length} due`;

  return (
    <CareCard
      icon={<CheckSquare className="w-5 h-5" strokeWidth={1.9} />}
      iconBg="var(--bord-soft)"
      iconColor="var(--bord-d)"
      title="Upcoming tasks"
      badge={badge}
      footHref={createPageUrl("Appointments")}
      footLabel="View calendar"
      footAccent
    >
      {isLoading ? (
        <Loading />
      ) : tasks.length === 0 ? (
        <EmptyText>
          Nothing due in the next 7 days. Your weekly weight log is in.
        </EmptyText>
      ) : (
        <ul className="flex flex-col">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 py-2.5 border-t border-[var(--line)] first:border-t-0 first:pt-0"
            >
              <span className="w-[17px] h-[17px] rounded-full border-2 border-[#CBD2C9] shrink-0" />
              <Link
                to={t.href}
                className="text-[13px] font-medium flex-1 truncate text-foreground hover:underline"
                title={t.label}
              >
                {t.label}
              </Link>
              <DueChip tone={t.tone}>{t.dueLabel}</DueChip>
            </li>
          ))}
        </ul>
      )}
    </CareCard>
  );
}

function DueChip({
  tone,
  children,
}: {
  tone: DashboardTaskTone;
  children: React.ReactNode;
}) {
  const styles: Record<DashboardTaskTone, { bg: string; color: string; border: string }> = {
    today: {
      bg: "var(--opt-soft)",
      color: "var(--opt-d)",
      border: "transparent",
    },
    soon: {
      bg: "var(--bord-soft)",
      color: "var(--bord-d)",
      border: "transparent",
    },
    normal: {
      bg: "var(--background)",
      color: "var(--ink-2)",
      border: "var(--border)",
    },
  };
  const s = styles[tone];
  return (
    <span
      className="font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded-md border shrink-0"
      style={{
        background: s.bg,
        color: s.color,
        borderColor: s.border === "transparent" ? "transparent" : "hsl(var(--border))",
      }}
    >
      {children}
    </span>
  );
}

// Quiet unused type re-export so a future caller doesn't lose the symbol.
export type { DashboardTask };

// ─── Store thumbnail ─────────────────────────────────────────────────────

/**
 * Renders the product image when the catalog row carries one. Falls back
 * to a tinted initials chip — memberships in `apexmdCatalog.json` ship
 * without imagery, so we use their `headerBg` color and the first letter.
 *
 * `object-contain` + center alignment so the catalog's transparent PNGs
 * (medical products are shot on white) don't get cropped weird.
 */
function StoreThumb({ item }: { item: FeaturedItem }) {
  if (item.image) {
    return (
      <div className="w-[60px] h-[60px] rounded-[10px] border border-border bg-secondary overflow-hidden shrink-0 grid place-items-center p-1">
        <img
          src={item.image}
          alt=""
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  const initial = item.name.charAt(0).toUpperCase();
  return (
    <div
      className="w-[60px] h-[60px] rounded-[10px] border border-border shrink-0 grid place-items-center font-bold text-[18px] text-foreground"
      style={{ background: item.fallbackBg ?? "var(--secondary)" }}
    >
      {initial}
    </div>
  );
}

// ─── Store featured ──────────────────────────────────────────────────────

const catalog = shopCatalog as ShopCatalog;

interface FeaturedItem {
  id: string;
  name: string;
  offer: string;
  price: string;
  /** Catalog image URL — undefined for items that ship without one (memberships). */
  image?: string;
  /** Fallback color used when there's no image — pulled from the catalog row. */
  fallbackBg?: string;
}

function StoreFeaturedCard() {
  const featured = useMemo<FeaturedItem[]>(() => {
    // Mockup-curated featured trio: NAD+, Omega 3, Concierge Care.
    // Names/prices match the dashboard mockup verbatim; existence is verified
    // against the catalog so the tile silently drops a slot if a row gets
    // renamed upstream rather than rendering a ghost entry.
    const items: FeaturedItem[] = [];

    const nad = catalog.medicalCategories
      ?.flatMap((c) => c.sections ?? [])
      .flatMap((s) => s.products ?? [])
      .find((p) => p.name.trim() === "NAD+ Injection");
    if (nad) {
      items.push({
        id: "feat-nad",
        name: "NAD+",
        offer: "$100 off first month",
        price: "$149",
        image: "/shop/dashboard-store/nad-plus.jpg",
      });
    }

    const omega = catalog.supplements?.find((s) => s.name.trim() === "Omega 3");
    if (omega) {
      items.push({
        id: "feat-omega3",
        name: "Omega 3",
        offer: "20% off Apex MD Supplements",
        price: "See Pricing",
        image: "/shop/dashboard-store/omega-3.jpg",
      });
    }

    const concierge = catalog.memberships?.find(
      (m) => m.name.trim() === "Concierge Care",
    );
    if (concierge) {
      items.push({
        id: "feat-concierge",
        name: "Concierge Care",
        offer: "Apex MD Concierge Medicine",
        price: `from $${concierge.price}/month`,
        image: "/shop/dashboard-store/concierge-care.jpg",
      });
    }

    return items.slice(0, 3);
  }, []);

  return (
    <CareCard
      icon={<ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.9} />}
      iconBg="var(--apex-accent-soft)"
      iconColor="var(--apex-accent-bright)"
      title="Store"
      badge="Featured"
      badgeAlert
      footHref={createPageUrl("Shop")}
      footLabel="Browse store"
    >
      <ul className="flex flex-col">
        {featured.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 py-2.5 border-t border-[var(--line)] first:border-t-0 first:pt-0"
          >
            <StoreThumb item={p} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-tight text-foreground truncate">
                {p.name}
              </p>
              <p className="text-[12px] text-ink-2 truncate mt-0.5">{p.offer}</p>
            </div>
            <span className="font-bold text-[14px] leading-tight text-foreground whitespace-nowrap">
              {p.price}
            </span>
          </li>
        ))}
      </ul>
    </CareCard>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────

interface CareCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  badge: string;
  badgeAlert?: boolean;
  /** Force the footer link to the red accent regardless of `badgeAlert`. */
  footAccent?: boolean;
  footHref: string;
  footLabel: string;
  children: React.ReactNode;
}

function CareCard({
  icon,
  iconBg,
  iconColor,
  title,
  badge,
  badgeAlert,
  footAccent,
  footHref,
  footLabel,
  children,
}: CareCardProps) {
  const footRed = footAccent || badgeAlert;
  return (
    <div className="apex-card p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <span className="text-[14.5px] font-bold tracking-[-0.01em] whitespace-nowrap text-foreground">
          {title}
        </span>
        <span
          className="ml-auto font-mono text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap shrink-0"
          style={{
            background: badgeAlert ? "var(--apex-accent-soft)" : "var(--opt-soft)",
            color: badgeAlert ? "var(--apex-accent-bright)" : "var(--opt-d)",
          }}
        >
          {badge}
        </span>
      </div>
      <div className="flex-1">{children}</div>
      <Link
        to={footHref}
        className="mt-4 font-mono text-[11.5px] font-medium inline-flex items-center gap-1.5"
        style={{ color: footRed ? "var(--apex-accent-bright)" : "var(--opt-d)" }}
      >
        {footLabel}
        <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
      </Link>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-[12.5px] text-ink-2 py-2">{children}</p>;
}

function Loading() {
  return (
    <div className="py-4 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-mute" />
    </div>
  );
}
