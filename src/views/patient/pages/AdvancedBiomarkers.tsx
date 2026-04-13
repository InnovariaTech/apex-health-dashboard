// @ts-nocheck
import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Dna,
  Microscope,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Brain,
  Heart,
  Flame,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

// ─── Mock Microbiome Data ─────────────────────────────────────────────────────

const MICROBIOME_SUMMARY = {
  diversity_score: 74,
  diversity_percentile: 68,
  gut_health_index: "Good",
  last_tested: "March 2026",
  provider: "Viome",
};

const MICROBIOME_MARKERS = [
  {
    category: "Beneficial Bacteria",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    items: [
      { name: "Lactobacillus acidophilus", level: "High", status: "optimal", note: "Supports lactose digestion, immune modulation, and vaginal health." },
      { name: "Bifidobacterium longum", level: "High", status: "optimal", note: "Produces SCFAs, anti-inflammatory, supports mood via gut-brain axis." },
      { name: "Faecalibacterium prausnitzii", level: "Moderate", status: "borderline", note: "Key butyrate producer. Low levels linked to IBD risk." },
      { name: "Akkermansia muciniphila", level: "Low", status: "low", note: "Maintains gut lining integrity. Inversely correlated with metabolic syndrome." },
    ],
  },
  {
    category: "Pathogenic / Dysbiotic",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-200",
    items: [
      { name: "Clostridium difficile", level: "Not Detected", status: "optimal", note: "Harmful pathogen — not detected is the desired result." },
      { name: "Escherichia coli (pathogenic)", level: "Trace", status: "borderline", note: "Trace levels detected. Monitor; may cause GI distress if elevated." },
      { name: "Helicobacter pylori", level: "Not Detected", status: "optimal", note: "Ulcer-associated pathogen — absence is healthy." },
    ],
  },
  {
    category: "Metabolic Function",
    icon: Zap,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    items: [
      { name: "Short-Chain Fatty Acid Production", level: "Moderate", status: "borderline", note: "SCFAs (butyrate, propionate) fuel colonocytes and regulate inflammation." },
      { name: "Bile Acid Metabolism", level: "High", status: "optimal", note: "Efficient bile recycling supports fat absorption and cholesterol balance." },
      { name: "Tryptophan → Serotonin Pathway", level: "Low", status: "low", note: "~90% of serotonin is gut-derived. Low conversion may affect mood." },
      { name: "Vitamin B12 Synthesis", level: "Moderate", status: "borderline", note: "Gut microbiome contributes to B12 availability." },
    ],
  },
  {
    category: "Immune & Inflammation",
    icon: Shield,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    items: [
      { name: "Gut Permeability (Leaky Gut Score)", level: "Low Risk", status: "optimal", note: "Tight junction integrity appears maintained. Low zonulin signature." },
      { name: "Secretory IgA", level: "Low", status: "low", note: "Key gut immune defense. Low sIgA linked to frequent infections." },
      { name: "Th17/Treg Immune Balance", level: "Balanced", status: "optimal", note: "Healthy ratio supports immune tolerance without autoimmunity risk." },
    ],
  },
];

const DIVERSITY_RADAR = [
  { axis: "Firmicutes", value: 72 },
  { axis: "Bacteroidetes", value: 61 },
  { axis: "Actinobacteria", value: 55 },
  { axis: "Proteobacteria", value: 38 },
  { axis: "Verrucomicrobia", value: 44 },
  { axis: "Fusobacteria", value: 20 },
];

// ─── Mock Genomic Data ────────────────────────────────────────────────────────

const GENOMIC_SUMMARY = {
  provider: "Interpretation by Apex MD Provider and Apex MD AI",
  test_date: "January 2026",
  variants_analyzed: "650,000+",
  polygenic_risk_score: "Low-Moderate",
};

const GENOMIC_MARKERS = [
  {
    category: "Metabolic & Nutrition",
    icon: Flame,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-50 border-orange-200",
    items: [
      { gene: "MTHFR (C677T)", variant: "Heterozygous (+/-)", impact: "Moderate", note: "Reduced methylation capacity (~30% enzyme activity). Supplement with methylfolate (not folic acid).", riskColor: "yellow" },
      { gene: "APOE", variant: "ε3/ε3", impact: "Low", note: "Most common genotype. Average cardiovascular and Alzheimer's risk.", riskColor: "green" },
      { gene: "FTO (rs9939609)", variant: "AT (Risk Allele)", impact: "Moderate", note: "Associated with ~1.67× increased obesity risk. Highly responsive to regular exercise.", riskColor: "yellow" },
      { gene: "TCF7L2", variant: "CC (Protective)", impact: "Low", note: "Lower type 2 diabetes risk. Maintain current carb sensitivity protocols.", riskColor: "green" },
      { gene: "PPARG", variant: "Pro12Pro (Common)", impact: "Low", note: "Standard insulin sensitivity. No special dietary modifications required.", riskColor: "green" },
    ],
  },
  {
    category: "Cardiovascular Risk",
    icon: Heart,
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-200",
    items: [
      { gene: "LDLR", variant: "No pathogenic variants", impact: "Low", note: "No familial hypercholesterolemia variants detected.", riskColor: "green" },
      { gene: "PCSK9", variant: "Gain-of-function absent", impact: "Low", note: "Normal LDL receptor degradation — favorable lipid processing.", riskColor: "green" },
      { gene: "CETP (rs1800775)", variant: "AA (Favorable)", impact: "Low", note: "Associated with higher HDL levels — protective cardiovascular phenotype.", riskColor: "green" },
      { gene: "Factor V Leiden (F5)", variant: "Not Detected", impact: "Low", note: "No clotting disorder mutation detected.", riskColor: "green" },
    ],
  },
  {
    category: "Hormone & Endocrine",
    icon: Zap,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
    items: [
      { gene: "CYP19A1 (Aromatase)", variant: "rs700518 TT", impact: "Moderate", note: "Moderately elevated aromatase activity — may convert testosterone to estrogen faster. Monitor E2 on TRT.", riskColor: "yellow" },
      { gene: "SRD5A2 (5α-reductase)", variant: "A49T Heterozygous", impact: "Moderate", note: "Slightly elevated DHT conversion. Relevant for prostate health monitoring.", riskColor: "yellow" },
      { gene: "AR (Androgen Receptor)", variant: "CAG Repeat: 22", impact: "Low", note: "CAG 22 = typical androgen receptor sensitivity. Good TRT response predicted.", riskColor: "green" },
      { gene: "COMT (Val158Met)", variant: "Met/Met (Slow)", impact: "Moderate", note: "Slower dopamine/catechol metabolism. May have higher estrogen sensitivity; stress recovery may be slower.", riskColor: "yellow" },
    ],
  },
  {
    category: "Recovery & Performance",
    icon: TrendingUp,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    items: [
      { gene: "ACTN3 (R577X)", variant: "RR (Power)", impact: "Low", note: "Power/sprint genotype. Alpha-actinin-3 expressed — favorable for strength training.", riskColor: "green" },
      { gene: "ACE (I/D)", variant: "ID (Balanced)", impact: "Low", note: "Balanced endurance/power phenotype. Responds well to both modalities.", riskColor: "green" },
      { gene: "IL6 (rs1800795)", variant: "GC (Moderate Risk)", impact: "Moderate", note: "Moderately elevated IL-6 inflammatory response post-exercise. Allow 48–72hr recovery for heavy sessions.", riskColor: "yellow" },
      { gene: "MCT1 (rs1049434)", variant: "AA (Less efficient)", impact: "Moderate", note: "Reduced lactate transport. Higher perceived exertion at threshold efforts.", riskColor: "yellow" },
    ],
  },
  {
    category: "Cognitive & Mental Health",
    icon: Brain,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-200",
    items: [
      { gene: "BDNF (Val66Met)", variant: "Val/Val", impact: "Low", note: "Optimal BDNF secretion — supports neuroplasticity and memory consolidation.", riskColor: "green" },
      { gene: "SLC6A4 (Serotonin Transporter)", variant: "L/L", impact: "Low", note: "Long allele — efficient serotonin reuptake, associated with lower anxiety response.", riskColor: "green" },
      { gene: "APOE (Alzheimer's Risk)", variant: "ε3/ε3", impact: "Low", note: "No elevated Alzheimer's risk from APOE. Maintain cardiovascular health for brain longevity.", riskColor: "green" },
    ],
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const MICROBIOME_STATUS = {
  optimal: "bg-emerald-100 text-emerald-800 border-emerald-300",
  borderline: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-red-100 text-red-800 border-red-300",
};

const RISK_BADGE = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionAccordion({ section, isGenomic = false }) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;

  return (
    <Card className={`border-2 ${section.bgColor} mb-4`}>
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${section.iconColor}`} />
          <span className="font-bold text-foreground">{section.category}</span>
          <span className="text-xs text-muted-foreground ml-1">({isGenomic ? section.items.length + " genes" : section.items.length + " markers"})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-3">
            {isGenomic
              ? section.items.map((item, i) => (
                  <div key={i} className="bg-white rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <div>
                        <span className="font-bold text-sm text-foreground font-mono">{item.gene}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.variant}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${RISK_BADGE[item.riskColor]} border text-xs font-bold`}>
                          {item.impact} Risk
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                  </div>
                ))
              : section.items.map((item, i) => (
                  <div key={i} className="bg-white rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold">{item.level}</Badge>
                        <Badge className={`${MICROBIOME_STATUS[item.status]} border text-xs font-bold`}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                  </div>
                ))
            }
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AIAnalysisModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  React.useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const user = await api.auth.me();
      const [biomarkers, whoopRecords, checkIns, habitLogs, workoutSessions] = await Promise.all([
        user ? api.entities.Biomarker.filter({ user_id: user.email }, "-test_date", 2) : Promise.resolve([]),
        user ? api.entities.WhoopRecovery.filter({ user_id: user.email }, "-record_date", 7) : Promise.resolve([]),
        user ? api.entities.CheckIn.filter({ user_id: user.email }, "-check_in_date", 1) : Promise.resolve([]),
        user ? api.entities.HabitLog.filter({ user_id: user.email }, "-date", 7) : Promise.resolve([]),
        user ? api.entities.WorkoutSession.filter({ user_id: user.email }, "-date", 10) : Promise.resolve([]),
      ]);

      const latestBio = biomarkers[0];
      const latestWhoop = whoopRecords[0];
      const latestCheckIn = checkIns[0];
      const avgHrv = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.hrv || 0), 0) / whoopRecords.length) : 68;
      const avgRecovery = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.recovery_score || 0), 0) / whoopRecords.length) : 72;
      const avgSleep = whoopRecords.length ? Math.round(whoopRecords.reduce((s, r) => s + (r.sleep_score || 0), 0) / whoopRecords.length) : 79;
      const avgStress = habitLogs.length ? Math.round(habitLogs.reduce((s, h) => s + (h.stress_level || 0), 0) / habitLogs.length) : 5;
      const completedWorkouts = workoutSessions.filter(s => s.completion_percentage >= 80).length;

      const prompt = `You are an expert integrative medicine physician and genomics specialist at Apex MD. 
      
Analyze the following REAL PATIENT DATA and provide a comprehensive, actionable clinical summary:

PATIENT PROFILE:
${user ? `- Name: ${user.full_name}
- Email: ${user.email}
` : ""}
- Recent labs: Testosterone Total ${latestBio?.markers?.testosterone_total ?? "N/A"} ng/dL, LDL ${latestBio?.markers?.ldl ?? "N/A"} mg/dL, Cortisol ${latestBio?.markers?.cortisol ?? "N/A"} µg/dL
- Whoop (7-day avg): HRV ${avgHrv}ms, Recovery ${avgRecovery}%, Sleep Score ${avgSleep}%
- Latest RHR: ${latestWhoop?.rhr ?? "N/A"} bpm
${latestCheckIn ? `- Weight: ${latestCheckIn.weight ?? "N/A"} lbs, Body Fat: ${latestCheckIn.body_fat_percentage ?? "N/A"}%
- Workout Adherence: ${latestCheckIn.workout_adherence ?? "N/A"}%` : ""}
- Avg Stress Level: ${avgStress}/10
- Completed Workouts: ${completedWorkouts}/${workoutSessions.length} sessions ≥80%

GENOMIC FINDINGS (Mock - use as reference):
- MTHFR C677T: Heterozygous (reduced methylation, ~30% enzyme activity)
- FTO rs9939609: AT (moderate obesity risk allele — highly responsive to exercise)
- CYP19A1 rs700518: TT (elevated aromatase — faster T→E2 conversion)
- SRD5A2 A49T: Heterozygous (slightly elevated DHT conversion)
- COMT Val158Met: Met/Met (slow catechol metabolism, higher estrogen sensitivity)
- IL6 rs1800795: GC (moderate inflammatory response post-exercise)
- MCT1 rs1049434: AA (reduced lactate transport)
- ACTN3 R577X: RR (power phenotype)
- BDNF Val66Met: Val/Val (optimal neuroplasticity)

MICROBIOME FINDINGS (Mock - use as reference):
- Diversity Score: 74/100 (68th percentile)
- Akkermansia muciniphila: Low (gut lining integrity at risk)
- F. prausnitzii: Moderate (borderline SCFA production)
- Tryptophan → Serotonin pathway: Low conversion
- Secretory IgA: Low (reduced mucosal immunity)
- Bile Acid Metabolism: High (optimal)

Please provide:
1. **Top 3 Clinical Insights** — what stands out as most impactful given the combination of genomics + microbiome + labs + biometrics
2. **TRT & Hormone Optimization Notes** — specific genomic factors affecting current protocol
3. **Nutrition & Gut Recommendations** — based on microbiome + MTHFR + FTO findings
4. **Recovery & Training Guidance** — based on IL6, MCT1, ACTN3, and current Whoop data
5. **Monitoring Priorities** — what to test/watch closely in next 3–6 months

Be specific, clinically precise, and actionable. Format with clear headers. Avoid generic advice.`;
      
    const result = await api.integrations.Core.InvokeLLM({
      prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          top_insights: { type: "array", items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } }, required: ["title", "detail"] } },
          hormone_notes: { type: "string" },
          nutrition_gut: { type: "string" },
          recovery_training: { type: "string" },
          monitoring_priorities: { type: "array", items: { type: "string" } },
          overall_summary: { type: "string" },
        },
        required: ["top_insights", "hormone_notes", "nutrition_gut", "recovery_training", "monitoring_priorities", "overall_summary"],
      },
      });
      setAnalysis(result);
    } catch (err) {
      console.error("AI analysis error:", err);
      setAnalysis({ error: "Failed to load analysis. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Genomic + Microbiome Analysis
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Powered by Apex MD Clinical AI · Uses more integration credits</p>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <p className="font-semibold text-foreground">Analyzing your genomic & microbiome data…</p>
            <p className="text-xs text-muted-foreground">Cross-referencing 650,000+ genetic variants with microbiome profile and clinical labs</p>
          </div>
        ) : analysis?.error ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
            <p className="font-semibold text-foreground">{analysis.error}</p>
          </div>
        ) : analysis ? (
           <div className="space-y-5 mt-2">
            {/* Summary */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-violet-900 leading-relaxed">{analysis.overall_summary}</p>
            </div>

            {/* Top Insights */}
            <div>
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" /> Top Clinical Insights
              </h3>
              <div className="space-y-3">
                {analysis.top_insights?.map((insight, i) => (
                  <div key={i} className="flex gap-3 bg-muted rounded-lg p-3">
                    <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hormone Notes */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-500" /> TRT & Hormone Optimization
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed bg-white border border-border rounded-lg p-3">{analysis.hormone_notes}</p>
            </div>

            {/* Nutrition */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Microscope className="w-4 h-4 text-emerald-600" /> Nutrition & Gut Recommendations
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed bg-white border border-border rounded-lg p-3">{analysis.nutrition_gut}</p>
            </div>

            {/* Recovery */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Recovery & Training Guidance
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed bg-white border border-border rounded-lg p-3">{analysis.recovery_training}</p>
            </div>

            {/* Monitoring */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Monitoring Priorities (Next 3–6 Months)
              </h3>
              <ul className="space-y-2">
                {analysis.monitoring_priorities?.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-amber-500 font-bold mt-0.5">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[10px] text-muted-foreground text-center border-t pt-3">
              This analysis is generated by AI for informational purposes. Always consult your Apex MD physician before making any clinical decisions.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdvancedBiomarkers() {
  const [showAI, setShowAI] = useState(false);
  const [activeTab, setActiveTab] = useState("microbiome");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
              <Dna className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Advanced Biomarkers</h1>
              <p className="text-sm text-muted-foreground">Microbiome · Genomics · AI-Integrated Analysis</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowAI(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 px-6 py-5 text-sm font-bold shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Analyze with AI
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setActiveTab("microbiome")}
          className={`w-full text-left py-4 px-5 rounded-xl border-2 transition-all flex items-start gap-4 ${
            activeTab === "microbiome"
              ? "border-emerald-500 bg-emerald-50"
              : "border-border hover:border-emerald-200 bg-white"
          }`}
        >
          <div className="p-2.5 bg-emerald-100 rounded-lg flex-shrink-0">
            <Microscope className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Microbiome Analysis</p>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">Gut bacteria composition, diversity, metabolic function & immune markers</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("genomic")}
          className={`w-full text-left py-4 px-5 rounded-xl border-2 transition-all flex items-start gap-4 ${
            activeTab === "genomic"
              ? "border-violet-500 bg-violet-50"
              : "border-border hover:border-violet-200 bg-white"
          }`}
        >
          <div className="p-2.5 bg-violet-100 rounded-lg flex-shrink-0">
            <Dna className="w-6 h-6 text-violet-700" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Genomic Sequencing</p>
            <p className="text-xs text-muted-foreground font-normal mt-0.5">650,000+ variants · Metabolic, hormonal, cardiovascular & cognitive genes</p>
          </div>
        </button>
      </div>

      {/* ── MICROBIOME TAB ── */}
      {activeTab === "microbiome" && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-emerald-700">{MICROBIOME_SUMMARY.diversity_score}</p>
              <p className="text-xs font-bold text-emerald-600 mt-1">Diversity Score</p>
              <p className="text-[10px] text-muted-foreground">{MICROBIOME_SUMMARY.diversity_percentile}th percentile</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-blue-700">{MICROBIOME_SUMMARY.gut_health_index}</p>
              <p className="text-xs font-bold text-blue-600 mt-1">Gut Health Index</p>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-foreground">{MICROBIOME_SUMMARY.provider}</p>
              <p className="text-xs text-muted-foreground mt-1">Test Provider</p>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-foreground">{MICROBIOME_SUMMARY.last_tested}</p>
              <p className="text-xs text-muted-foreground mt-1">Last Tested</p>
            </div>
          </div>

          {/* Radar chart */}
          <Card className="border border-border mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-foreground">Phylum Composition</CardTitle>
              <p className="text-xs text-muted-foreground">Relative abundance of major gut bacterial phyla (% of total microbiome)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={DIVERSITY_RADAR}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <Radar name="Abundance" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${v}%`, "Abundance"]} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sections */}
          {MICROBIOME_MARKERS.map((section, i) => (
            <SectionAccordion key={i} section={section} isGenomic={false} />
          ))}
        </div>
      )}

      {/* ── GENOMIC TAB ── */}
      {activeTab === "genomic" && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-violet-700">{GENOMIC_SUMMARY.variants_analyzed}</p>
              <p className="text-xs font-bold text-violet-600 mt-1">Variants Analyzed</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-base font-black text-yellow-700">{GENOMIC_SUMMARY.polygenic_risk_score}</p>
              <p className="text-xs font-bold text-yellow-600 mt-1">Polygenic Risk</p>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-foreground">{GENOMIC_SUMMARY.provider}</p>
              <p className="text-xs text-muted-foreground mt-1">Provider</p>
            </div>
            <div className="bg-muted border border-border rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-foreground">{GENOMIC_SUMMARY.test_date}</p>
              <p className="text-xs text-muted-foreground mt-1">Test Date</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Genetic variants are interpreted in the context of your full clinical picture. Predisposition ≠ destiny — lifestyle, environment, and treatment significantly modify gene expression.</p>
          </div>

          {/* Sections */}
          {GENOMIC_MARKERS.map((section, i) => (
            <SectionAccordion key={i} section={section} isGenomic={true} />
          ))}
        </div>
      )}

      {/* AI Modal */}
      {showAI && <AIAnalysisModal onClose={() => setShowAI(false)} />}
    </div>
  );
}