// @ts-nocheck
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Syringe,
  Leaf,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
} from "lucide-react";

const TREATMENT_STACKS = [
  {
    category: "Hormone Replacement Therapy (HRT)",
    icon: Syringe,
    rule: "var(--info)",
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
    rule: "var(--att)",
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
    rule: "var(--bord)",
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
    rule: "var(--opt)",
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

function TreatmentCard({ treatment }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[12px] border border-border bg-card overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div
          className="w-10 h-10 rounded-[10px] grid place-items-center flex-shrink-0"
          style={{ backgroundColor: "var(--apex-accent-soft)" }}
        >
          <Pill className="w-5 h-5" style={{ color: "var(--apex-accent)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[14px] font-medium text-foreground">{treatment.name}</span>
            <span className="font-mono text-[12px] text-ink-3">{treatment.dose}</span>
            <Badge variant="success">
              <CheckCircle className="w-3 h-3" /> Active
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground font-medium">{treatment.purpose}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            <span className="font-medium text-ink-3">Frequency:</span> {treatment.frequency} · <span className="font-medium text-ink-3">Route:</span> {treatment.route}
          </p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-ink-4 flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-ink-4 flex-shrink-0 mt-1" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* What it does */}
          <div>
            <h4 className="apex-eyebrow mb-1.5 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-primary" /> What This Does
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed bg-secondary rounded-[10px] p-3">
              {treatment.what_it_does}
            </p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="apex-eyebrow mb-2 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-primary" /> Key Benefits
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {treatment.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                  <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--opt)" }} /> {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Monitoring */}
          <div
            className="flex items-start gap-2 rounded-[10px] p-3 border"
            style={{ borderColor: "var(--bord)", background: "var(--bord-soft)" }}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--bord)" }} />
            <div>
              <p className="text-[12px] font-medium mb-0.5" style={{ color: "var(--bord)" }}>Monitoring Protocol</p>
              <p className="text-[12px]" style={{ color: "var(--bord)" }}>{treatment.monitoring}</p>
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
    <Card className="apex-card relative overflow-hidden mb-5">
      <div
        className="absolute top-0 left-0 h-0.5 w-2/5"
        style={{ background: stack.rule }}
      />
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-primary" />
          <span className="apex-card-title">{stack.category}</span>
          <span className="text-[12px] text-muted-foreground ml-1">
            {stack.treatments.length} treatment{stack.treatments.length > 1 ? "s" : ""}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-ink-4" /> : <ChevronDown className="w-4 h-4 text-ink-4" />}
      </button>

      {open && (
        <CardContent className="pt-0 px-4 pb-4 space-y-3">
          {stack.treatments.map((t, i) => (
            <TreatmentCard key={i} treatment={t} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default function MyTreatments() {
  const totalTreatments = TREATMENT_STACKS.reduce((acc, s) => acc + s.treatments.length, 0);

  const summaryTiles = [
    { label: "Active Treatments", value: totalTreatments, rule: "var(--info)" },
    { label: "Injectable Protocols", value: 2, rule: "var(--att)" },
    { label: "Oral Supplements", value: 4, rule: "var(--opt)" },
    { label: "Lab Review Cycle", value: "Quarterly", rule: "var(--bord)" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {summaryTiles.map((tile) => (
          <div key={tile.label} className="apex-card relative overflow-hidden px-5 py-[18px]">
            <div
              className="absolute top-0 left-0 h-0.5 w-2/5"
              style={{ background: tile.rule }}
            />
            <div className="font-mono text-[28px] font-medium leading-none tracking-[-0.035em] text-foreground">
              {tile.value}
            </div>
            <div className="apex-eyebrow mt-2.5">{tile.label}</div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-2.5 rounded-[10px] p-3.5 border"
        style={{ borderColor: "var(--apex-accent-soft)", background: "var(--apex-accent-soft)" }}
      >
        <Pill className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-ink-2 leading-relaxed">
          <span className="font-medium text-foreground">Personalized Treatment Stack</span> — All protocols are prescribed and monitored by your Apex MD physician. Dosages are adjusted based on your lab results, genomic profile, and clinical response. Do not modify without consulting your provider.
        </p>
      </div>

      {/* Stacks */}
      {TREATMENT_STACKS.map((stack, i) => (
        <StackSection key={i} stack={stack} />
      ))}
    </div>
  );
}