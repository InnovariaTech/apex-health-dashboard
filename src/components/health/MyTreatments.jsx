import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pill,
  Syringe,
  Leaf,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Heart,
  Brain,
  Flame,
} from "lucide-react";

const TREATMENT_STACKS = [
  {
    category: "Hormone Replacement Therapy (HRT)",
    icon: Syringe,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    treatments: [
      {
        name: "Testosterone Cypionate",
        dose: "200mg/week",
        frequency: "Twice weekly (100mg Mon/Thu)",
        route: "Subcutaneous injection",
        purpose: "TRT — Testosterone Replacement Therapy",
        what_it_does: "Restores testosterone to optimal physiological levels. Supports muscle protein synthesis, libido, energy, bone density, red blood cell production, and mood regulation. Targets 700–900 ng/dL total testosterone.",
        benefits: ["Increased lean muscle mass", "Improved libido & sexual function", "Better mood & cognitive clarity", "Enhanced energy & motivation", "Improved bone density"],
        monitoring: "Total T, Free T, Estradiol (E2), Hematocrit, PSA — every 90 days",
        status: "active",
      },
      {
        name: "Anastrozole",
        dose: "0.25mg",
        frequency: "Twice weekly with testosterone injections",
        route: "Oral tablet",
        purpose: "Aromatase Inhibitor (AI)",
        what_it_does: "Blocks the aromatase enzyme, which converts testosterone into estradiol (E2). Given your CYP19A1 genotype (elevated aromatase activity), this prevents excess estrogen buildup that could cause water retention, gynecomastia, and mood swings.",
        benefits: ["Prevents estrogen-related side effects", "Maintains optimal E2 range (20–40 pg/mL)", "Reduces water retention", "Protects against gynecomastia"],
        monitoring: "Estradiol (E2) — every 90 days. Dose adjusted based on E2 levels.",
        status: "active",
      },
    ],
  },
  {
    category: "GLP-1 Receptor Agonist",
    icon: Syringe,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-300",
    treatments: [
      {
        name: "Semaglutide (Ozempic / Wegovy)",
        dose: "1.0mg/week",
        frequency: "Once weekly",
        route: "Subcutaneous injection",
        purpose: "GLP-1 Agonist — Metabolic & Weight Optimization",
        what_it_does: "Mimics the GLP-1 gut hormone, signaling satiety to the brain and slowing gastric emptying. Dramatically reduces appetite, improves insulin sensitivity, lowers blood glucose, and promotes sustained fat loss — particularly visceral fat. Clinical trials show 15–20% total body weight reduction.",
        benefits: ["Significant appetite suppression", "Sustained fat loss (especially visceral)", "Improved insulin sensitivity", "Reduced HbA1c & fasting glucose", "Cardiovascular risk reduction", "Potential neuroprotective effects"],
        monitoring: "HbA1c, fasting glucose, weight, kidney function — every 90 days",
        status: "active",
      },
    ],
  },
  {
    category: "Peptide Therapy",
    icon: Zap,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    treatments: [
      {
        name: "BPC-157",
        dose: "250mcg",
        frequency: "Once daily",
        route: "Subcutaneous injection",
        purpose: "Tissue Repair & Recovery Peptide",
        what_it_does: "Body Protective Compound 157 is a synthetic peptide derived from a gastric protein. It upregulates growth hormone receptors, accelerates tendon/ligament healing, reduces inflammation, and supports gut mucosal repair. Given your IL-6 genotype (elevated inflammatory response post-exercise), BPC-157 helps offset exercise-induced inflammation.",
        benefits: ["Accelerated tendon & ligament repair", "Reduced post-exercise inflammation", "Supports gut lining integrity", "Improves joint mobility", "Neuroprotective properties"],
        monitoring: "Clinical assessment of recovery & joint health every 90 days",
        status: "active",
      },
      {
        name: "Sermorelin / GHRP-2",
        dose: "100mcg / 100mcg",
        frequency: "5 nights/week (before bed)",
        route: "Subcutaneous injection",
        purpose: "Growth Hormone Secretagogue",
        what_it_does: "Sermorelin stimulates the pituitary to release natural growth hormone (GH) in a pulsatile, physiological manner. GHRP-2 amplifies this signal. Together they restore youthful GH/IGF-1 levels without suppressing your own production — improving body composition, deep sleep quality, and cellular recovery.",
        benefits: ["Increased lean muscle mass", "Enhanced fat metabolism", "Improved deep sleep (REM/SWS)", "Faster recovery between sessions", "Anti-aging cellular repair", "Improved skin elasticity"],
        monitoring: "IGF-1 levels every 6 months. Fasting glucose monitored quarterly.",
        status: "active",
      },
    ],
  },
  {
    category: "Targeted Supplements",
    icon: Leaf,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    treatments: [
      {
        name: "Methylfolate (L-5-MTHF)",
        dose: "1,000mcg",
        frequency: "Daily",
        route: "Oral",
        purpose: "Methylation Support — MTHFR Genotype",
        what_it_does: "Your MTHFR C677T heterozygous variant reduces your methylation capacity by ~30%. Methylation is critical for DNA repair, neurotransmitter synthesis, hormone detoxification, and cardiovascular health. Standard folic acid cannot be processed efficiently — methylfolate bypasses the defective enzyme and goes directly to work.",
        benefits: ["Supports neurotransmitter production (serotonin, dopamine)", "Reduces homocysteine levels", "Supports DNA repair & methylation", "Cardiovascular protection", "Mood regulation support"],
        monitoring: "Homocysteine levels, B12, folate — every 6 months",
        status: "active",
      },
      {
        name: "Magnesium Glycinate",
        dose: "400mg",
        frequency: "Daily at bedtime",
        route: "Oral",
        purpose: "Recovery, Sleep & Metabolic Support",
        what_it_does: "Magnesium is a cofactor in 300+ enzymatic reactions including ATP energy production, muscle relaxation, insulin signaling, and melatonin synthesis. Glycinate form maximizes absorption without GI side effects. Supports deep sleep quality (important alongside Sermorelin), reduces cortisol, and improves recovery.",
        benefits: ["Improved sleep quality", "Muscle relaxation & reduced cramping", "Cortisol regulation", "Insulin sensitivity support", "Migraine & headache prevention"],
        monitoring: "Serum magnesium — annually or with comprehensive labs",
        status: "active",
      },
      {
        name: "Vitamin D3 + K2",
        dose: "5,000 IU D3 / 100mcg K2 (MK-7)",
        frequency: "Daily with a fatty meal",
        route: "Oral",
        purpose: "Immune, Bone & Cardiovascular Support",
        what_it_does: "Vitamin D3 functions as a hormone, regulating immune function, testosterone synthesis, calcium absorption, and mood. K2 ensures calcium is directed to bones and teeth — not arteries. Critical pairing for cardiovascular safety on long-term D3 supplementation.",
        benefits: ["Optimizes testosterone levels", "Supports immune function", "Improves calcium utilization for bone density", "Reduces arterial calcification risk", "Mood & seasonal affective support"],
        monitoring: "25-OH Vitamin D, calcium — every 6 months (target: 50–80 ng/mL)",
        status: "active",
      },
      {
        name: "Omega-3 Fish Oil (EPA/DHA)",
        dose: "3g EPA+DHA",
        frequency: "Daily with meals",
        route: "Oral",
        purpose: "Cardiovascular & Anti-Inflammatory Support",
        what_it_does: "High-dose EPA/DHA omega-3s reduce systemic inflammation (critical given IL-6 genotype), lower triglycerides, improve HDL, and support brain health via BDNF production. Also supports cell membrane fluidity and hormone receptor sensitivity.",
        benefits: ["Triglyceride reduction (up to 30%)", "Anti-inflammatory (counteracts IL-6 variant)", "Brain health & cognitive support", "Improved hormone receptor sensitivity", "Joint lubrication"],
        monitoring: "Lipid panel (triglycerides, HDL) — quarterly",
        status: "active",
      },
    ],
  },
];

function TreatmentCard({ treatment, badgeColor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-foreground">{treatment.name}</span>
            <Badge className={`${badgeColor} border text-xs font-bold`}>{treatment.dose}</Badge>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 border text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">{treatment.purpose}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold">Frequency:</span> {treatment.frequency} · <span className="font-semibold">Route:</span> {treatment.route}
          </p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* What it does */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-violet-500" /> What This Does
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted rounded-lg p-3">
              {treatment.what_it_does}
            </p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" /> Key Benefits
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {treatment.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span> {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Monitoring */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 mb-0.5">Monitoring Protocol</p>
              <p className="text-xs text-amber-700">{treatment.monitoring}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StackSection({ stack }) {
  const [open, setOpen] = useState(true);
  const Icon = stack.icon;

  return (
    <Card className={`border-2 ${stack.bgColor} mb-5`}>
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${stack.iconColor}`} />
          <span className="font-bold text-foreground">{stack.category}</span>
          <span className="text-xs text-muted-foreground ml-1">({stack.treatments.length} treatment{stack.treatments.length > 1 ? "s" : ""})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <CardContent className="pt-0 px-4 pb-4 space-y-3">
          {stack.treatments.map((t, i) => (
            <TreatmentCard key={i} treatment={t} badgeColor={stack.badgeColor} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default function MyTreatments() {
  const totalTreatments = TREATMENT_STACKS.reduce((acc, s) => acc + s.treatments.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-blue-700">{totalTreatments}</p>
          <p className="text-xs font-bold text-blue-600 mt-1">Active Treatments</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
          <p className="text-xl font-black text-violet-700">2</p>
          <p className="text-xs font-bold text-violet-600 mt-1">Injectable Protocols</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xl font-black text-emerald-700">4</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">Oral Supplements</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-xl font-black text-amber-700">Quarterly</p>
          <p className="text-xs font-bold text-amber-600 mt-1">Lab Review Cycle</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
        <Pill className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/70">
          <span className="font-bold text-foreground">Personalized Treatment Stack</span> — All protocols are prescribed and monitored by your Apex MD physician. Dosages are adjusted based on your lab results, genomic profile, and clinical response. Do not modify without consulting your provider.
        </p>
      </div>

      {/* Stacks */}
      {TREATMENT_STACKS.map((stack, i) => (
        <StackSection key={i} stack={stack} />
      ))}
    </div>
  );
}