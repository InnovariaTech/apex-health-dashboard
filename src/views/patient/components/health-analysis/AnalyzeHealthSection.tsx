// @ts-nocheck
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Activity,
  Brain,
  Heart,
  ScanLine,
  RefreshCw,
  Droplet,
  FlaskConical,
  Stethoscope,
  Microscope,
  Search,
  Waves,
  Thermometer,
  Pill,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { createPageUrl } from "@/utils";
import {
  useAllPatientSummaries,
  useGeneratePatientSummary,
} from "@/hooks/ai-agent/useaiSummary";
import { BodyModel3D, useHealthScanState } from "@/components/hologram";

const STATUS_LINES = [
  { icon: ScanLine, text: "Initializing biometric scan..." },
  { icon: Heart, text: "Scanning heart and pulse rhythm..." },
  { icon: Activity, text: "Reading cardiovascular signals..." },
  { icon: Droplet, text: "Analyzing blood markers..." },
  { icon: FlaskConical, text: "Reviewing lipid panel..." },
  { icon: Thermometer, text: "Checking metabolic indicators..." },
  { icon: Stethoscope, text: "Auscultating respiratory baseline..." },
  { icon: Pill, text: "Mapping hormone levels..." },
  { icon: Microscope, text: "Inspecting inflammation markers..." },
  { icon: Waves, text: "Detecting longitudinal trends..." },
  { icon: Brain, text: "Cross-referencing reference ranges..." },
  { icon: Search, text: "Identifying out-of-range values..." },
  { icon: Sparkles, text: "Generating personalized insights..." },
  { icon: Activity, text: "Calculating overall health score..." },
];

export default function AnalyzeHealthSection() {
  const { environment } = useEnvironment();
  const navigate = useNavigate();
  const accent = environment.primaryColor;
  const generate = useGeneratePatientSummary();
  const summaries = useAllPatientSummaries();
  const { scanState, progress, startScan, resetScan, completeScan } = useHealthScanState();

  const scanning = generate.isPending || scanState !== "idle";

  const hasSummary = useMemo(() => {
    const items = summaries.data?.items ?? [];
    return items.length > 0;
  }, [summaries.data?.items]);

  const [statusIndex, setStatusIndex] = React.useState(0);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1600);
    return () => clearInterval(id);
  }, [scanning]);

  const handleAnalyze = async () => {
    startScan();
    try {
      await generate.mutateAsync();
      completeScan();
      navigate(createPageUrl("HealthAnalysis"));
    } catch {
      resetScan();
    }
  };

  const StatusIcon = STATUS_LINES[statusIndex].icon;

  return (
    <Card className="relative overflow-hidden h-full">
      <CardContent className="relative p-6 md:p-7 flex flex-col h-full">
        <div>
          <div className="apex-eyebrow flex items-center gap-1.5 mb-4">
            <Sparkles className="w-3 h-3" style={{ color: "var(--apex-accent)" }} />
            AI health analysis
          </div>

          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-2 leading-none tracking-[-0.035em]">
                  Running analysis...
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                  Hang tight while we scan your latest biomarkers and produce a personalized
                  summary.
                </p>
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border mb-3"
                  style={{ borderColor: `${accent}66`, backgroundColor: `${accent}14` }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <StatusIcon className="w-4 h-4" style={{ color: accent }} />
                  </motion.div>
                  <motion.span
                    key={statusIndex}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-mono font-semibold"
                    style={{ color: accent }}
                  >
                    {STATUS_LINES[statusIndex].text}
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Please keep this tab open. You'll be redirected when the scan is complete.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-2 leading-none tracking-[-0.035em]">
                  {hasSummary ? "Refresh your analysis" : "Analyse your health in seconds"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                  {hasSummary
                    ? "Re-run the AI scan whenever new lab results land to keep your score and insights up to date."
                    : "Run a full longitudinal scan of your lab results. Our AI reviews your biomarkers, detects trends, and produces a personalized summary with a 0–100 health score."}
                </p>
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  className="font-bold text-base shadow-md hover:shadow-lg transition-all"
                >
                  {hasSummary ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Re-analyse
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Analyse Health
                    </>
                  )}
                </Button>
                {generate.isError && (
                  <p className="text-xs text-destructive font-semibold mt-3">
                    Couldn't generate the summary. Please try again.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3D holographic body — drag to rotate when idle, scans during analysis */}
        <div className="mt-6 flex justify-center">
          <div
            className="relative rounded-[14px] border border-border w-full overflow-hidden bg-secondary/40"
            style={{ height: 480 }}
          >
            <BodyModel3D
              scanState={scanState}
              progress={progress}
              color={accent}
              className="w-full h-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
