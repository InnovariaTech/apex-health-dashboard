import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Camera,
  Trophy,
  TrendingUp,
  Upload,
  Plus,
  Calendar,
  Dumbbell,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { api } from "@/api/client";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_PHOTOS = [
  {
    id: 1,
    url: "https://media.base44.com/images/public/68dc2f71f36b75ec180e03bd/db0672d59_generated_image.png",
    date: "2025-10-01",
    label: "Month 1 – Starting Point",
    weight: 247,
    bodyFat: 31,
    notes: "First day. Feeling motivated but nervous. Starting weight: 247 lbs.",
  },
  {
    id: 2,
    url: "https://media.base44.com/images/public/68dc2f71f36b75ec180e03bd/0b762dd11_generated_image.png",
    date: "2025-11-01",
    label: "Month 2 – First Changes",
    weight: 238,
    bodyFat: 29,
    notes: "Down 9 lbs! Clothes fitting better. Energy levels improving.",
  },
  {
    id: 3,
    url: "https://media.base44.com/images/public/68dc2f71f36b75ec180e03bd/1ba4f9f8f_generated_image.png",
    date: "2025-12-01",
    label: "Month 3 – Midway",
    weight: 226,
    bodyFat: 26,
    notes: "Down 21 lbs total. Cardio feels so much easier. People are noticing!",
  },
  {
    id: 4,
    url: "https://media.base44.com/images/public/68dc2f71f36b75ec180e03bd/6b6ab6fb8_generated_image.png",
    date: "2026-01-01",
    label: "Month 4 – Momentum",
    weight: 213,
    bodyFat: 22,
    notes: "34 lbs down. Hit my first pull-up today. This is real.",
  },
  {
    id: 5,
    url: "https://media.base44.com/images/public/68dc2f71f36b75ec180e03bd/578678447_generated_image.png",
    date: "2026-02-01",
    label: "Month 5 – Getting Lean",
    weight: 199,
    bodyFat: 18,
    notes: "Under 200 lbs for the first time in 6 years! Muscle definition showing.",
  },
  {
    id: 6,
    url: "https://media.base44.com/images/public/68dc2f71f36b75ec180e03bd/dba998761_generated_image.png",
    date: "2026-03-01",
    label: "Month 6 – Transformation",
    weight: 187,
    bodyFat: 14,
    notes: "60 lbs lost in 6 months. This is who I was always meant to be.",
  },
];

const WEIGHT_TREND = MOCK_PHOTOS.map((p) => ({
  month: p.label.split("–")[0].trim(),
  weight: p.weight,
  bodyFat: p.bodyFat,
}));

const MOCK_PRS = [
  { exercise: "Bench Press", value: "225 lbs", date: "2026-03-15", improvement: "+65 lbs", icon: "🏋️" },
  { exercise: "Back Squat", value: "275 lbs", date: "2026-03-10", improvement: "+85 lbs", icon: "🦵" },
  { exercise: "Deadlift", value: "315 lbs", date: "2026-03-08", improvement: "+105 lbs", icon: "💪" },
  { exercise: "Pull-ups", value: "12 reps", date: "2026-02-28", improvement: "+12 reps", icon: "🤸" },
  { exercise: "5K Run", value: "24:12 min", date: "2026-02-20", improvement: "-8:30 min", icon: "🏃" },
  { exercise: "Plank", value: "3:45 min", date: "2026-02-15", improvement: "+2:45 min", icon: "🧘" },
];

const MOCK_MILESTONES = [
  { title: "Lost First 10 lbs", date: "2025-10-28", achieved: true, description: "First major milestone hit!", icon: "⚖️" },
  { title: "First Pull-up Ever", date: "2026-01-05", achieved: true, description: "Couldn't do one at the start. Historic.", icon: "🎯" },
  { title: "Under 200 lbs", date: "2026-02-01", achieved: true, description: "Hadn't been under 200 in 6 years.", icon: "🏆" },
  { title: "Bench Press Bodyweight", date: "2026-03-01", achieved: true, description: "Pressed 187 lbs — my own body weight.", icon: "🔥" },
  { title: "60 lbs Total Lost", date: "2026-03-15", achieved: true, description: "60-pound transformation complete!", icon: "⭐" },
  { title: "Run a 5K Under 22 min", date: null, achieved: false, description: "Current best: 24:12. Almost there!", icon: "🏃" },
  { title: "Deadlift 400 lbs", date: null, achieved: false, description: "At 315 now. Next milestone locked in.", icon: "💪" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function PhotoCard({ photo, onClick }) {
  return (
    <div
      className="cursor-pointer group relative rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-200"
      onClick={() => onClick(photo)}
    >
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={photo.url}
          alt={photo.label}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
        <p className="text-white font-bold text-sm">{photo.label}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/80 text-xs">{photo.weight} lbs</span>
          <span className="text-white/60 text-xs">·</span>
          <span className="text-white/80 text-xs">{photo.bodyFat}% BF</span>
        </div>
      </div>
    </div>
  );
}

function PhotoLightbox({ photos, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex);
  const photo = photos[idx];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image */}
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px]">
            <img src={photo.url} alt={photo.label} className="max-h-[70vh] object-contain w-full" />
            {idx > 0 && (
              <button
                onClick={() => setIdx(idx - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {idx < photos.length - 1 && (
              <button
                onClick={() => setIdx(idx + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Details */}
          <div className="w-full md:w-72 p-6 space-y-4 bg-background">
            <DialogHeader>
              <DialogTitle className="text-base">{photo.label}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(photo.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                <p className="text-lg font-bold">{photo.weight} lbs</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Body Fat</p>
                <p className="text-lg font-bold">{photo.bodyFat}%</p>
              </div>
            </div>
            {photo.notes && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-sm text-blue-800 italic">"{photo.notes}"</p>
              </div>
            )}
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{idx + 1} of {photos.length}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Progress() {
  const [photos, setPhotos] = useState(MOCK_PHOTOS);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    const newPhoto = {
      id: Date.now(),
      url: file_url,
      date: new Date().toISOString().split("T")[0],
      label: `Month ${photos.length + 1} – New Check-in`,
      weight: null,
      bodyFat: null,
      notes: "Just uploaded — add notes in your check-in log.",
    };
    setPhotos((prev) => [...prev, newPhoto]);
    setUploading(false);
    e.target.value = "";
  };

  // Summary stats
  const startWeight = MOCK_PHOTOS[0].weight;
  const currentWeight = MOCK_PHOTOS[MOCK_PHOTOS.length - 1].weight;
  const weightLost = startWeight - currentWeight;
  const startBF = MOCK_PHOTOS[0].bodyFat;
  const currentBF = MOCK_PHOTOS[MOCK_PHOTOS.length - 1].bodyFat;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">My Progress</h1>
          <p className="text-muted-foreground">Track your transformation, PRs, and milestones</p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : "Upload Progress Photo"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Weight Lost", value: `${weightLost} lbs`, sub: `${startWeight} → ${currentWeight} lbs`, color: "bg-green-50 text-green-700", border: "border-green-100" },
          { label: "Body Fat Reduced", value: `${startBF - currentBF}%`, sub: `${startBF}% → ${currentBF}%`, color: "bg-blue-50 text-blue-700", border: "border-blue-100" },
          { label: "PRs Achieved", value: MOCK_PRS.length, sub: "Personal records set", color: "bg-purple-50 text-purple-700", border: "border-purple-100" },
          { label: "Milestones Hit", value: `${MOCK_MILESTONES.filter((m) => m.achieved).length}/${MOCK_MILESTONES.length}`, sub: "Goals completed", color: "bg-amber-50 text-amber-700", border: "border-amber-100" },
        ].map((stat) => (
          <Card key={stat.label} className={`border ${stat.border}`}>
            <CardContent className={`p-4 ${stat.color.split(" ")[0]}`}>
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color.split(" ")[1]}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="photos" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="w-4 h-4" /> Photos
          </TabsTrigger>
          <TabsTrigger value="prs" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> PRs
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Star className="w-4 h-4" /> Milestones
          </TabsTrigger>
        </TabsList>

        {/* ── Photos Tab ── */}
        <TabsContent value="photos" className="space-y-6">
          {/* Weight & BF trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Weight & Body Fat Trend
              </CardTitle>
              <CardDescription>6-month transformation data</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={WEIGHT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[150, 260]} tickFormatter={(v) => `${v} lbs`} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 40]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(value, name) =>
                      name === "weight" ? [`${value} lbs`, "Weight"] : [`${value}%`, "Body Fat"]
                    }
                  />
                  <ReferenceLine yAxisId="left" y={187} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Current", position: "right", fontSize: 10, fill: "#10b981" }} />
                  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 5 }} activeDot={{ r: 7 }} name="weight" />
                  <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} name="bodyFat" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-2 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Weight (lbs)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block border-dashed border-t border-amber-500" /> Body Fat %</span>
              </div>
            </CardContent>
          </Card>

          {/* Photo Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Progress Photos ({photos.length})</h2>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Photo
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {photos.map((photo, i) => (
                <PhotoCard key={photo.id} photo={photo} onClick={() => setLightboxIndex(i)} />
              ))}
              {/* Upload card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-muted/50 transition-all duration-200"
              >
                <Camera className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground font-medium">Add Photo</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── PRs Tab ── */}
        <TabsContent value="prs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Your all-time personal records</p>
            <Badge variant="secondary">{MOCK_PRS.length} PRs set</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_PRS.map((pr) => (
              <Card key={pr.exercise} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="text-3xl">{pr.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-foreground">{pr.exercise}</h3>
                      <Badge className="bg-green-100 text-green-800 border-0 font-bold">{pr.improvement}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary mt-1">{pr.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* PR Trend Chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600" />
                Strength Progress — Bench Press
              </CardTitle>
              <CardDescription>Monthly progression on your key lift</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={[
                  { month: "Oct", bench: 135 },
                  { month: "Nov", bench: 155 },
                  { month: "Dec", bench: 175 },
                  { month: "Jan", bench: 195 },
                  { month: "Feb", bench: 205 },
                  { month: "Mar", bench: 225 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v} lbs`} />
                  <Tooltip formatter={(v) => [`${v} lbs`, "Bench Press"]} contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="bench" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Milestones Tab ── */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Your journey, one achievement at a time</p>
            <Badge variant="secondary">
              {MOCK_MILESTONES.filter((m) => m.achieved).length}/{MOCK_MILESTONES.length} achieved
            </Badge>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {MOCK_MILESTONES.map((m, i) => (
                <div key={m.title} className="relative flex gap-4 pl-14">
                  {/* Dot */}
                  <div
                    className={`absolute left-4 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 z-10 ${
                      m.achieved
                        ? "border-green-500 bg-green-500"
                        : "border-muted-foreground bg-background"
                    }`}
                  >
                    {m.achieved && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <Card className={`flex-1 ${m.achieved ? "border-green-100 bg-green-50/30" : "border-dashed opacity-60"}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className={`font-bold ${m.achieved ? "text-foreground" : "text-muted-foreground"}`}>{m.title}</h3>
                          {m.achieved ? (
                            <Badge className="bg-green-100 text-green-800 border-0">
                              ✓ Achieved · {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Upcoming</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}