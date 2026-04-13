// @ts-nocheck
import React, { useState } from "react";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Pill,
  Dumbbell,
  UserCheck,
  CreditCard,
  ShoppingCart,
  Star,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Award,
  Users,
  Clock,
  ChevronRight,
} from "lucide-react";

// ─── Product Images ────────────────────────────────────────────────────────────
const IMG = {
  glp1:           "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/d27ee5964_GLP-1MacroCollage.png",
  trt:            "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/6ca52b194_TRTCollage_.png",
  hrt:            "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/31d9b7b61_WomanHormoneTherapyPNG.png",
  b12mic:         "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/bb182b956_B-12MIC_.PNG",
  cjc1295:        "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/191da2ac7_CJC1295Ipamorelin.PNG",
  bpcTb:          "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/abd38b804_BPC157TB500.PNG",
  glowStack:      "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/f90247965_GlowBlend.PNG",
  wolverine:      "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/abd38b804_BPC157TB500.PNG",
  epitalon:       "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/1f1e6746a_Epitalon.PNG",
  motsc:          "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/8d8590795_Mots-c.PNG",
  selank:         "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/326cf6b12_Selanl.PNG",
  supplements:    "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/0210150e1_Apex-Transparent-Box112.png",
  bloodKit:       "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/280e3d85b_Mockup2Front.png",
  semaglutideOdt: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/260dc731e_SemaglutidePillBottle.png",
  tirzepatideOdt: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/acce9801d_TirzepatidePillBottle.png",
  semaglutideInj: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/f2850e4f8_GLPSemaglutideBottlePNG.png",
  tirzepatideInj: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/6f5a76b1d_GLP-1TirzepatidePNGBottle.png",
  sermorelinOdt:  "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/46ec3ad7f_Sermorelin.PNG",
  sermorelinInj:  "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/6140d1101_SermorelinPNG.PNG",
  nadPlus:        "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/e15023a28_NADRXOnly.png",
  nadSpray:       "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/b3912662a_image.png",
  truAge:         "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/908b13da7_generated_image.png",
  truHealth:      "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/6caef31e6_generated_image.png",
  jonaMicrobiome: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/009ecacec_image.png",
  genomicSeq:     "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/917d8f095_generated_image.png",
  comprehensiveLabs: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/2f4f0a811_ApexBloodworkMetabolicPanel.png",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const APEX_PRODUCT_SECTIONS = [
  {
    id: "weight-loss",
    label: "Weight Loss",
    tagline: "GLP-1 Medications",
    badgeColor: "bg-blue-600",
    quizUrl: "https://form.apexmd.com?categoryId=weight-loss",
    description: "Clinically-supervised GLP-1 weight loss programs. Start with a quick quiz to find your best fit.",
    products: [
      { name: "Compounded Semaglutide", price: "$299/mo", url: "https://form.apexmd.com?productid=compounded-semaglutide", badge: "Most Popular", desc: "Injectable compounded semaglutide for effective, sustained weight loss.", image: IMG.semaglutideInj },
      { name: "Compounded Tirzepatide", price: "$399/mo", url: "https://form.apexmd.com?productid=compounded-tirzepatide", badge: "Strongest", desc: "Dual GIP/GLP-1 agonist for maximum metabolic impact.", image: IMG.tirzepatideInj },
      { name: "Semaglutide ODT", price: "$349/mo", url: "https://form.apexmd.com?productid=semaglutide-odt", badge: null, desc: "Oral dissolving tablet — no injections required.", image: IMG.semaglutideOdt },
      { name: "Tirzepatide ODT", price: "$419/mo", url: "https://form.apexmd.com?productid=tirzepatide-odt", badge: null, desc: "Oral tirzepatide for dual-action weight management.", image: IMG.tirzepatideOdt },
      { name: "Semaglutide Micro Dose", price: "$249/mo", url: "https://form.apexmd.com?productid=compounded-semaglutide-micro", badge: "Best Value", desc: "Micro-dosing protocol ideal for beginners or maintenance.", image: IMG.semaglutideInj },
      { name: "Tirzepatide Micro Dose", price: "$249/mo", url: "https://form.apexmd.com?productid=compounded-tirzepatide-micro", badge: null, desc: "Low-dose tirzepatide for gradual, sustainable results.", image: IMG.tirzepatideInj },
      { name: "Semaglutide ODT Micro", price: "$249/mo", url: "https://form.apexmd.com?productid=semaglutide-odt-micro", badge: null, desc: "Oral micro-dose semaglutide — easy and convenient.", image: IMG.semaglutideOdt },
      { name: "Tirzepatide ODT Micro", price: "$249/mo", url: "https://form.apexmd.com?productid=tirzepatide-odt-micro", badge: null, desc: "Oral micro-dose tirzepatide for gentle weight management.", image: IMG.tirzepatideOdt },
    ],
  },
  {
    id: "trt",
    label: "TRT",
    tagline: "Testosterone Replacement Therapy",
    badgeColor: "bg-slate-700",
    quizUrl: "https://form.apexmd.com?categoryId=trt",
    description: "Restore optimal testosterone levels with physician-supervised TRT. Labs included.",
    products: [
      { name: "Testosterone Cream", price: "$199/mo", url: "https://form.apexmd.com?productid=testosterone-cream", badge: null, desc: "Topical cream for easy daily application.", image: IMG.trt },
      { name: "Testosterone Injection", price: "$199/mo", url: "https://form.apexmd.com?productid=testosterone-replacement-injection", badge: "Most Common", desc: "Intramuscular injection — the gold standard for TRT.", image: IMG.trt },
      { name: "Testosterone Troche", price: "$199/mo", url: "https://form.apexmd.com?productid=testosterone-troche", badge: null, desc: "Dissolving lozenge absorbed through oral mucosa.", image: IMG.trt },
      { name: "Kyzatrex", price: "$199/mo", url: "https://form.apexmd.com?productid=kyzatrex", badge: null, desc: "FDA-approved oral testosterone capsule.", image: IMG.trt },
      { name: "Gonadorelin ODT", price: "$199/mo", url: "https://form.apexmd.com?productid=gonadorelin-odt", badge: null, desc: "Maintains natural testosterone production and fertility.", image: IMG.trt },
      { name: "Testosterone Gel", price: "$199/mo", url: "https://form.apexmd.com?productid=testosterone-gel", badge: null, desc: "Topical gel for steady, consistent absorption.", image: IMG.trt },
      { name: "Enclomiphene", price: "$199/mo", url: "https://form.apexmd.com?productid=enclomiphene", badge: null, desc: "Oral SERM that stimulates natural testosterone production.", image: IMG.trt },
    ],
  },
  {
    id: "hrt",
    label: "HRT",
    tagline: "Hormone Replacement Therapy",
    badgeColor: "bg-pink-600",
    quizUrl: "https://form.apexmd.com?categoryId=hrt",
    description: "Personalized HRT to balance hormones and restore vitality. Labs included.",
    products: [
      { name: "Estradiol Capsule", price: "$199/mo", url: "https://form.apexmd.com?productid=estradiol-olive-oil-pill-capsule", badge: "Popular", desc: "Oral estradiol in olive oil capsule for smooth absorption.", image: IMG.hrt },
      { name: "Estradiol Cream", price: "$199/mo", url: "https://form.apexmd.com?productid=estradiol-cream", badge: null, desc: "Topical estradiol for flexible dosing.", image: IMG.hrt },
      { name: "Estradiol Patch", price: "$199/mo", url: "https://form.apexmd.com?productid=estradiol-patch", badge: null, desc: "Transdermal patch for consistent hormone delivery.", image: IMG.hrt },
      { name: "Estriol Cream", price: "$199/mo", url: "https://form.apexmd.com?productid=estriol-cream", badge: null, desc: "Gentle estriol cream for localized symptom relief.", image: IMG.hrt },
    ],
  },
  {
    id: "longevity",
    label: "Longevity",
    tagline: "Anti-Aging & Cellular Health",
    badgeColor: "bg-violet-600",
    quizUrl: "https://form.apexmd.com",
    description: "Science-backed therapies targeting cellular health, energy production, and longevity.",
    products: [
      { name: "NAD+ Injection", price: "$249/mo", url: "https://form.apexmd.com?productid=nad-injection", badge: "Top Pick", desc: "IV-quality NAD+ in injectable form for peak cellular energy.", image: IMG.nadPlus },
      { name: "NAD+ Nasal Spray", price: "$249/mo", url: "https://form.apexmd.com?productid=nad-nasal-spray", badge: null, desc: "Fast-absorbing nasal NAD+ — no needles.", image: IMG.nadSpray },
      { name: "Sermorelin Injection", price: "$249/mo", url: "https://form.apexmd.com?productid=sermorelin-injection", badge: null, desc: "Stimulates natural GH release for anti-aging and body composition.", image: IMG.sermorelinInj },
      { name: "Sermorelin ODT", price: "$249/mo", url: "https://form.apexmd.com?productid=sermorelin-odt", badge: null, desc: "Oral dissolving sermorelin — easy and effective.", image: IMG.sermorelinOdt },
      { name: "B12 + MIC Injection", price: "$149/mo", url: "https://form.apexmd.com?productid=b12-mic", badge: "Best Value", desc: "B12 with lipotropic MIC blend for energy and metabolism.", image: IMG.b12mic },
    ],
  },
  {
    id: "peptides",
    label: "Peptides",
    tagline: "Performance & Recovery",
    badgeColor: "bg-emerald-600",
    quizUrl: "https://form.apexmd.com",
    description: "Targeted peptide therapies for recovery, performance, skin, and sexual health.",
    products: [
      { name: "CJC-1295 / Ipamorelin", price: "$249/mo", url: "https://form.apexmd.com?productid=cjc-ipamorelin", badge: "Best Seller", desc: "Synergistic GH-releasing stack for muscle growth and fat loss.", image: IMG.cjc1295 },
      { name: "Wolverine Stack", price: "$350/mo", url: "https://form.apexmd.com?productid=wolverine-stack", badge: "Elite", desc: "BPC-157 + TB-500 combo for accelerated full-body healing.", image: IMG.wolverine },
      { name: "Glow Stack", price: "$249/mo", url: "https://form.apexmd.com?productid=glow-stack", badge: null, desc: "GHK-Cu + skin peptides for anti-aging and radiant skin.", image: IMG.glowStack },
      { name: "BPC-157 Injection", price: "$249/mo", url: "https://form.apexmd.com?productid=bpc-157-injection", badge: null, desc: "Gut, joint, and tissue repair peptide. Rapid recovery support.", image: IMG.bpcTb },
      { name: "TB-500 Injection", price: "$249/mo", url: "https://form.apexmd.com?productid=tb-500-injection", badge: null, desc: "Systemic healing peptide with anti-inflammatory properties.", image: IMG.bpcTb },
      { name: "PT-141 Injection", price: "$249/mo", url: "https://form.apexmd.com?productid=pt-141-injection", badge: null, desc: "Bremelanotide for enhanced libido and sexual health.", image: IMG.supplements },
      { name: "GHK-Cu Cream", price: "$249/mo", url: "https://form.apexmd.com?productid=ghk-cu-cream", badge: null, desc: "Copper peptide cream for skin regeneration and collagen.", image: IMG.glowStack },
      { name: "Epitalon", price: "$249/mo", url: "https://form.apexmd.com?productid=epitalon", badge: null, desc: "Telomere-protecting peptide for cellular longevity and anti-aging.", image: IMG.epitalon },
      { name: "MOTS-C", price: "$299/mo", url: "https://form.apexmd.com?productid=mots-c", badge: null, desc: "Mitochondrial-derived peptide for metabolic health and energy.", image: IMG.motsc },
      { name: "Selank", price: "$199/mo", url: "https://form.apexmd.com?productid=selank", badge: null, desc: "Anxiolytic peptide for stress reduction and cognitive support.", image: IMG.selank },
    ],
  },
  {
    id: "labs",
    label: "Lab Services",
    tagline: "Diagnostics & Bloodwork",
    badgeColor: "bg-red-600",
    quizUrl: "https://form.apexmd.com?productid=labs-only",
    description: "Comprehensive lab panels reviewed by our physicians. Know your numbers.",
    products: [
      { name: "Basic Labs", price: "$129", url: "https://form.apexmd.com?productid=labs-only", badge: null, desc: "Full blood panel with physician review — no treatment required.", image: IMG.comprehensiveLabs },
      { name: "Comprehensive Labs", price: "$199", url: "https://form.apexmd.com?productid=comprehensive-labs-only", badge: null, desc: "Comprehensive metabolic panel with extended biomarkers and physician review.", image: IMG.comprehensiveLabs },
      { name: "At-Home Lab Kit - Upgrade", price: "$89", url: "https://form.apexmd.com?productid=athome-lab-kit", badge: null, desc: "Convenient at-home lab collection with comprehensive analysis and physician review.", image: IMG.bloodKit },
      { name: "TruAge", price: "$399/mo", url: "https://form.apexmd.com?productid=truage", badge: "Popular", desc: "Advanced aging assessment measuring biological vs chronological age for longevity insights.", image: IMG.truAge },
      { name: "TruHealth", price: "$399/mo", url: "https://form.apexmd.com?productid=truhealth", badge: null, desc: "Comprehensive health assessment with advanced biometric analysis and personalized recommendations.", image: IMG.truHealth },
      { name: "Jona Microbiome", price: "$399/mo", url: "https://form.apexmd.com?productid=jona-microbiome", badge: "New", desc: "Complete microbiome analysis revealing gut health status, bacterial composition, and metabolic function.", image: IMG.jonaMicrobiome },
      { name: "Genomic Sequencing", price: "$399/mo", url: "https://form.apexmd.com?productid=genomic-sequencing", badge: "Advanced", desc: "Full genome sequencing for personalized medicine insights, ancestry, and health predisposition analysis.", image: IMG.genomicSeq },
    ],
  },
];

const SUPPLEMENTS = [
  {
    id: 1,
    name: "Elite Whey Protein",
    tagline: "25g Protein Per Serving",
    price: 59,
    unit: "/bag",
    flavors: ["Chocolate", "Vanilla", "Strawberry"],
    badge: "Top Rated",
    badgeColor: "bg-yellow-500",
    rating: 4.9,
    reviews: 1240,
    description: "Ultra-pure whey isolate with optimal amino acid profile for maximum muscle protein synthesis.",
    benefits: ["25g protein", "2g carbs", "Fast absorbing", "Gluten free"],
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80",
  },
  {
    id: 2,
    name: "Pre-Workout SURGE",
    tagline: "Maximum Energy & Focus",
    price: 49,
    unit: "/tub",
    flavors: ["Watermelon", "Blue Raspberry", "Citrus Blast"],
    badge: "New Formula",
    badgeColor: "bg-red-500",
    rating: 4.7,
    reviews: 830,
    description: "Clinically-dosed pre-workout with 350mg caffeine, beta-alanine, and citrulline for explosive sessions.",
    benefits: ["350mg caffeine", "Pump complex", "6g citrulline", "No crash"],
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  },
  {
    id: 3,
    name: "Omega-3 Ultra",
    tagline: "Heart & Brain Health",
    price: 34,
    unit: "/bottle",
    flavors: [],
    badge: "Essential",
    badgeColor: "bg-cyan-500",
    rating: 4.8,
    reviews: 2100,
    description: "Pharmaceutical-grade fish oil with 1000mg EPA/DHA per serving for cardiovascular and cognitive support.",
    benefits: ["1000mg EPA/DHA", "Triglyceride support", "Brain health", "Joint comfort"],
    image: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80",
  },
  {
    id: 4,
    name: "Creatine Monohydrate",
    tagline: "Strength & Power",
    price: 29,
    unit: "/bag",
    flavors: ["Unflavored"],
    badge: "Science-Backed",
    badgeColor: "bg-green-500",
    rating: 5.0,
    reviews: 3400,
    description: "Pure micronized creatine monohydrate — the most researched supplement for strength and power output.",
    benefits: ["Increased strength", "ATP resynthesis", "Muscle volumization", "Cognitive boost"],
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
  },
];

const DEFINED_FITNESS_SUPPLEMENTS = [
  {
    id: 1,
    name: "Vanilla Whey Protein Blend",
    tagline: "24g Protein Per Serving",
    price: 59,
    unit: "/tub",
    flavors: ["Vanilla"],
    badge: "Top Rated",
    badgeColor: "bg-red-600",
    rating: 4.9,
    reviews: 1240,
    description: "Soy-free vanilla whey protein blend with 24g protein and only 1g carbs. Mixes instantly and tastes great.",
    benefits: ["24g protein", "1g carbs", "Soy free", "Mixes instantly"],
    image: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/b9e3f10e2_Vanillaproteinpowderwithicecream1.png",
  },
  {
    id: 2,
    name: "Pre-Workout Sour Gummy",
    tagline: "Powerful Pre-Workout Stimulant",
    price: 49,
    unit: "/tub",
    flavors: ["Sour Gummy"],
    badge: "New Formula",
    badgeColor: "bg-red-600",
    rating: 4.8,
    reviews: 620,
    description: "Powerful pre-workout stimulant in a delicious sour gummy flavor. Increases endurance and energy for explosive sessions.",
    benefits: ["Increases endurance", "Energy boost", "Great taste", "No crash"],
    image: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/c61fd70dd_Sourgummypre-workoutsupplementshot.PNG",
  },
  {
    id: 3,
    name: "Super V&M",
    tagline: "Cleanse · Digest · Health",
    price: 34,
    unit: "/bottle",
    flavors: [],
    badge: "Essential",
    badgeColor: "bg-red-600",
    rating: 4.8,
    reviews: 980,
    description: "Comprehensive vitamin & mineral blend with Vitamin C 500mg, Vitamin D 1000 IU, and a key mineral blend. 90 capsules.",
    benefits: ["Vitamin C 500mg", "Vitamin D 1000 IU", "Key minerals", "90 capsules"],
    image: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/fce4be11b_DefinedFitnessSuperVMsupplementbottle.png",
  },
  {
    id: 4,
    name: "Kre-Alkalyn® Creatine",
    tagline: "Clinically Proven · pH Correct",
    price: 39,
    unit: "/tub",
    flavors: ["Unflavored"],
    badge: "New!",
    badgeColor: "bg-red-600",
    rating: 4.9,
    reviews: 740,
    description: "Kre-Alkalyn® buffered creatine monohydrate — clinically proven and pH corrected for superior absorption and results.",
    benefits: ["pH corrected", "Clinically proven", "No bloating", "Unflavored"],
    image: "https://media.api.com/images/public/68dc2f71f36b75ec180e03bd/fa0d02a66_Kre-Alkalyncreatinesupplementbottle.PNG",
  },
];

const PROGRAMS = [
  {
    id: 1,
    name: "8-Week Shred",
    tagline: "Fat Loss & Definition",
    price: 129,
    duration: "8 Weeks",
    sessions: "5x/week",
    level: "Intermediate",
    badge: "Most Popular",
    badgeColor: "bg-orange-500",
    description: "High-intensity program combining strength and cardio to maximize fat loss while preserving muscle.",
    includes: ["40 workout sessions", "Nutrition guide", "Weekly check-ins", "Progress tracking"],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
    coach: "Coach Marcus",
  },
  {
    id: 2,
    name: "Powerlifting Foundation",
    tagline: "Build Serious Strength",
    price: 149,
    duration: "12 Weeks",
    sessions: "4x/week",
    level: "Beginner–Advanced",
    badge: "Coach Pick",
    badgeColor: "bg-purple-500",
    description: "Progressive overload program focused on squat, bench, and deadlift mastery from foundation to elite.",
    includes: ["48 workout sessions", "Form video library", "1-RM tracking", "Peaking protocol"],
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
    coach: "Coach Reyes",
  },
  {
    id: 3,
    name: "Lean Muscle Builder",
    tagline: "Hypertrophy Focused",
    price: 119,
    duration: "10 Weeks",
    sessions: "4x/week",
    level: "Intermediate",
    badge: "Best Value",
    badgeColor: "bg-emerald-500",
    description: "Science-backed hypertrophy program using volume and progressive overload to maximize muscle growth.",
    includes: ["40 workout sessions", "Macro targets", "Supplement guide", "Rest day protocols"],
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
    coach: "Coach Alexis",
  },
];

const PT_PACKAGES = [
  {
    id: 1,
    name: "Starter Pack",
    sessions: 5,
    price: 299,
    pricePerSession: 59.80,
    popular: false,
    features: ["5 one-on-one sessions", "Initial fitness assessment", "Personalized workout plan", "Email support"],
  },
  {
    id: 2,
    name: "Transform",
    sessions: 12,
    price: 599,
    pricePerSession: 49.92,
    popular: true,
    features: ["12 one-on-one sessions", "Full body composition analysis", "Custom meal plan", "Unlimited text support", "Progress photos"],
  },
  {
    id: 3,
    name: "Elite",
    sessions: 24,
    price: 999,
    pricePerSession: 41.63,
    popular: false,
    features: ["24 one-on-one sessions", "Weekly check-ins", "Nutrition coaching", "Recovery protocols", "Priority booking", "Supplement consult"],
  },
];

const MEMBERSHIPS = [
  {
    id: 1,
    name: "Classic",
    price: 24.99,
    period: "/month",
    color: "border-gray-300",
    headerBg: "bg-gray-100",
    current: true,
    features: [
      "Gym access all locations",
      "Cardio equipment",
      "Free weights area",
      "Locker rooms",
      "2 guest passes/month",
    ],
  },
  {
    id: 2,
    name: "Black Card",
    price: 44.99,
    period: "/month",
    color: "border-black",
    headerBg: "bg-black",
    headerText: "text-white",
    badge: "Most Popular",
    current: false,
    features: [
      "Everything in Classic",
      "Unlimited guest privileges",
      "Massage chairs & tanning",
      "Bring a guest any time",
      "Premium amenities",
      "Priority class booking",
    ],
  },
  {
    id: 3,
    name: "Black Card + PT",
    price: 99.99,
    period: "/month",
    color: "border-yellow-500",
    headerBg: "bg-gradient-to-r from-yellow-500 to-yellow-600",
    badge: "Best Value",
    current: false,
    features: [
      "Everything in Black Card",
      "2 PT sessions/month included",
      "Monthly body scan",
      "Nutrition coaching",
      "Exclusive member events",
      "Recovery suite access",
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    setAdded(true);
    onAddToCart && onAddToCart(product);
    setTimeout(() => setAdded(false), 1500);
  };
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border border-border group">
      <div className="relative h-44 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {product.badge && (
          <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full ${product.badgeColor}`}>
            {product.badge}
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-lg leading-tight">{product.name}</p>
          <p className="text-white/80 text-xs">{product.tagline}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {product.benefits?.slice(0, 3).map((b) => (
            <span key={b} className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{b}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">${product.price}</span>
            <span className="text-sm text-muted-foreground">{product.unit}</span>
          </div>
          <Button size="sm" className="font-bold" onClick={handleAdd}>
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4 mr-1" />}
            {added ? "Added" : "Add to Cart"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramCard({ program }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border border-border group">
      <div className="relative h-44 overflow-hidden">
        <img src={program.image} alt={program.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {program.badge && (
          <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full ${program.badgeColor}`}>
            {program.badge}
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-lg">{program.name}</p>
          <p className="text-white/80 text-xs">{program.tagline}</p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{program.duration}</span>
          <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{program.sessions}</span>
          <span className="flex items-center gap-1"><Award className="w-3 h-3" />{program.level}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{program.description}</p>
        <ul className="space-y-1 mb-4">
          {program.includes.map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-foreground">
              <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {item}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">${program.price}</span>
          <Button className="font-bold">Get Program <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Shared Medical Sub-components ───────────────────────────────────────────

function MedicalDisclaimer() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-4 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800">Medical Consultation Required</p>
          <p className="text-sm text-amber-700">All products require a quick intake quiz and physician review before fulfillment. Clicking "Get Started" will take you to the Apex MD intake form.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Extract productid from a URL string
function getProductId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get("productid");
  } catch {
    return null;
  }
}

function ApexSection({ section, storeLinks }) {
  if (!section) return null;

  // Resolve quiz URL from storeLinks if available
  const quizUrl = storeLinks?.quizUrls?.[section.id] ?? section.quizUrl;

  // Resolve each product's URL from storeLinks if available
  const resolveProductUrl = (product) => {
    if (!storeLinks?.productUrls) return product.url;
    const pid = getProductId(product.url);
    return (pid && storeLinks.productUrls[pid]) ? storeLinks.productUrls[pid] : product.url;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${section.badgeColor}`}>{section.label}</span>
            <h2 className="text-lg font-bold text-foreground">{section.tagline}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
        <a href={quizUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="font-bold whitespace-nowrap border-2">
            Take the Quiz <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {section.products.map((product) => (
          <Card key={product.name} className="border border-border hover:shadow-md hover:border-primary/40 transition-all flex flex-col overflow-hidden group">
            {product.image && (
              <div className="relative h-40 overflow-hidden bg-white">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                />
                {product.badge && (
                  <span className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full ${section.badgeColor}`}>
                    {product.badge}
                  </span>
                )}
              </div>
            )}
            <CardContent className="p-4 flex flex-col flex-1">
              {!product.image && (
                <div className="flex items-start justify-between mb-2">
                  {product.badge && (
                    <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mb-2 ${section.badgeColor}`}>
                      {product.badge}
                    </span>
                  )}
                </div>
              )}
              <p className="font-bold text-foreground text-sm leading-snug mb-1">{product.name}</p>
              <p className="text-xs text-muted-foreground mb-3 flex-1">{product.desc}</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                <span className="font-bold text-foreground">{product.price}</span>
                <a href={resolveProductUrl(product)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="font-bold text-xs">
                    Get Started <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Marketplace() {
  const [cartCount, setCartCount] = useState(0);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const { environment } = useEnvironment();
  const storeLinks = environment?.storeLinks ?? null;
  const supplements = environment?.id === "defined-fitness" ? DEFINED_FITNESS_SUPPLEMENTS : SUPPLEMENTS;

  const handleAddToCart = () => setCartCount((c) => c + 1);

  const handleUpgrade = (membership) => {
    setSelectedMembership(membership);
    setUpgradeSuccess(true);
    setTimeout(() => setUpgradeSuccess(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store</h1>
          <p className="text-muted-foreground">Shop supplements, programs, and upgrade your membership</p>
        </div>
        <Button variant="outline" className="relative font-bold border-2">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      <Tabs defaultValue="weight-loss" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted p-1 w-full md:w-auto">
          <TabsTrigger value="weight-loss" className="font-bold data-[state=active]:bg-background">
            <Zap className="w-4 h-4 mr-1.5" /> Weight Loss
          </TabsTrigger>
          <TabsTrigger value="trt" className="font-bold data-[state=active]:bg-background">
            <Shield className="w-4 h-4 mr-1.5" /> TRT
          </TabsTrigger>
          <TabsTrigger value="hrt" className="font-bold data-[state=active]:bg-background">
            <Star className="w-4 h-4 mr-1.5" /> HRT
          </TabsTrigger>
          <TabsTrigger value="peptides" className="font-bold data-[state=active]:bg-background">
            <FlaskConical className="w-4 h-4 mr-1.5" /> Peptides
          </TabsTrigger>
          <TabsTrigger value="lab-diagnostics" className="font-bold data-[state=active]:bg-background">
            <FlaskConical className="w-4 h-4 mr-1.5" /> Lab Diagnostics
          </TabsTrigger>
          <TabsTrigger value="supplements" className="font-bold data-[state=active]:bg-background">
            <Pill className="w-4 h-4 mr-1.5" /> Supplements
          </TabsTrigger>
          <TabsTrigger value="programs" className="font-bold data-[state=active]:bg-background">
            <Dumbbell className="w-4 h-4 mr-1.5" /> Programs
          </TabsTrigger>
          <TabsTrigger value="personal-training" className="font-bold data-[state=active]:bg-background">
            <UserCheck className="w-4 h-4 mr-1.5" /> Personal Training
          </TabsTrigger>
          <TabsTrigger value="membership" className="font-bold data-[state=active]:bg-background">
            <CreditCard className="w-4 h-4 mr-1.5" /> Upgrade Membership
          </TabsTrigger>
        </TabsList>

        {/* ── Weight Loss ── */}
        <TabsContent value="weight-loss" className="space-y-10">
          <MedicalDisclaimer />
          <ApexSection section={APEX_PRODUCT_SECTIONS.find(s => s.id === "weight-loss")} storeLinks={storeLinks} />
          <ApexSection section={APEX_PRODUCT_SECTIONS.find(s => s.id === "longevity")} storeLinks={storeLinks} />
        </TabsContent>

        {/* ── TRT ── */}
        <TabsContent value="trt" className="space-y-10">
          <MedicalDisclaimer />
          <ApexSection section={APEX_PRODUCT_SECTIONS.find(s => s.id === "trt")} storeLinks={storeLinks} />
        </TabsContent>

        {/* ── HRT ── */}
        <TabsContent value="hrt" className="space-y-10">
          <MedicalDisclaimer />
          <ApexSection section={APEX_PRODUCT_SECTIONS.find(s => s.id === "hrt")} storeLinks={storeLinks} />
        </TabsContent>

        {/* ── Peptides ── */}
        <TabsContent value="peptides" className="space-y-10">
          <MedicalDisclaimer />
          <ApexSection section={APEX_PRODUCT_SECTIONS.find(s => s.id === "peptides")} storeLinks={storeLinks} />
        </TabsContent>

        {/* ── Lab Diagnostics ── */}
        <TabsContent value="lab-diagnostics" className="space-y-10">
          <MedicalDisclaimer />
          <ApexSection section={APEX_PRODUCT_SECTIONS.find(s => s.id === "labs")} storeLinks={storeLinks} />
        </TabsContent>

        {/* ── Supplements ── */}
        <TabsContent value="supplements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supplements.map((p) => {
              const [expanded, setExpanded] = React.useState(false);
              return (
                <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-all border border-border group flex flex-col">
                  <div className={`relative h-44 overflow-hidden ${environment?.id === "defined-fitness" ? "bg-white" : ""}`}>
                    <img src={p.image} alt={p.name} className={`w-full h-full group-hover:scale-105 transition-transform duration-300 ${environment?.id === "defined-fitness" ? "object-contain p-2" : "object-cover"}`} />
                    {environment?.id !== "defined-fitness" && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
                    {p.badge && <span className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded-full ${p.badgeColor}`}>{p.badge}</span>}
                    {environment?.id !== "defined-fitness" && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-lg leading-tight">{p.name}</p>
                        <p className="text-white/80 text-xs">{p.tagline}</p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(p.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">({p.reviews.toLocaleString()})</span>
                    </div>
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-sm text-muted-foreground mb-3 text-left hover:text-foreground transition-colors"
                    >
                      <p className={expanded ? "" : "line-clamp-2"}>{p.description}</p>
                    </button>
                    {p.flavors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.flavors.map((f) => <span key={f} className="text-xs border px-2 py-0.5 rounded-full">{f}</span>)}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <div>
                        <span className="text-2xl font-bold">${p.price}</span>
                        <span className="text-sm text-muted-foreground">{p.unit}</span>
                      </div>
                      <Button size="sm" className="font-bold" onClick={handleAddToCart}>
                        <ShoppingCart className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Programs ── */}
        <TabsContent value="programs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROGRAMS.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        </TabsContent>

        {/* ── Personal Training ── */}
        <TabsContent value="personal-training" className="space-y-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-2">Train 1-on-1 With an Expert Coach</h2>
            <p className="text-muted-foreground">Our certified personal trainers create customized programs built around your goals, schedule, and fitness level.</p>
          </div>

          {/* Trainer profiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { name: "Marcus Johnson", specialty: "Strength & Powerlifting", rating: 4.9, clients: 84, img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&q=80" },
              { name: "Alexis Rivera", specialty: "Weight Loss & Cardio", rating: 5.0, clients: 120, img: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&q=80" },
              { name: "Jordan Reyes", specialty: "Athletic Performance", rating: 4.8, clients: 65, img: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=200&q=80" },
            ].map((trainer) => (
              <Card key={trainer.name} className="border border-border hover:shadow-md transition-all">
                <CardContent className="p-4 flex gap-4 items-start">
                  <img src={trainer.img} alt={trainer.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">{trainer.name}</p>
                    <p className="text-xs text-muted-foreground mb-1">{trainer.specialty}</p>
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">{trainer.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{trainer.clients} active clients</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PT_PACKAGES.map((pkg) => (
              <Card key={pkg.id} className={`border-2 relative ${pkg.popular ? "border-primary shadow-lg scale-105" : "border-border"}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div>
                    <span className="text-4xl font-bold">${pkg.price}</span>
                    <span className="text-muted-foreground"> / {pkg.sessions} sessions</span>
                  </div>
                  <p className="text-sm text-muted-foreground">${pkg.pricePerSession.toFixed(2)}/session</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full font-bold mt-2 ${pkg.popular ? "" : "variant-outline"}`} onClick={handleAddToCart}>
                    Book Now <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Upgrade Membership ── */}
        <TabsContent value="membership" className="space-y-6">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-2xl font-bold mb-2">Upgrade Your Membership</h2>
            <p className="text-muted-foreground">Unlock more perks and unlock your full fitness potential. Upgrade anytime, cancel anytime.</p>
          </div>

          {upgradeSuccess && (
            <Card className="border-emerald-300 bg-emerald-50 mb-4">
              <CardContent className="p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <p className="font-bold text-emerald-800">
                  Successfully upgraded to <span className="underline">{selectedMembership?.name}</span>! A confirmation has been sent to your email.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MEMBERSHIPS.map((m) => (
              <Card key={m.id} className={`border-2 relative overflow-hidden ${m.color}`}>
                {m.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">{m.badge}</span>
                  </div>
                )}
                <div className={`${m.headerBg} p-6 ${m.headerText || ""}`}>
                  <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${m.id === 2 ? "text-white/70" : "text-muted-foreground"}`}>Membership</p>
                  <h3 className={`text-2xl font-bold ${m.id === 2 ? "text-white" : "text-foreground"}`}>{m.name}</h3>
                  <div className="mt-2">
                    <span className={`text-4xl font-black ${m.id === 2 ? "text-white" : "text-foreground"}`}>${m.price}</span>
                    <span className={`text-sm ${m.id === 2 ? "text-white/70" : "text-muted-foreground"}`}>{m.period}</span>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <ul className="space-y-2">
                    {m.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {m.current ? (
                    <Button variant="outline" className="w-full font-bold border-2" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full font-bold"
                      onClick={() => handleUpgrade(m)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to {m.name}
                    </Button>
                  )}
                  {!m.current && (
                    <p className="text-xs text-center text-muted-foreground">
                      Cancel or change anytime. No long-term commitment.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gym perks highlight */}
          <Card className="bg-gradient-to-r from-black to-gray-800 text-white border-0 mt-6">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Member Benefits at a Glance</h3>
                  <p className="text-white/70 text-sm mb-4">Every plan comes with access to our world-class facility and community.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Users, label: "100k+ Members" },
                      { icon: Dumbbell, label: "State-of-the-Art Equipment" },
                      { icon: Clock, label: "24/7 Access" },
                      { icon: Shield, label: "No Hidden Fees" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 text-sm text-white/80">
                        <Icon className="w-4 h-4 text-yellow-400" />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-6 text-lg">
                    Speak with a Member Advisor <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}