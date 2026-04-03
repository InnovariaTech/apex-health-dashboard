import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users, ShoppingCart, DollarSign, TrendingUp, MousePointerClick,
  Eye, UserPlus, Package, BarChart3, ArrowUpRight, ArrowDownRight,
  Globe, Activity, Percent, Repeat, ExternalLink
} from "lucide-react";
import { format, startOfMonth } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ── Mock iDevAffiliate + sales data ──────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: "Oct", revenue: 18400, orders: 61, newUsers: 14 },
  { month: "Nov", revenue: 22100, orders: 74, newUsers: 19 },
  { month: "Dec", revenue: 27800, orders: 93, newUsers: 28 },
  { month: "Jan", revenue: 24300, orders: 81, newUsers: 22 },
  { month: "Feb", revenue: 31200, orders: 104, newUsers: 35 },
  { month: "Mar", revenue: 38700, orders: 129, newUsers: 47 },
];

const AFFILIATE_TRAFFIC = [
  { week: "W1", clicks: 840, conversions: 38, revenue: 4200 },
  { week: "W2", clicks: 1120, conversions: 54, revenue: 5940 },
  { week: "W3", clicks: 980, conversions: 41, revenue: 4510 },
  { week: "W4", clicks: 1350, conversions: 67, revenue: 7370 },
];

const TOP_AFFILIATES = [
  { name: "Coach Martinez", id: "AFF-1041", clicks: 1842, conversions: 89, commission: 2670, status: "active" },
  { name: "FitLife Media", id: "AFF-2033", clicks: 1540, conversions: 71, commission: 2130, status: "active" },
  { name: "Dr. Thompson", id: "AFF-3017", clicks: 920, conversions: 44, commission: 1320, status: "active" },
  { name: "Apex Podcasts", id: "AFF-4008", clicks: 610, conversions: 28, commission: 840, status: "active" },
  { name: "WellnessTalk", id: "AFF-5022", clicks: 430, conversions: 15, commission: 450, status: "paused" },
];

const TOP_PRODUCTS = [
  { name: "Compounded Semaglutide", category: "Weight Loss", units: 142, revenue: 42458, growth: 18 },
  { name: "TRT Injection", category: "TRT", units: 98, revenue: 19502, growth: 12 },
  { name: "CJC-1295 / Ipamorelin", category: "Peptides", units: 74, revenue: 18426, growth: 9 },
  { name: "Elite Whey Protein", category: "Supplements", units: 210, revenue: 12390, growth: 22 },
  { name: "8-Week Shred Program", category: "Programs", units: 61, revenue: 7869, growth: 31 },
];

const STAT_CARDS = [
  { label: "Monthly Revenue", value: "$38,700", change: "+24%", up: true, icon: DollarSign, color: "bg-emerald-500" },
  { label: "Total Members", value: "1,284", change: "+47 this month", up: true, icon: Users, color: "bg-blue-500" },
  { label: "Orders This Month", value: "129", change: "+25 vs last month", up: true, icon: ShoppingCart, color: "bg-violet-500" },
  { label: "Affiliate Clicks", value: "5,342", change: "+12% this week", up: true, icon: MousePointerClick, color: "bg-orange-500" },
  { label: "Conversion Rate", value: "4.8%", change: "-0.3% vs last month", up: false, icon: Percent, color: "bg-rose-500" },
  { label: "Affiliate Revenue", value: "$17,370", change: "+18% MoM", up: true, icon: ExternalLink, color: "bg-cyan-500" },
  { label: "Page Views", value: "28,940", change: "+9% this week", up: true, icon: Eye, color: "bg-amber-500" },
  { label: "Returning Users", value: "63%", change: "+5% vs last month", up: true, icon: Repeat, color: "bg-indigo-500" },
];

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const user = await api.auth.me();
    setCurrentUser(user);
    const [allUsers, allOrders] = await Promise.all([
      api.entities.User.list(),
      api.entities.Order.list("-created_date"),
    ]);
    setClients(allUsers.filter(u => u.role !== "admin"));
    setOrders(allOrders);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {currentUser?.full_name?.split(" ")[0]} · {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 font-bold border border-amber-300 text-xs px-3 py-1">
          iDevAffiliate: Connected (Mock)
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, change, up, icon: Icon, color }) => (
          <Card key={label} className="border border-border hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-rose-500"}`}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue & Orders (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => name === "revenue" ? `$${val.toLocaleString()}` : val} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={false} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Affiliate traffic */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-orange-500" /> Affiliate Traffic (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={AFFILIATE_TRAFFIC}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" fill="#f97316" name="Clicks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="#6366f1" name="Conversions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Affiliates + Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Affiliates */}
        <Card className="border border-border">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-500" /> Top Affiliates</span>
              <span className="text-xs text-muted-foreground font-normal">iDevAffiliate data (mock)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 text-xs font-bold text-muted-foreground uppercase">Affiliate</th>
                  <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase">Clicks</th>
                  <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase">Conv.</th>
                  <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase">Commission</th>
                </tr>
              </thead>
              <tbody>
                {TOP_AFFILIATES.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.id}</p>
                    </td>
                    <td className="p-3 text-right font-medium">{a.clicks.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{a.conversions}</td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-emerald-600">${a.commission.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border border-border">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-violet-500" /> Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left p-3 text-xs font-bold text-muted-foreground uppercase">Product</th>
                  <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase">Units</th>
                  <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase">Revenue</th>
                  <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase">Growth</th>
                </tr>
              </thead>
              <tbody>
                {TOP_PRODUCTS.map((p) => (
                  <tr key={p.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </td>
                    <td className="p-3 text-right font-medium">{p.units}</td>
                    <td className="p-3 text-right font-bold">${p.revenue.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className="text-emerald-600 font-bold flex items-center justify-end gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />+{p.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { page: "Clients", icon: Users, label: "Manage Clients", color: "bg-blue-500" },
            { page: "AdminMarketplace", icon: ShoppingCart, label: "Manage Store", color: "bg-violet-500" },
            { page: "Programs", icon: Activity, label: "Manage Programs", color: "bg-emerald-500" },
            { page: "BusinessAnalytics", icon: BarChart3, label: "Full Analytics", color: "bg-orange-500" },
          ].map(({ page, icon: Icon, label, color }) => (
            <Link key={page} to={createPageUrl(page)}>
              <Card className="border border-border hover:shadow-md transition-all cursor-pointer hover:border-primary/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Members */}
      <Card className="border border-border">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span className="flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-500" /> Recent Members</span>
            <Link to={createPageUrl("Clients")}>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">View All →</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {clients.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No clients yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {clients.slice(0, 6).map((c) => (
                <div key={c.email} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold text-sm">{c.full_name?.[0]?.toUpperCase() || "U"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{c.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}