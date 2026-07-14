/* ---------- DATA: [name, panel, status] ---------- */
const ATT = [
 ["Mood-induced Sleeplessness Risk","Sleeplessness Risk · in 4 panels","Increased"],
 ["Vitamin A Conversion","Vitamin A · in 2 panels","Reduced"],
 ["Zeaxanthin Level Propensity","Non-Vitamin A Carotenoids · in 2 panels","Reduced"],
 ["Lutein Level Propensity","Non-Vitamin A Carotenoids · in 2 panels","Reduced"],
 ["Nitric Oxide Production","Nitric Oxide","Very Low"],
 ["Copper Imbalance Risk","Copper and Zinc","High Risk"],
 ["Dietary Fat Response","Fats · in 3 panels","Limit intake"],
 ["Saturated Fat Response","Saturated Fat · in 4 panels","Poor Response"],
 ["Omega-6 Risk","Omega Fatty Acids · in 2 panels","Increased"],
 ["Plant Sterol Risk","Plant Cholesterol · in 2 panels","High Risk"],
 ["UV Resilience","Skin Response to Sunlight · in 2 panels","Very Low"],
 ["Sunspots","Skin Spots · in 2 panels","Increased"],
 ["Nitric Oxide Production (Hair Health)","Hair Inflammation Support","Very Low"],
 ["Vitamin A Conversion (Hair Health)","Hair Vitamins","Reduced"],
 ["Mercury Exposure Risk","Element and Heavy Metal Management · in 2 panels","High Risk"],
 ["Lead Exposure Risk","Element and Heavy Metal Management","Increased"],
 ["NSAIDs Metabolism (CYP2C9)","Phase 1 Detoxification Systems","Poor Metabolism"],
 ["NAT2 Acetylation (Standard)","Phase 2 Detoxification Overview","Slow Acetylation"],
 ["Methylation Propensity","Methylation · in 4 panels","Undermethylation Risk"],
 ["MTRR","Methylation Expanded · in 3 panels","Low activity (two variants)"],
 ["Keto Diet Fit","Ketogenic Diets","Avoid"],
 ["IL-10 Inflammation Risk","IL-10 Inflammation · in 2 panels","Increased"],
 ["Postpartum Depression Propensity","Depression · in 2 panels","High"],
 ["Gum Inflammation","Gum Inflammation · in 2 panels","Increased Potential"],
 ["Saturated Fat Response (Speedometer)","Saturated Fat (Gauge Demos)","Poor Response"],
 ["Saturated Fat Response (Gradient)","Saturated Fat (Gauge Demos)","Poor Response"],
 ["Saturated Fat Response (Dot/Icon)","Saturated Fat (Gauge Demos)","Poor Response"],
 ["Saturated Fat Response (Circle)","Saturated Fat (Gauge Demos)","Poor Response"],
 ["Ulcerative Colitis Propensity","Ulcerative Colitis","High"],
 ["Gut Permeability","Gut Permeability","High Risk"],
 ["Dutasteride Response Propensity","Hair Meds","Reduced Response"],
 ["Minoxidil Response Propensity","Hair Meds","Reduced Response"],
];

const MOD = [
 ["Reported Sleep Quality","Deep Sleep Quality · in 2 panels","Below Average"],
 ["Jittery Legs Risk","Sleep Movement","Increased Risk"],
 ["Sleep Movement Risk","Sleep Movement","Increased"],
 ["Lycopene Level Propensity","Non-Vitamin A Carotenoids · in 2 panels","Reduced"],
 ["MTHFR Activity","B Vitamins · in 7 panels","48% enzyme activity"],
 ["Vitamin B9 Need","B Vitamins · in 2 panels","Increased"],
 ["Vitamin B6 Level Propensity","B Vitamins · in 2 panels","Reduced"],
 ["Folic Acid Supplementation Tolerance","B Vitamins · in 2 panels","Low"],
 ["Vitamin D Deficiency Risk","Vitamin D · in 2 panels","Neutral"],
 ["Gamma Tocopherol Level Propensity","Vitamin E","Reduced"],
 ["Magnesium Deficiency Risk","Electrolytes · in 2 panels","Increased"],
 ["Choline Need","Choline · in 6 panels","Neutral"],
 ["Choline Deficiency Severity","Choline · in 2 panels","Neutral"],
 ["Risk of Organ Dysfunction from Choline Deficiency","Choline · in 2 panels","Neutral"],
 ["Selenium Deficiency Severity","Selenium and Iodine","Increased"],
 ["Transferrin Level Propensity","Iron · in 2 panels","Below Average"],
 ["Risk for Zinc Excess","Copper and Zinc","Increased"],
 ["Leptin Propensity","Hunger and Fullness Sensing (new) · in 5 panels","Increased"],
 ["Appetite/Fullness Sensing","Hunger and Fullness Sensing (new) · in 4 panels","Less effective"],
 ["Complex Carb Utilization","Carbohydrates (new) · in 3 panels","Low"],
 ["Omega-3 Need","Omega Fatty Acids · in 2 panels","Increased"],
 ["GAD1 Activity","Food Sensitivities · in 2 panels","Low Activity"],
 ["Skin Hydration (New)","Skin Elasticity and Hydration (new)","Reduced"],
 ["Rate of Skin Aging","Skin Aging · in 3 panels","Increased"],
 ["Acne Propensity","Acne & Rosacea · in 2 panels","Increased"],
 ["Psoriasis Propensity","Psoriasis","Increased"],
 ["Melanoma Risk","Skin Risks","Increased"],
 ["Inflammation Support","Hair Inflammation Support","Reduced"],
 ["Selenium Deficiency Severity (Hair Health)","Hair Minerals","Increased"],
 ["Magnesium Deficiency Risk (Hair Health)","Hair Minerals","Increased"],
 ["Vitamin B9 Need (Hair Health)","Hair Vitamins","Increased"],
 ["Vitamin D Deficiency Risk (Hair Health)","Hair Vitamins","Neutral"],
 ["General Chemical Sensitivity","Environmental Sensitivity · in 2 panels","Increased"],
 ["Benzene Risk","Environmental Sensitivity · in 4 panels","Increased"],
 ["Alcohol Metabolism","Alcohol Genetics (New) · in 2 panels","Slow"],
 ["Phase 1 Summary (2D6 only for now)","Phase 1 Detoxification Systems","Intermediate Metabolism (*10)"],
 ["General Medication Metabolism (CYP)","Phase 1 Detoxification Systems","Below Average Metabolism"],
 ["Catalase Activity","Phase 2 Detoxification Overview · in 2 panels","Below Average"],
 ["Glucuronidation","Phase 2 Detoxification Overview · in 2 panels","Reduced Function"],
 ["Glutathione Level Propensity","Phase 2 Detoxification Overview · in 3 panels","Reduced"],
 ["NAT2 Acetylation","Phase 2 - Acetylation and Glucuronidation","Mixed Acetylation"],
 ["Estrogen Metabolite Elimination","Phase 3 - Transport and Elimination · in 3 panels","Decreased"],
 ["CBS Activity","Additional Toxicant & Inflammation Genetics · in 2 panels","Possibly Increased"],
 ["Progesterone Receptors","Progesterone","Increased"],
 ["Progesterone Conversion","Progesterone","Increased"],
 ["Conversion from Testosterone to Estrogen","Testosterone","Increased"],
 ["Estrogen Level Propensity","Estrogen · in 2 panels","Increased"],
 ["Sedative Effects from THC","Subjective Response to Cannabis","High Sedative Effects"],
 ["CBD Effects on Appetite","Subjective Response to Cannabis","Reduced Appetite"],
 ["THC Effects on Appetite","Subjective Response to Cannabis","Increased Appetite"],
 ["THC Metabolism","Cannabinoid Metabolism","Slow Metabolism"],
 ["MTR","Methylation Expanded · in 3 panels","Neutral"],
 ["Obesity Risk","Obesity Risk · in 2 panels","Increased"],
 ["Atrial Fibrillation","Cardiovascular Genetics · in 2 panels","Increased Risk"],
 ["LP(a) Risk","Cardiovascular Genetics · in 3 panels","Increased"],
 ["Weight Loss from Exercise","Exercise and Weight Loss · in 3 panels","Reduced"],
 ["Lipid Impairment Propensity","Lipid Impairment","Increased"],
 ["Venous Thrombosis Propensity","Thrombosis · in 2 panels","Increased"],
 ["Ischemic Stroke Propensity","Thrombosis · in 3 panels","Increased Risk"],
 ["General Bone Density","Bone Density · in 2 panels","Below Average"],
 ["Hip Bone Density and Fracture Risk","Bone Density","Increased"],
 ["Lumbar Bone Density","Bone Density","Below Average"],
 ["Excess Calcium Propensity","Bone Density · in 2 panels","Increased"],
 ["General Soft Tissue Risk","Injury Risk · in 2 panels","Increased"],
 ["Elite Power Propensity","High Intensity vs Endurance · in 2 panels","Below Average"],
 ["Aerobic Training Benefit","Aerobic Training Benefit · in 2 panels","Below Average"],
 ["Mediterranean Diet Fit","Mediterranean Diet","Minimal Fit"],
 ["Nicotine Dependence Risk","Nicotine Genetics","Neutral"],
 ["Methamphetamine-induced Psychosis","Methamphetamine Genetics","Neutral"],
 ["Heroin Dependence Risk","Opioid Genetics","Increased"],
 ["Opioid Dependence Risk","Opioid Genetics","Neutral"],
 ["Cocaine Dependence Risk","Cocaine Genetics","Neutral"],
 ["Risk from Cocaine Abuse","Cocaine Genetics","Neutral"],
 ["General Histamine Sensitivity","Histamine","Increased"],
 ["General Migraine Propensity","Migraines · in 2 panels","Increased"],
 ["Allergy Migraine Propensity","Migraines · in 2 panels","Increased"],
 ["ADHD Propensity","ADHD","Increased"],
 ["Rumination Propensity","OCD & Rumination","Increased"],
 ["White Matter Damage Propensity","Stroke and White Matter Risks","Increased"],
 ["Parkinson's Propensity","Parkinson's","Increased"],
 ["Frontal Lobe Damage (FTLD) Propensity","Dementia","Increased"],
 ["Cold Plunge Tolerance","Cold Plunge","Below Average"],
 ["HPV Persistence & Susceptibility","HPV Persistence and Sensitivity","Increased"],
 ["CJC-1295 Benefit – Lean mass","Hormonal Regulation & Growth Hormone Support","Reduced Benefit"],
 ["IGF-1 LR3 Benefit – Anabolic","Hormonal Regulation & Growth Hormone Support","Reduced Benefit"],
 ["Selank Benefit – Stress handling lens","Cognitive Enhancement & Brain Health · in 2 panels","Reduced Benefit"],
 ["TB4 / TB-500 Benefit – Injury","Longevity & Anti-Aging · in 2 panels","Neutral Benefit"],
 ["Tesamorelin Benefit – Body composition","Fat Loss & Body Composition · in 2 panels","Reduced Benefit"],
 ["CJC-1295 Benefit – Energy capacity proxy","Fat Loss & Body Composition · in 2 panels","Neutral Benefit"],
 ["IGF-1 LR3 Benefit – Training capacity lens","Athletic Performance & Recovery · in 2 panels","Neutral Benefit"],
 ["MOTS-C Benefit – Mitochondrial","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["5-amino-1MQ Benefit – Metabolic risk","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["Epitalon Benefit – Redox stress handling","Skin, Hair, and Cosmetic Health · in 2 panels","Reduced Benefit"],
 ["PT-141 Benefit – Androgen milieu proxy for libido","Libido and Sexual Function · in 2 panels","Reduced Benefit"],
 ["Tirzepatide Benefit – Overall metabolic risk","Fat Loss & Body Composition (GLP1 and GLP2) · in 2 panels","Neutral Benefit"],
 ["Tesamorelin Benefit – Metabolic effects lens","Fat Loss & Body Composition (Peptides - new)","Neutral Benefit"],
 ["IGF-1 LR3 Benefit – Glucose","Fat Loss & Body Composition (Peptides - new)","Neutral Benefit"],
 ["MOTS-C Benefit – Insulin sensitivity","Fat Loss & Body Composition (Peptides - new)","Neutral Benefit"],
 ["5-amino-1MQ Benefit – Insulin sensitivity","Fat Loss & Body Composition (Peptides - new)","Neutral Benefit"],
 ["Retatrutide Benefit – Overall metabolic risk","Fat Loss & Body Composition (Peptides - new)","Neutral Benefit"],
 ["FOXO4-DRI Benefit – Cellular energy","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["AOD-9604 Benefit – Metabolic risk","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["Tesamorelin Benefit – Metabolic risk","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["MOTS-C Benefit – Energy","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["MOTS-C Benefit – Metabolic risk","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["Retatrutide Benefit – Insulin sensitivity","Mitochondrial Health & Metabolic Optimization","Neutral Benefit"],
 ["Tirzepatide Benefit – Insulin sensitivity","Fat Loss & Body Composition (GLP-1 and GLP-2)","Neutral Benefit"],
 ["Semaglutide Benefit – Insulin sensitivity","Fat Loss & Body Composition (GLP-1 and GLP-2)","Neutral Benefit"],
 ["Retatrutide Benefit – Diet–drug pairing: low-carb","Fat Loss & Body Composition (GLP-1 and GLP-2)","Neutral Benefit"],
 ["Teduglutide Benefit – Fat-soluble nutrient absorption","Gut Health & Nutrient Absorption (Peptides - new)","Neutral Benefit"],
 ["Teduglutide Benefit – IBD-related risk context","Gut Health & Nutrient Absorption (Peptides - new)","Neutral Benefit"],
 ["CJC-1295 Benefit – Sleep depth","Hormonal Regulation & Growth Hormone Support","Reduced Benefit"],
 ["Epitalon Benefit – Circadian timing","Hormonal Regulation & Growth Hormone Support","Neutral Benefit"],
 ["PT-141 Benefit – Sex-hormone signaling","Hormonal Regulation & Growth Hormone Support","Neutral Benefit"],
 ["PT-141 Benefit – Hormonal balance","Hormonal Regulation & Growth Hormone Support","Neutral Benefit"],
 ["Selank Benefit – Mood regulation","Autonomic Nervous System & Stress Physiology","Reduced Benefit"],
 ["Selank Benefit – Anxiolytic benefit lens","Autonomic Nervous System & Stress Physiology","Reduced Benefit"],
 ["Semax Benefit – Stress handling lens","Autonomic Nervous System & Stress Physiology","Reduced Benefit"],
 ["FOXO4-DRI Benefit – Stress resilience","Autonomic Nervous System & Stress Physiology","Reduced Benefit"],
 ["IGF-1 LR3 Benefit – Strength potential","Athletic Performance & Recovery (Peptides - new)","Neutral Benefit"],
 ["IGF-1 LR3 Benefit – Training recovery","Athletic Performance & Recovery (Peptides - new)","Neutral Benefit"],
 ["CJC-1295 Benefit – Recovery","Athletic Performance & Recovery (Peptides - new)","Neutral Benefit"],
 ["BPC-157 Benefit – Soft tissue recovery","Tissue Healing and Inflammation Reduction (Peptides - new)","Neutral Benefit"],
 ["TA1 / Thymosin Alpha 1 Benefit – Autoimmune context","Immune System Support (Peptides - new)","Neutral Benefit"],
 ["Cerebrolysin Benefit – Vascular cognition","Cognitive Enhancement and Brain Health (Peptides - new)","Reduced Benefit"],
 ["Cerebrolysin Benefit – Neurodegeneration context","Cognitive Enhancement and Brain Health (Peptides - new)","Neutral Benefit"],
 ["Cerebrolysin Benefit – Neurodegeneration risk context","Cognitive Enhancement and Brain Health (Peptides - new)","Neutral Benefit"],
 ["Cerebrolysin Benefit – Cognitive decline susceptibility","Cognitive Enhancement and Brain Health (Peptides - new)","Reduced Benefit"],
 ["DiHexa Benefit – Neurodegeneration risk context","Cognitive Enhancement and Brain Health (Peptides - new)","Neutral Benefit"],
 ["DiHexa Benefit – Cognitive decline susceptibility","Cognitive Enhancement and Brain Health (Peptides - new)","Reduced Benefit"],
 ["Musculoskeletal Pain Propensity","ألم العضلات والعظام","Increased"],
 ["Vitamin A Benefit","Core Vitamins","Reduced"],
 ["Vitamin B12 Benefit","Core Vitamins","Reduced Need"],
 ["Vitamin D Supplemental Benefit","Core Vitamins · in 2 panels","Neutral"],
 ["Berberine Benefit","Metabolic Essentials · in 2 panels","Increased"],
 ["Hemoglobin A1c (Functional)","Gauge Group Summary","Low"],
 ["Glucose (Functional)","Gauge Group Summary","Low"],
 ["Insulin (Functional)","Gauge Group Summary","Low"],
 ["Musculoskeletal Pain Propensity","Musculoskeletal Pain","Increased"],
 ["Rheumatoid Arthritis Propensity","Rheumatoid Arthritis","Increased"],
 ["Crohn's Propensity","Crohn's","Increased"],
 ["Fish Oil Need","Supplement Need","Increased"],
 ["Metabolic Rate","Additional Traits","Below Average"],
 ["LDN response modifier","Autism Supplement Benefit and Impact","Lower response"],
];

const OPT = [
 ["Ideal Sleep Window","Ideal Sleep Window","Night Owl"],
 ["Ideal Total Time in Bed","Time in Bed · in 3 panels","Neutral - 8 to 8.5 hours"],
 ["Sleep Length Propensity","Time in Bed · in 2 panels","Shorter Sleep"],
 ["Micro-Awakenings Propensity","Time in Bed · in 2 panels","Neutral"],
 ["Sleep Deprivation Sensitivity","Sleep Deprivation Sensitivity","Neutral"],
 ["Caffeine Effects on Sleep","Sleep Sensitivity to Caffeine","Neutral"],
 ["Caffeine Metabolism (CYP1A2)","Sleep Sensitivity to Caffeine · in 2 panels","Fast Metabolism"],
 ["Deep Sleep Quality","Deep Sleep Quality · in 2 panels","Neutral"],
 ["Stress-Induced Sleeplessness Risk","Sleeplessness Risk · in 2 panels","Neutral"],
 ["Excessive Sleepiness Risk","Excessive Sleepiness","Low"],
 ["Melatonin Metabolism (CYP1A2)","Additional Sleep Genetics","Ultra-Rapid Metabolism"],
 ["Alpha Carotene Level Propensity","Vitamin A · in 2 panels","Neutral"],
 ["Beta Carotene Level Propensity","Vitamin A · in 2 panels","Neutral"],
 ["Beta-Cryptoxanthin Level Propensity","Non-Vitamin A Carotenoids","Neutral"],
 ["Benefit of Folinic Acid","B Vitamins · in 3 panels","Increased Benefit"],
 ["Vitamin B12 Level Propensity","B Vitamins · in 2 panels","Increased"],
 ["Biotin (B7) Deficiency Propensity","B Vitamins · in 3 panels","Neutral"],
 ["Vitamin C Propensity","Vitamin C","Neutral"],
 ["Vitamin D Dietary Absorption","Vitamin D · in 2 panels","Neutral"],
 ["Inactive vs Active Vitamin D Correlation","Vitamin D · in 2 panels","Neutral"],
 ["Vitamin E Inflammation Risk","Vitamin E","Neutral"],
 ["Vitamin E Absorption","Vitamin E · in 2 panels","Ideal"],
 ["Alpha Tocopherol Level Propensity","Vitamin E","Neutral"],
 ["Sodium Sensitivity","Electrolytes · in 2 panels","Neutral"],
 ["Potassium Sensitivity and Benefit","Electrolytes · in 2 panels","Neutral"],
 ["Iodine Level Propensity","Selenium and Iodine","Increased"],
 ["Iron Deficiency Risk","Iron · in 2 panels","Neutral"],
 ["Serum Iron Level Propensity","Iron · in 2 panels","Neutral"],
 ["Iron Overload Risk","Iron · in 2 panels","Neutral"],
 ["Zinc Supplementation Benefit","Copper and Zinc","Neutral"],
 ["Snacking/Emotional Eating Risk","Hunger and Fullness Sensing (new) · in 4 panels","Neutral"],
 ["Weight Loss from Low-Carb Diet","Carbohydrates (new) · in 3 panels","Increased"],
 ["Glucose Metabolism","Carbohydrates (new) · in 6 panels","Neutral"],
 ["Caffeine Effects on Glucose","Carbohydrates (new) · in 3 panels","Neutral"],
 ["Insulin Resistance Propensity (New)","Carbohydrates (new) · in 7 panels","Neutral"],
 ["Protein Benefit","Protein · in 3 panels","Improved"],
 ["APOe Status (Saturated Fat)","Saturated Fat · in 3 panels","APOe 3/3 status"],
 ["Weight Gain from Dairy Fat","Food Sensitivities · in 2 panels","Neutral"],
 ["Gluten Risk","Food Sensitivities · in 2 panels","Low"],
 ["Lactose Intolerance Risk","Food Sensitivities · in 2 panels","Low"],
 ["Interesting SNPs summary","Plant Cholesterol · in 7 panels","Info"],
 ["Plant Sterol Benefit","Plant Cholesterol · in 2 panels","Typical"],
 ["Skin Elasticity","Skin Elasticity and Hydration (new) · in 2 panels","Neutral"],
 ["Skin Antioxidant Capacity","Skin Glycation and Antioxidants · in 2 panels","Typical"],
 ["Anti-Glycation","Skin Glycation and Antioxidants · in 2 panels","Typical"],
 ["Rate of side-eye wrinkle development (Crow's Feet)","Wrinkles · in 2 panels","Neutral"],
 ["Upper eyelid Sagging","Wrinkles · in 2 panels","Neutral"],
 ["Rate of under-eye wrinkle development","Wrinkles · in 2 panels","Neutral"],
 ["Rosacea Propensity","Acne & Rosacea · in 2 panels","Neutral"],
 ["Skin Tanning Ability","Skin Response to Sunlight · in 2 panels","Reduced"],
 ["Freckles","Skin Spots · in 2 panels","Neutral Chance"],
 ["Basal Cell Carcinoma Risk","Skin Risks","Neutral"],
 ["Immune-Based Hair Loss propensity","Hair Loss","Neutral"],
 ["Hormone-related Hair loss (Male-specific)","Hair Loss","Below Average"],
 ["Red Hair Propensity","Red Hair","Increased propensity (2+ variants)"],
 ["Greying Hair","Greying Hair","Neutral"],
 ["Bloodflow Propensity","Hair Inflammation Support","Neutral"],
 ["Zinc Supplementation Benefit (Hair Health)","Hair Minerals","Neutral"],
 ["Iron Deficiency Risk (Hair Health)","Hair Minerals","Neutral"],
 ["Vitamin B12 Level Propensity (Hair Health)","Hair Vitamins","Increased"],
 ["Vitamin C Propensity (Hair Health)","Hair Vitamins","Typical"],
 ["Pesticide Risk","Environmental Sensitivity · in 2 panels","Neutral"],
 ["BPA Risk","Environmental Sensitivity · in 2 panels","Neutral"],
 ["Mold Severity Risk","Mold Severity · in 2 panels","Neutral"],
 ["Mold Metabolism (CYP1A2)","Mold Severity · in 3 panels","Rapid Metabolism"],
 ["Alcohol Dependency & Abuse Propensity","Alcohol Genetics (New) · in 2 panels","Neutral"],
 ["Alcohol Inflammation Risk","Alcohol Genetics (New) · in 2 panels","Neutral"],
 ["APOe Status","Alcohol Genetics (New) · in 6 panels","APOe 3/3 status"],
 ["Arsenic Exposure Risk","Element and Heavy Metal Management","Neutral"],
 ["Fluoride Exposure Risk","Element and Heavy Metal Management · in 2 panels","Neutral"],
 ["Acetaminophen Metabolism","Phase 1 Detoxification Systems","Normal Metabolism"],
 ["Phthalate Metabolism (CYP2B6)","Phase 1 Detoxification Systems","Normal Metabolism"],
 ["SOD2 Activity","Phase 2 Detoxification Overview","Increased"],
 ["NRF2 Activity","Phase 2 Detoxification Overview · in 5 panels","Improved"],
 ["Thyroid Hormone Conversion","Thyroid","Neutral"],
 ["TSH Level Propensity","Thyroid","Neutral"],
 ["Autoimmune Thyroid Risk Propensity","Autoimmune Thyroid","Neutral"],
 ["DHEA-S Propensity","DHEA","Neutral"],
 ["Progesterone Metabolism (CYP2C19)","Progesterone","Normal Metabolism"],
 ["Progesterone Level Propensity","Progesterone","Neutral"],
 ["LH Level Propensity","Testosterone","Neutral"],
 ["SHBG Level Propensity","Testosterone","Neutral"],
 ["Testosterone Level Propensity","Testosterone","Increased"],
 ["DHT Level Propensity","Testosterone","Neutral"],
 ["PSA Level Propensity","Testosterone","Low"],
 ["Estrogen Receptor Response","Estrogen · in 2 panels","Neutral"],
 ["Cortisol Level Propensity","Cortisol","Neutral"],
 ["Aromatase Inhibitor Side-effects Risk","Additional Hormone Genetics","Typical"],
 ["Anandamide Level Propensity","Endocannabinoid Levels","Neutral"],
 ["2-AG Level Propensity","Endocannabinoid Levels","Neutral"],
 ["Stress Adaptation","Cannabis and Stress · in 6 panels","Improved"],
 ["Cannabis Effects on Mood","Subjective Response to Cannabis","Neutral"],
 ["CBD Metabolism","Cannabinoid Metabolism","Normal Metabolism"],
 ["THC Effects on Cognition","Cannabis and Cognitive Function · in 3 panels","Protective"],
 ["Cannabis Dependence Risk","Cannabis Dependence · in 2 panels","Low"],
 ["THC Psychosis Risk","THC Psychosis Risk · in 2 panels","Low Risk"],
 ["THC Psychedelic Effect","THC Psychosis Risk · in 2 panels","Low Risk"],
 ["Ketamine Metabolism (CYP2B6)","Ketamine Response","Normal Metabolism"],
 ["Ketamine Antidepressant Effects","Ketamine Response","Neutral"],
 ["COMT (Methylation)","Methylation Expanded · in 3 panels","Neutral Activity"],
 ["AHCY","Methylation Expanded · in 4 panels","Neutral"],
 ["T2D Propensity","Diabetes","Improved"],
 ["Adiponectin Levels","Diabetes","Neutral"],
 ["Weight Regain Propensity","Obesity Risk · in 2 panels","Neutral"],
 ["CAD Propensity","Cardiovascular Genetics · in 2 panels","Neutral"],
 ["Metabolic Syndrome Propensity","Metabolic Syndrome · in 3 panels","Neutral"],
 ["Skin Hydration","Skin Elasticity and Hydration","Neutral"],
 ["Low Fat Diet Fit","Low Fat Diets · in 2 panels","Great Fit"],
 ["Stress Phenotype (COMT)","Stress Response · in 3 panels","Mediator"],
 ["CHD Benefit from Lower LDL","Lipid Impairment","Increased"],
 ["Hypertension Propensity","Hypertension","Neutral"],
 ["Wrist Fracture Propensity","Bone Density","Neutral"],
 ["Strength/Muscle Summary","Strength and Muscle · in 3 panels","Elite"],
 ["Muscle Mass","Strength and Muscle · in 3 panels","Elite"],
 ["Strength","Strength and Muscle · in 3 panels","Increased"],
 ["Muscle Recovery Speed","Fatigue and Recovery · in 2 panels","Neutral"],
 ["Muscle Endurance","Fatigue and Recovery · in 2 panels","Neutral"],
 ["Achilles Risk","Injury Risk · in 2 panels","Typical"],
 ["Cartilage Risk","Injury Risk · in 2 panels","Typical"],
 ["Power/Endurance Summary","High Intensity vs Endurance · in 2 panels","Typical"],
 ["Elite Endurance Propensity","High Intensity vs Endurance · in 2 panels","Neutral"],
 ["VO2 Max Trainability Propensity","VO2 Max · in 2 panels","Neutral"],
 ["Creatine Benefit","Additional Exercise Genetics · in 2 panels","Increased"],
 ["Caffeine Effects on Reaction Time","Additional Exercise Genetics · in 4 panels","Improved"],
 ["Vigorous Exercise Tolerance","Additional Exercise Genetics · in 2 panels","Neutral"],
 ["Ideal Diet Plan","Diet Summary · in 2 panels","High-Protein Paleo"],
 ["Paleo Fit","Paleo Diet","Good Fit*"],
 ["Vegan Diet Fit","Vegan Diet","Good Fit"],
 ["Carnivore Diet Fit","Carnivore Diet","Great Fit"],
 ["Dash Diet Fit","DASH Diet","Good Fit"],
 ["Vegetarian Diet Fit","Vegetarian Diet","Good Fit"],
 ["Low Carb Diet Fit","Low Carb Diets","Good Fit"],
 ["Macular Degeneration Risk","Macular Degeneration","Low"],
 ["Opioids Side-Effects Risk","Opioid Genetics","Neutral"],
 ["Opioid Dosing (OPRM1)","Opioid Genetics","Neutral"],
 ["DBH Levels","Cocaine Genetics","High"],
 ["Food-based Histamine Sensitivity","Histamine","Neutral"],
 ["IgE Levels","Mast Cell / IgE","Neutral"],
 ["Asthma Propensity","Asthma","Neutral"],
 ["CRP Inflammation","General Inflammation · in 2 panels","Neutral"],
 ["Mitochondrial Function","Mitochondria · in 2 panels","Increased"],
 ["Oxidative Stress Support","Oxidative Stress · in 3 panels","Increased"],
 ["Depression Propensity","Depression · in 2 panels","Low"],
 ["Anxiety Propensity","Anxiety · in 3 panels","Low"],
 ["OCD Propensity","OCD & Rumination","Low"],
 ["General Cognition","General Cognition · in 3 panels","Neutral"],
 ["Memory","General Cognition · in 3 panels","Neutral"],
 ["Attention","General Cognition · in 3 panels","Neutral"],
 ["BDNF C196T (Cognition)","General Cognition · in 4 panels","CC"],
 ["CoQ10 Supplementation Benefit","Cognition Modulators","Neutral"],
 ["Hippocampal Volume Propensity","Hippocampal Volume","Ideal"],
 ["Alzheimer's Propensity","Cognitive Impairment and Decline","Neutral"],
 ["Mild Cognitive Impairment (MCI) Propensity","Cognitive Impairment and Decline","Low"],
 ["TBI / Concussion Severity propensity","Concussion / TBI · in 2 panels","Neutral"],
 ["Vascular Dementia Propensity","Dementia","Decreased"],
 ["Lewy Body Dementia Propensity","Dementia","Neutral"],
 ["Longevity Propensity","Longevity","Neutral"],
 ["Telomere Length Propensity","Longevity","Neutral"],
 ["Cold Plunge Inflammation Benefit","Cold Plunge","Neutral"],
 ["Heat Shock Protein","Heat Shock Protein","Neutral"],
 ["Sauna Benefit","Heat Shock Protein","Neutral"],
 ["Teeth Grinding Propensity","Clench, Grind, & TMJ · in 2 panels","Neutral"],
 ["Nickel Sensitivity","Nickel Sensitivity","Neutral"],
 ["Cavity Propensity","Cavity Propensity","Neutral"],
 ["Oral Cancer Susceptibility","Oral Cancer Susceptibility","Neutral"],
 ["Tesamorelin Benefit – Long-term maintenance","Hormonal Regulation & Growth Hormone Support","Strong Benefit"],
 ["Semax Benefit – Cognitive performance","Cognitive Enhancement & Brain Health · in 2 panels","Increased Benefit"],
 ["Cerebrolysin Benefit – Global cognition","Cognitive Enhancement & Brain Health · in 2 panels","Increased Benefit"],
 ["DiHexa Benefit – Global cognition","Cognitive Enhancement & Brain Health · in 2 panels","Increased Benefit"],
 ["TA1 / Thymosin Alpha 1 Benefit – Immune","Immune System Support (Peptides) · in 2 panels","Increased Benefit"],
 ["TB4 / TB-500 Benefit – Resolution capacity","Immune System Support (Peptides) · in 2 panels","Increased Benefit"],
 ["BPC-157 Benefit – Inflammation resolution","Tissue Healing & Inflammation Reduction (Peptides)","Increased Benefit"],
 ["TB4 / TB-500 Benefit – Connective tissue","Tissue Healing & Inflammation Reduction (Peptides)","Increased Benefit"],
 ["Epitalon Benefit – General longevity","Longevity & Anti-Aging (Peptides) · in 2 panels","Increased Benefit"],
 ["FOXO4-DRI Benefit – Healthy aging","Longevity & Anti-Aging (Peptides) · in 2 panels","Increased Benefit"],
 ["TA1 / Thymosin Alpha 1 Benefit – Anti-inflammatory","Longevity & Anti-Aging (Peptides) · in 2 panels","Strong Benefit"],
 ["5-amino-1MQ Benefit – Weight maintenance","Fat Loss & Body Composition (Peptides) · in 2 panels","Strong Benefit"],
 ["AOD-9604 Benefit – Weight maintenance","Fat Loss & Body Composition (Peptides) · in 2 panels","Strong Benefit"],
 ["TB4 / TB-500 Benefit – Pain","Athletic Performance & Recovery (Peptides) · in 2 panels","Increased Benefit"],
 ["BPC-157 Benefit – Pain burden","Athletic Performance & Recovery (Peptides)","Increased Benefit"],
 ["MOTS-C Benefit – Exercise adaptation","Athletic Performance & Recovery (Peptides) · in 2 panels","Increased Benefit"],
 ["GHK-Cu Benefit – Skin aging susceptibility","Skin, Hair, and Cosmetic Health (Peptides) · in 2 panels","Increased Benefit"],
 ["Melanotan-2 Benefit – Melanocortin","Libido and Sexual Function (Peptides) · in 2 panels","Strong Benefit"],
 ["Teduglutide Benefit – Barrier integrity","Fat Loss & Body Composition (GLP1 and GLP2) · in 2 panels","Strong Benefit"],
 ["Semaglutide Benefit – Satiety","Fat Loss & Body Composition (GLP1 and GLP2) · in 2 panels","Increased Benefit"],
 ["Retatrutide Benefit – Glycemic response","Fat Loss & Body Composition (GLP1 and GLP2) · in 2 panels","Increased Benefit"],
 ["AOD-9604 Benefit – Macronutrient response","Fat Loss & Body Composition (Peptides - new)","Strong Benefit"],
 ["5-amino-1MQ Benefit – Macronutrient response","Fat Loss & Body Composition (Peptides - new)","Strong Benefit"],
 ["Tirzepatide Benefit – Satiety","Fat Loss & Body Composition (Peptides - new)","Increased Benefit"],
 ["Semaglutide Benefit – Maintaining weight loss","Fat Loss & Body Composition (Peptides - new)","Strong Benefit"],
 ["Retatrutide Benefit – Maintaining weight loss","Fat Loss & Body Composition (Peptides - new)","Strong Benefit"],
 ["Retatrutide Benefit – Satiety","Fat Loss & Body Composition (Peptides - new)","Increased Benefit"],
 ["Tirzepatide Benefit – Maintaining weight loss","Fat Loss & Body Composition (GLP-1 and GLP-2)","Strong Benefit"],
 ["Semaglutide Benefit – Glycemic response","Fat Loss & Body Composition (GLP-1 and GLP-2)","Increased Benefit"],
 ["BPC-157 Benefit – Gut barrier","Gut Health & Nutrient Absorption (Peptides - new)","Strong Benefit"],
 ["Teduglutide Benefit – Absorptive capacity proxy","Gut Health & Nutrient Absorption (Peptides - new)","Increased Benefit"],
 ["GHK-Cu Benefit – Hair growth support proxy","Skin, Hair, and Cosmetic Health (Peptides - new)","Increased Benefit"],
 ["GHK-Cu Benefit – Scalp microcirculation","Skin, Hair, and Cosmetic Health (Peptides - new)","Strong Benefit"],
 ["GHK-Cu Benefit – Barrier","Skin, Hair, and Cosmetic Health (Peptides - new)","Strong Benefit"],
 ["GHK-Cu Benefit – Oxidative stress handling","Skin, Hair, and Cosmetic Health (Peptides - new)","Increased Benefit"],
 ["GHK-Cu Benefit – Dermal structure","Skin, Hair, and Cosmetic Health (Peptides - new)","Increased Benefit"],
 ["Melanotan-2 Benefit – Photoaging susceptibility","Skin, Hair, and Cosmetic Health (Peptides - new)","Increased Benefit"],
 ["Melanotan-2 Benefit – Pigmentation change proxy","Skin, Hair, and Cosmetic Health (Peptides - new)","Strong Benefit"],
 ["Melanotan-2 Benefit – UV damage resilience","Skin, Hair, and Cosmetic Health (Peptides - new)","Strong Benefit"],
 ["Selank Benefit – Stress↔sleep coupling lens","Autonomic Nervous System & Stress Physiology","Increased Benefit"],
 ["Semax Benefit – Mood↔sleep coupling lens","Autonomic Nervous System & Stress Physiology","Strong Benefit"],
 ["Epitalon Benefit – Sleep","Autonomic Nervous System & Stress Physiology","Increased Benefit"],
 ["FOXO4-DRI Benefit – Inflammatory aging lens","Longevity & Anti-Aging (Peptides - new)","Increased Benefit"],
 ["FOXO4-DRI Benefit – Cellular aging","Longevity & Anti-Aging (Peptides - new)","Increased Benefit"],
 ["Epitalon Benefit – Telomere maintenance","Longevity & Anti-Aging (Peptides - new)","Increased Benefit"],
 ["AOD-9604 Benefit – Activity synergy lens","Athletic Performance & Recovery (Peptides - new)","Strong Benefit"],
 ["TA1 / Thymosin Alpha 1 Benefit – Baseline inflammation","Tissue Healing and Inflammation Reduction (Peptides)","Increased Benefit"],
 ["BPC-157 Benefit – Joint","Tissue Healing and Inflammation Reduction (Peptides)","Increased Benefit"],
 ["IGF-1 LR3 Benefit – Bone support","Tissue Healing and Inflammation Reduction (Peptides)","Increased Benefit"],
 ["CJC-1295 Benefit – Bone remodeling","Tissue Healing and Inflammation Reduction (Peptides)","Increased Benefit"],
 ["Semax Benefit – Executive function","Cognitive Enhancement and Brain Health (Peptides)","Increased Benefit"],
 ["Semax Benefit – Attention","Cognitive Enhancement and Brain Health (Peptides)","Increased Benefit"],
 ["Cerebrolysin Benefit – Parkinsonian dementia","Cognitive Enhancement and Brain Health (Peptides)","Increased Benefit"],
 ["DiHexa Benefit – Memory","Cognitive Enhancement and Brain Health (Peptides)","Increased Benefit"],
 ["DiHexa Benefit – Focus","Cognitive Enhancement and Brain Health (Peptides)","Increased Benefit"],
 ["Telomerlängenveranlagung","Langlebigkeit","Neutral"],
 ["Langlebigkeitsveranlagung","Langlebigkeit","Neutral"],
 ["Vitamin B6 Benefit","Core Vitamins","Strong Benefit"],
 ["Vitamin B9 Benefit","Core Vitamins","Strong Benefit"],
 ["Vitamin C Benefit","Core Vitamins","Benefit"],
 ["Fish Oil Benefit","Core Vitamins","Increased"],
 ["CBD Benefit to Stress","Metabolic Essentials","Benefit"],
 ["Choline Supplementation Benefit","Metabolic Essentials","Benefit"],
 ["Magnesium Supplemental Benefit","Metabolic Essentials · in 2 panels","Increased Benefit"],
 ["Propofol Susceptibility","Propofol","Neutral"],
 ["Multiple Sclerosis Propensity","Multiple Sclerosis","Decreased"],
 ["Chronic Fatigue Propensity","Chronic Fatigue","Neutral"],
 ["Klotho Level Propensity","Klotho","Neutral"],
 ["Psychedelic Response (HTR2A & HTR2C)","Psychedelics (req PGx)","Neutral"],
 ["Neurotransmitter Breakdown (Psychedelics)","Psychedelics (req PGx)","Neutral"],
 ["Psilocybin Breakdown (UGT1A9/10 Activity)","Psychedelics (req PGx)","Neutral"],
 ["MDMA Response (CYP2C19)","Psychedelics (req PGx)","Normal Metabolism"],
 ["Histamine Blocker Benefit","Supplement Need","Neutral"],
 ["OXTR","Romantic Phenotype","Neutral"],
 ["COMT (Sexual/Romantic)","Romantic Phenotype","Normal Function"],
 ["Novelty-Seeking","Romantic Phenotype · in 2 panels","Neutral"],
 ["Exercise Motivation","Additional Traits","Neutral"],
 ["Latanoprost Response Propensity","Hair Meds","Improved"],
];

const DATA = {att:ATT, mod:MOD, opt:OPT};

/* marker -> priority theme (Needs Attention only) */
const THEME_MAP = {
  "Dietary Fat Response":"fats","Saturated Fat Response":"fats","Omega-6 Risk":"fats","Plant Sterol Risk":"fats","Keto Diet Fit":"fats",
  "Saturated Fat Response (Speedometer)":"fats","Saturated Fat Response (Gradient)":"fats","Saturated Fat Response (Dot/Icon)":"fats","Saturated Fat Response (Circle)":"fats",
  "Methylation Propensity":"detox","MTRR":"detox","NAT2 Acetylation (Standard)":"detox","NSAIDs Metabolism (CYP2C9)":"detox","Mercury Exposure Risk":"detox","Lead Exposure Risk":"detox",
  "Gut Permeability":"gut","Ulcerative Colitis Propensity":"gut","IL-10 Inflammation Risk":"gut","Gum Inflammation":"gut",
  "Vitamin A Conversion":"micro","Lutein Level Propensity":"micro","Zeaxanthin Level Propensity":"micro","Copper Imbalance Risk":"micro","Nitric Oxide Production":"micro",
  "UV Resilience":"skin","Sunspots":"skin","Nitric Oxide Production (Hair Health)":"skin","Vitamin A Conversion (Hair Health)":"skin","Dutasteride Response Propensity":"skin","Minoxidil Response Propensity":"skin",
  "Mood-induced Sleeplessness Risk":"mood","Postpartum Depression Propensity":"mood",
};
const THEME_LABEL = {fats:"Dietary fats & cardiometabolic",detox:"Methylation & detoxification",gut:"Gut & systemic inflammation",micro:"Micronutrients & antioxidants",skin:"Skin & hair",mood:"Mood & sleep"};
const COLLAPSED = 14; // items shown before "show more"
const infoSVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';

function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function itemHTML(row){
  return '<div class="item" tabindex="0" role="button" data-name="'+esc(row[0])+'" data-panel="'+esc(row[1])+'" data-status="'+esc(row[2])+'" data-theme="'+(THEME_MAP[row[0]]||'')+'" data-search="'+esc((row[0]+' '+row[1]+' '+row[2]).toLowerCase())+'">'+
    '<span class="dot"></span>'+
    '<div class="txt"><div class="nm">'+esc(row[0])+'</div><div class="pn">'+esc(row[1])+'</div></div>'+
    '<span class="badge" title="'+esc(row[2])+'">'+esc(row[2])+'</span>'+
    '<span class="info">'+infoSVG+'</span>'+
  '</div>';
}

document.querySelectorAll('.section').forEach(sec=>{
  const key = sec.dataset.sec;
  const grid = sec.querySelector('.grid');
  grid.innerHTML = DATA[key].map(itemHTML).join('');
  const btn = sec.querySelector('.show-toggle');
  sec.dataset.expanded = "false";
  applyCollapse(sec);
  btn.addEventListener('click',()=>{
    sec.dataset.expanded = sec.dataset.expanded==="true" ? "false":"true";
    applyCollapse(sec);
    if(sec.dataset.expanded==="false") sec.scrollIntoView({behavior:'smooth',block:'start'});
  });
});

function applyCollapse(sec){
  const searching = !!document.getElementById('search').value.trim();
  const items = [...sec.querySelectorAll('.item')];
  const visibleItems = items.filter(i=>!i.classList.contains('hide'));
  const expanded = sec.dataset.expanded==="true" || searching;
  const btn = sec.querySelector('.show-toggle');
  visibleItems.forEach((it,i)=>{ it.style.display = (expanded || i<COLLAPSED) ? '' : 'none'; });
  // hidden (search-filtered) items always display:none
  items.filter(i=>i.classList.contains('hide')).forEach(i=>i.style.display='none');
  if(visibleItems.length>COLLAPSED && !searching){
    btn.style.display='block';
    btn.textContent = expanded ? 'Show less' : ('Show all '+visibleItems.length+' markers');
  } else {
    btn.style.display='none';
  }
}

/* ---------- SEARCH ---------- */
const searchEl = document.getElementById('search');
searchEl.addEventListener('input',()=>{
  if(activeTheme) clearThemeFilter(true);
  const q = searchEl.value.trim().toLowerCase();
  document.querySelectorAll('.section').forEach(sec=>{
    let shown=0;
    sec.querySelectorAll('.item').forEach(it=>{
      const match = !q || it.dataset.search.includes(q);
      it.classList.toggle('hide',!match);
      if(match) shown++;
    });
    sec.querySelector('.no-results').style.display = shown? 'none':'block';
    applyCollapse(sec);
  });
});

/* ---------- THEME FILTER ---------- */
let activeTheme = null;
const tfBar = document.getElementById('tfBar');
const tfName = document.getElementById('tfName');
const tfCount = document.getElementById('tfCount');

function applyThemeFilter(id){
  activeTheme = id;
  searchEl.value = '';
  document.querySelectorAll('.theme').forEach(c=>c.classList.toggle('active', c.dataset.theme===id));
  let count = 0;
  document.querySelectorAll('.section').forEach(sec=>{
    if(sec.dataset.sec==='att'){
      sec.style.display='';
      sec.querySelectorAll('.item').forEach(it=>{
        const m = it.dataset.theme===id;
        it.classList.toggle('hide',!m);
        if(m) count++;
      });
      sec.dataset.expanded='true';
      sec.querySelector('.no-results').style.display = count? 'none':'block';
      applyCollapse(sec);
    } else {
      sec.style.display='none';
    }
  });
  tfName.textContent = THEME_LABEL[id];
  tfCount.textContent = count;
  tfBar.style.display='flex';
  tfBar.scrollIntoView({behavior:'smooth',block:'start'});
}

function clearThemeFilter(keepScroll){
  if(!activeTheme) return;
  activeTheme = null;
  document.querySelectorAll('.theme').forEach(c=>c.classList.remove('active'));
  tfBar.style.display='none';
  document.querySelectorAll('.section').forEach(sec=>{
    sec.style.display='';
    sec.querySelectorAll('.item').forEach(it=>it.classList.remove('hide'));
    sec.dataset.expanded='false';
    sec.querySelector('.no-results').style.display='none';
    applyCollapse(sec);
  });
}

document.querySelectorAll('.theme').forEach(card=>{
  card.addEventListener('click',()=>{
    const id = card.dataset.theme;
    if(id===activeTheme){ clearThemeFilter(); card.scrollIntoView({behavior:'smooth',block:'center'}); }
    else applyThemeFilter(id);
  });
});
document.getElementById('tfClear').addEventListener('click',()=>{
  const summary = document.querySelector('.summary');
  clearThemeFilter();
  summary.scrollIntoView({behavior:'smooth',block:'start'});
});

/* ---------- MARKER DETAIL POPUP ---------- */
/* hand-written plain-terms for the flagged (Needs Attention) markers */
const EXPLAIN = {
  "Mood-induced Sleeplessness Risk":"You're genetically more prone to losing sleep when you're stressed or your mood dips. Wind-down routines and stress management tend to pay off more for you than for the average person.",
  "Vitamin A Conversion":"Your body is less efficient at turning plant-based vitamin A (beta-carotene from things like carrots) into the active form it can actually use. Getting some pre-formed vitamin A from food, or checking your level, can matter more for you.",
  "Zeaxanthin Level Propensity":"You tend to carry less zeaxanthin, an antioxidant that helps protect the eyes and skin from light damage. Foods rich in it (leafy greens, eggs) are worth prioritising.",
  "Lutein Level Propensity":"You tend to carry less lutein, an antioxidant that protects the eyes (especially the macula). Leafy greens and similar foods help top it up.",
  "Nitric Oxide Production":"You make less nitric oxide, the molecule that helps blood vessels relax and widen. It's relevant to circulation, blood pressure and exercise performance.",
  "Copper Imbalance Risk":"You have a higher chance of copper and zinc being out of balance. It's worth checking levels before taking supplements, since over-correcting either one can throw off the other.",
  "Dietary Fat Response":"Your body responds less well to a high-fat diet overall, so both the amount and the type of fat you eat matter more for you than for most people.",
  "Saturated Fat Response":"You handle saturated fat poorly — it tends to push your cholesterol and related markers up more than it would for the average person. Choosing unsaturated fats is especially helpful for you.",
  "Omega-6 Risk":"You're prone to running high on omega-6 (a more inflammatory fat) relative to omega-3. Balancing the two — more fish/omega-3, less processed seed oil — is useful for you.",
  "Plant Sterol Risk":"You may absorb more plant sterols than is ideal, which can affect heart-health markers. Worth flagging if you use sterol-fortified foods or supplements.",
  "UV Resilience":"Your skin is genetically less able to defend itself against UV damage, so sun protection (shade, SPF, clothing) matters more for you than average.",
  "Sunspots":"You're more prone to sun-related spots and uneven pigmentation, which reinforces the case for steady sun protection.",
  "Nitric Oxide Production (Hair Health)":"Low nitric oxide can mean less blood flow to the scalp and follicles, which is relevant to hair health.",
  "Vitamin A Conversion (Hair Health)":"Reduced ability to make active vitamin A, which hair follicles rely on — the same conversion issue seen elsewhere in your results.",
  "Mercury Exposure Risk":"You clear mercury less efficiently, so high-mercury foods (like certain large fish) and other exposures carry more risk for you. Being mindful of sources helps.",
  "Lead Exposure Risk":"You're more sensitive to lead exposure, so minimising sources (old paint, certain water pipes, some imported goods) is worthwhile.",
  "NSAIDs Metabolism (CYP2C9)":"You break down certain anti-inflammatory painkillers (NSAIDs like ibuprofen) slowly, so a standard dose can build up more in your system. This is useful for your doctor or pharmacist to know.",
  "NAT2 Acetylation (Standard)":"You're a \u201Cslow acetylator,\u201D meaning you process some medications and food compounds slowly. It can change how certain drugs act and is good context for prescribing.",
  "Methylation Propensity":"A key chemical \u201Ctagging\u201D process (methylation) tends to run low for you. It influences detox, mood chemicals and how you use B vitamins — so B-vitamin status is worth attention.",
  "MTRR":"An enzyme that recycles vitamin B12 for methylation works less well for you (you carry two variants). Keeping B12 and folate in good shape helps support this pathway.",
  "Keto Diet Fit":"Your genetics suggest a ketogenic (very high-fat) diet is a poor fit — which lines up with your saturated-fat results. Lower-fat, balanced eating is likely to suit you better.",
  "IL-10 Inflammation Risk":"Your body's natural \u201Ccalm-down\u201D anti-inflammatory signal (IL-10) is weaker, so inflammation can run higher. Anti-inflammatory habits are especially worthwhile.",
  "Postpartum Depression Propensity":"You carry a higher genetic tendency toward mood changes after childbirth. It isn't a prediction — it's helpful context for planning support and check-ins around that time.",
  "Gum Inflammation":"You're more prone to gum inflammation, so consistent dental hygiene and regular check-ups matter more for you.",
  "Saturated Fat Response (Speedometer)":"A demo of your saturated-fat result shown as a different dial style. The meaning is the same: you respond poorly to saturated fat.",
  "Saturated Fat Response (Gradient)":"A demo of your saturated-fat result shown as a different dial style. The meaning is the same: you respond poorly to saturated fat.",
  "Saturated Fat Response (Dot/Icon)":"A demo of your saturated-fat result shown as a different dial style. The meaning is the same: you respond poorly to saturated fat.",
  "Saturated Fat Response (Circle)":"A demo of your saturated-fat result shown as a different dial style. The meaning is the same: you respond poorly to saturated fat.",
  "Ulcerative Colitis Propensity":"You carry a higher genetic tendency toward ulcerative colitis, an inflammatory bowel condition. This is a propensity only — not a diagnosis — and worth mentioning if you ever have gut symptoms.",
  "Gut Permeability":"You have a tendency toward a \u201Cleakier\u201D gut lining, which can let more through and feed inflammation. Gut-supportive habits may help you more than average.",
  "Dutasteride Response Propensity":"You may respond less than average to dutasteride, a hair-loss medication — useful to know if you're considering treatment options.",
  "Minoxidil Response Propensity":"You may respond less than average to minoxidil, a common topical hair-loss treatment — useful context when weighing options.",
};

function plainFor(name,panel,status,tone){
  if(EXPLAIN[name]) return EXPLAIN[name];
  let topic=panel.replace(/\s·.*$/,'').replace(/\s*\([^)]*\)/,'').trim();
  topic = topic ? topic.toLowerCase() : 'this trait';
  if(tone==='opt')
    return 'This marker relates to '+topic+'. Your result \u2014 \u201C'+status+'\u201D \u2014 falls in the optimal range, so it reads as a strength and generally isn\u2019t something you need to act on.';
  if(tone==='mod')
    return 'This marker relates to '+topic+'. Your result \u2014 \u201C'+status+'\u201D \u2014 is in the moderate range: broadly fine, but a useful one to revisit as your habits, age or lab results change.';
  return 'This marker relates to '+topic+'. Your result \u2014 \u201C'+status+'\u201D \u2014 is flagged for a closer look, which makes it a good one to raise with your clinician.';
}

/* supplement considerations + cross-panel appearances (curated for flagged markers) */
const SUPP_SET = {
  sleep:[["Saffron Extract",5],["Omega-3 EPA/DHA 2:1",4],["L-Theanine",3]],
  fats:[["Omega-3 EPA/DHA",5],["Soluble Fiber (Psyllium)",4],["Bergamot Extract",3]],
  omega:[["Omega-3 EPA/DHA",5],["Algae Oil",4],["Evening Primrose (GLA)",2]],
  sterol:[["Omega-3 EPA/DHA",3],["Soluble Fiber",3],["Plant Stanols (caution)",2]],
  vitA:[["Preformed Vitamin A (Retinol)",5],["Zinc",3],["Beta-Carotene",2]],
  carotenoid:[["Lutein",5],["Zeaxanthin",4],["Bilberry Extract",3]],
  no:[["L-Citrulline",5],["Beetroot Extract",4],["L-Arginine",3]],
  copper:[["Zinc",4],["Balanced Cu:Zn Complex",3],["Vitamin C",2]],
  methyl:[["Methylfolate (5-MTHF)",5],["Methylcobalamin (B12)",5],["Riboflavin (B2)",3]],
  metal:[["N-Acetyl Cysteine (NAC)",4],["Selenium",4],["Chlorella",3]],
  uv:[["Astaxanthin",5],["Polypodium leucotomos",4],["Vitamin C + E",3]],
  skinspot:[["Niacinamide",4],["Vitamin C",4],["Polypodium leucotomos",3]],
  hair:[["Saw Palmetto",4],["Biotin",3],["Zinc",3]],
  inflam:[["Omega-3 EPA/DHA",5],["Curcumin",4],["Vitamin D",3]],
  gut:[["L-Glutamine",5],["Zinc Carnosine",4],["Probiotics",3]],
  ibd:[["Omega-3 EPA/DHA",4],["Curcumin",4],["Vitamin D",3]],
  gum:[["Coenzyme Q10",4],["Vitamin C",4],["Omega-3 EPA/DHA",3]],
  mood:[["Omega-3 EPA/DHA",5],["Methylfolate",4],["Vitamin D",3]],
};
const DETAIL = {
  "Mood-induced Sleeplessness Risk":{s:"sleep",a:[["Depression","Emotional Health 2.0"],["Depression","Preconception Genetics"],["Autism Supplement Benefit and Impact","New Sections"]]},
  "Dietary Fat Response":{s:"fats"},"Saturated Fat Response":{s:"fats"},
  "Saturated Fat Response (Speedometer)":{s:"fats"},"Saturated Fat Response (Gradient)":{s:"fats"},
  "Saturated Fat Response (Dot/Icon)":{s:"fats"},"Saturated Fat Response (Circle)":{s:"fats"},
  "Omega-6 Risk":{s:"omega"},"Plant Sterol Risk":{s:"sterol"},"Keto Diet Fit":{s:"fats"},
  "Vitamin A Conversion":{s:"vitA"},"Vitamin A Conversion (Hair Health)":{s:"vitA"},
  "Lutein Level Propensity":{s:"carotenoid"},"Zeaxanthin Level Propensity":{s:"carotenoid"},
  "Nitric Oxide Production":{s:"no"},"Nitric Oxide Production (Hair Health)":{s:"no"},
  "Copper Imbalance Risk":{s:"copper"},
  "Methylation Propensity":{s:"methyl"},"MTRR":{s:"methyl"},
  "Mercury Exposure Risk":{s:"metal"},"Lead Exposure Risk":{s:"metal"},
  "UV Resilience":{s:"uv"},"Sunspots":{s:"skinspot"},
  "Dutasteride Response Propensity":{s:"hair"},"Minoxidil Response Propensity":{s:"hair"},
  "IL-10 Inflammation Risk":{s:"inflam"},"Gut Permeability":{s:"gut"},"Ulcerative Colitis Propensity":{s:"ibd"},
  "Gum Inflammation":{s:"gum"},"Postpartum Depression Propensity":{s:"mood"},
};
const SUPP_GRAD=['linear-gradient(135deg,#f6a623,#e5732a)','linear-gradient(135deg,#56ab8f,#2f9e54)','linear-gradient(135deg,#5b8def,#6a5acd)','linear-gradient(135deg,#e36b8f,#d6457f)','linear-gradient(135deg,#7aa5c7,#4f7ea8)'];
const PILL_SVG='<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/></svg>';
const LEAF_SVG='<svg viewBox="0 0 24 24"><path d="M4 20c0-9 7-14 16-14 0 9-7 14-16 14z"/><path d="M4 20c4-6 8-8 12-9"/></svg>';
const GAUGE={att:{w:78,c:'var(--att)',t:'#c6383d'},mod:{w:55,c:'var(--amber)',t:'#bb7e14'},opt:{w:86,c:'var(--green)',t:'#218045'}};

const mkOverlay=document.getElementById('mkOverlay');
const SUPP_IMG={
  saffron:"assets/img/supplements/saffron.jpg",
  theanine:"assets/img/supplements/theanine.jpg",
  zeaxanthin:"assets/img/supplements/zeaxanthin.jpg",
  lutein:"assets/img/supplements/lutein.jpg",
  dha:"assets/img/supplements/dha.jpg",
  beetroot:"assets/img/supplements/beetroot.jpg",
  citrulline:"assets/img/supplements/citrulline.jpg",
  magnesium:"assets/img/supplements/magnesium.jpg",
  omega21:"assets/img/supplements/omega21.jpg",
  psyllium:"assets/img/supplements/psyllium.jpg",
  berberine:"assets/img/supplements/berberine.jpg",
  omega31:"assets/img/supplements/omega31.jpg",
  zinc:"assets/img/supplements/zinc.jpg",
  copper:"assets/img/supplements/copper.jpg",
  vitaminc:"assets/img/supplements/vitaminc.jpg",
  bergamot:"assets/img/supplements/bergamot.jpg"
};
function imgFor(name){
  const n=name.toLowerCase();
  if(/saffron/.test(n)) return SUPP_IMG.saffron;
  if(/theanine|matcha/.test(n)) return SUPP_IMG.theanine;
  if(/omega/.test(n)||/epa\/dha|dha\/epa|fish oil/.test(n)) return (/3:1|dha\/epa/.test(n)?SUPP_IMG.omega31:SUPP_IMG.omega21);
  if(/\bdha\b/.test(n)&&!/epa/.test(n)) return SUPP_IMG.dha;
  if(/zeaxanthin/.test(n)) return SUPP_IMG.zeaxanthin;
  if(/lutein/.test(n)) return SUPP_IMG.lutein;
  if(/beet/.test(n)) return SUPP_IMG.beetroot;
  if(/citrulline/.test(n)) return SUPP_IMG.citrulline;
  if(/magnesium/.test(n)) return SUPP_IMG.magnesium;
  if(/psyllium/.test(n)) return SUPP_IMG.psyllium;
  if(/berberine/.test(n)) return SUPP_IMG.berberine;
  if(/bergamot/.test(n)) return SUPP_IMG.bergamot;
  if(/\bzinc\b/.test(n)) return SUPP_IMG.zinc;
  if(/copper/.test(n)) return SUPP_IMG.copper;
  if(/vitamin c\b/.test(n)) return SUPP_IMG.vitaminc;
  return null;
}
/* product-style illustration tiles (when no real photo) */
const ARCH={
  CAP:'<svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><rect width="160" height="96" fill="#f1efec"/><ellipse cx="80" cy="80" rx="42" ry="6" fill="#000" opacity=".08"/><g transform="rotate(-18 80 48)"><rect x="44" y="37" width="72" height="26" rx="13" fill="#fff" stroke="#e3e0db"/><path d="M44 50a13 13 0 0113-13h23v26H57a13 13 0 01-13-13z" fill="#e5232a"/><rect x="50" y="42" width="13" height="6" rx="3" fill="#fff" opacity=".45"/></g></svg>',
  SOFT:'<svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><rect width="160" height="96" fill="#f2efe9"/><ellipse cx="80" cy="80" rx="32" ry="6" fill="#000" opacity=".08"/><ellipse cx="80" cy="48" rx="30" ry="23" fill="#e7a23c"/><ellipse cx="80" cy="48" rx="30" ry="23" fill="none" stroke="#cf8a23"/><ellipse cx="70" cy="39" rx="9" ry="5" fill="#fff" opacity=".45"/></svg>',
  MIN:'<svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><rect width="160" height="96" fill="#eef0f2"/><ellipse cx="80" cy="78" rx="40" ry="6" fill="#000" opacity=".07"/><path d="M52 70c6-20 16-30 28-30s22 10 28 30z" fill="#9aa6b4"/><path d="M58 70c5-14 12-21 22-21s17 7 22 21z" fill="#b6c0cc"/><circle cx="72" cy="59" r="2.1" fill="#fff" opacity=".55"/><circle cx="88" cy="63" r="1.8" fill="#fff" opacity=".55"/></svg>',
  HERB:'<svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><rect width="160" height="96" fill="#eef1ec"/><ellipse cx="80" cy="80" rx="32" ry="6" fill="#000" opacity=".07"/><path d="M80 76V38" stroke="#5a7d3c" stroke-width="3"/><path d="M80 52c-14-2-22-10-24-22 12 0 22 6 24 16zM80 64c14-2 22-10 24-22-12 0-22 6-24 16z" fill="#5e9a40"/><path d="M80 66c-12-1-19-8-21-18 10 0 19 6 21 14z" fill="#74b352"/></svg>',
  POW:'<svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><rect width="160" height="96" fill="#f2efe9"/><ellipse cx="80" cy="80" rx="38" ry="6" fill="#000" opacity=".07"/><path d="M52 66c4-16 14-23 28-23s24 7 28 23z" fill="#d8c4a0"/><ellipse cx="80" cy="66" rx="28" ry="6" fill="#e7d8ba"/><rect x="98" y="38" width="32" height="9" rx="4" transform="rotate(22 98 38)" fill="#cfd3d8"/></svg>',
  PRO:'<svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice"><rect width="160" height="96" fill="#eef0f2"/><ellipse cx="80" cy="80" rx="38" ry="6" fill="#000" opacity=".07"/><rect x="46" y="36" width="68" height="26" rx="13" fill="#fff" stroke="#e0e3e7"/><path d="M46 49a13 13 0 0113-13h21v26H59a13 13 0 01-13-13z" fill="#5b8def"/><circle cx="92" cy="45" r="2.4" fill="#5b8def"/><circle cx="100" cy="52" r="2" fill="#5b8def"/><circle cx="89" cy="54" r="1.6" fill="#5b8def"/></svg>'
};
function archFor(name){
  const n=name.toLowerCase();
  if(/probiotic|lactobac|bifido|saccharomyces/.test(n)) return ARCH.PRO;
  if(/vitamin d|vitamin e|vitamin a|coq10|astaxanthin|cbd|retinol|tocopherol|cholecalciferol|softgel|\boil\b/.test(n)) return ARCH.SOFT;
  if(/magnesium|zinc|selenium|copper|iron|calcium|potassium|chromium|iodine|electrolyte|mineral|sodium|manganese/.test(n)) return ARCH.MIN;
  if(/curcumin|turmeric|berberine|ashwagandha|milk thistle|ginseng|saw palmetto|bacopa|lion|green tea|quercetin|bilberry|beet|sulforaphane|bergamot|lutein|zeaxanthin|carotene|herb|extract|botanical|sterol|nettle|root|rhodiola|ginkgo|chlorella|spirulina|silymarin|polypodium/.test(n)) return ARCH.HERB;
  if(/protein|whey|eaa|creatine|collagen|glutamine|carnitine|citrulline|arginine|glycine|fiber|psyllium|powder|amino|beta-alanine|n-acetyl|\bnac\b|alpha-lipoic|pqq|taurine|inositol/.test(n)) return ARCH.POW;
  return ARCH.CAP;
}
/* keyword -> 3 supplement picks, so every marker has a set */
const SUPP_RULES=[
  [/sleeplessness|insomnia|sleep movement|deep sleep|sleep quality|time in bed/,['Magnesium Glycinate','L-Theanine','Glycine']],
  [/caffeine/,['L-Theanine','Magnesium Glycinate','Vitamin C']],
  [/sleep|circadian|melatonin/,['Magnesium Glycinate','L-Theanine','Glycine']],
  [/methylation|mthfr|mtrr|homocyst|folate|\bb9\b|\bb12\b|b vitamin|b-vitamin/,['Methylfolate (5-MTHF)','Methylcobalamin (B12)','Riboflavin (B2)']],
  [/choline/,['Choline (Alpha-GPC)','Citicoline','Phosphatidylserine']],
  [/saturated fat|dietary fat|cholesterol|lipid|omega|plant sterol|cardio|cardiovascular|thrombosis|apoe/,['Omega-3 EPA/DHA','Soluble Fiber (Psyllium)','Bergamot Extract']],
  [/mitochond|\benergy\b|metabolic optimization|\bnad\b/,['CoQ10','PQQ','Alpha-Lipoic Acid']],
  [/keto|carbohydrate|glucose|insulin|glycemic|metabolic syndrome|hunger|fullness|appetite|fat loss|body composition|weight/,['Berberine','Soluble Fiber (Psyllium)','Chromium']],
  [/growth hormone|hormonal regulation|testosterone|\bigf\b/,['Zinc','Vitamin D3','Ashwagandha']],
  [/progesterone|estrogen|female hormone|menstru/,['Vitamin B6','Magnesium Glycinate','Vitamin D3']],
  [/cognit|brain|memory|focus|neuro|nootropic/,['Omega-3 EPA/DHA','Bacopa Monnieri',"Lion's Mane"]],
  [/mood|depress|anxiety|stress|autonomic|nervous/,['Omega-3 EPA/DHA','Ashwagandha','Magnesium Glycinate']],
  [/bone|osteo|density/,['Vitamin D3','Vitamin K2','Calcium']],
  [/athletic|performance|recovery|strength|muscle|power|endurance|vo2|exercise|fitness|injury|fatigue/,['Creatine Monohydrate','Whey / EAA Protein','Beta-Alanine']],
  [/mercury|lead|heavy metal|\belement\b|toxic|mold/,['N-Acetyl Cysteine (NAC)','Selenium','Chlorella']],
  [/detox|phase 1|phase 2|glutathione|\bcyp\b|nat2|acetylation/,['N-Acetyl Cysteine (NAC)','Milk Thistle','Sulforaphane']],
  [/gut|permeab|colitis|\bibd\b|nutrient absorption|digest|microbiome/,['L-Glutamine','Zinc Carnosine','Probiotics']],
  [/gum|periodont|oral/,['CoQ10','Vitamin C','Omega-3 EPA/DHA']],
  [/inflammat|il-10|il10|immune|cytokine/,['Omega-3 EPA/DHA','Curcumin','Vitamin D3']],
  [/nitric oxide/,['L-Citrulline','Beetroot Extract','L-Arginine']],
  [/lutein|zeaxanthin|carotenoid|macular|\beye\b|vision/,['Lutein','Zeaxanthin','Bilberry Extract']],
  [/vitamin a/,['Preformed Vitamin A','Zinc','Beta-Carotene']],
  [/vitamin c/,['Vitamin C','Quercetin','Zinc']],
  [/vitamin d/,['Vitamin D3','Vitamin K2','Magnesium Glycinate']],
  [/vitamin e|tocopherol/,['Vitamin E (Mixed Tocopherols)','Selenium','Omega-3 EPA/DHA']],
  [/selenium|iodine|thyroid/,['Selenium','Iodine','Zinc']],
  [/\biron\b|ferritin|anemia/,['Iron Bisglycinate','Vitamin C','Vitamin B12']],
  [/copper|\bzinc\b/,['Zinc','Copper','Vitamin C']],
  [/magnesium|electrolyte/,['Magnesium Glycinate','Potassium','Vitamin D3']],
  [/skin|wrinkle|aging|elasticity|collagen|acne|rosacea|hydration|glycation/,['Collagen Peptides','Vitamin C','Astaxanthin']],
  [/\buv\b|sun|photo|pigment|sunspot/,['Astaxanthin','Polypodium leucotomos','Vitamin C']],
  [/hair/,['Saw Palmetto','Biotin','Zinc']],
  [/migraine|headache/,['Magnesium Glycinate','Riboflavin (B2)','CoQ10']],
  [/cannabis|\bthc\b|\bcbd\b|alcohol|opioid|cocaine|nicotine|addiction|substance/,['N-Acetyl Cysteine (NAC)','Magnesium Glycinate','B-Complex']],
  [/food sensitiv|histamine|allerg/,['Quercetin','Vitamin C','Probiotics']],
  [/carbohydrate|\bcarb\b/,['Berberine','Chromium','Alpha-Lipoic Acid']],
];
const PROD={
 "Zeaxanthin Level Propensity":{supps:[["Zeaxanthin",5],["Lutein",5],["DHA",4]],a:[["Non-Vitamin A Carotenoids (Genetics and Labwork)","Eye Health w/summary"]]},
 "Lutein Level Propensity":{supps:[["Lutein",5],["Zeaxanthin",5],["DHA",4]],a:[["Non-Vitamin A Carotenoids (Genetics and Labwork)","Eye Health w/summary"]]},
 "Vitamin A Conversion":{supps:[["Vitamin A (as Acetate)",5],["Lutein",3],["Zeaxanthin",3]],a:[["Vitamin A (Genetics and Labwork)","Eye Health w/summary"]]},
 "Nitric Oxide Production":{supps:[["Beet Root Extract",5],["L-Citrulline",5],["Magnesium",5]]},
 "Dietary Fat Response":{supps:[["Omega-3 EPA/DHA 2:1",4],["Psyllium Husk Powder",4],["Berberine Extract root extract",4]],a:[["Fats","Weight Management"],["Fats","Nutrition 2.0 w/summary"]]},
 "Saturated Fat Response":{supps:[["Omega-3 EPA/DHA 2:1",4],["Psyllium Husk Powder",4],["Berberine Extract root extract",4]],a:[["Saturated Fat","Weight Management"],["Saturated Fat","Nutrition 2.0 w/summary"],["Saturated Fat (Gauge Demos)","Gauge Type Library"]]},
 "Omega-6 Risk":{supps:[["Omega-3 EPA/DHA 2:1",4],["Omega-3 DHA/EPA 3:1",4],["Magnesium",3]],a:[["Omega Fatty Acids","Nutrition 2.0 w/summary"]]},
 "Plant Sterol Risk":{supps:[["Berberine Extract root extract",5],["Psyllium Husk Powder",5],["Bergamot 40% Polyphenol Fraction",4]],a:[["Plant Cholesterol","Nutrition 2.0 w/summary"]]},
 "Copper Imbalance Risk":{supps:[["Zinc",5],["Copper",4],["Vitamin C",3]]}
};
function suppFor(name,panel,tone){
  const pd=PROD[name]; if(pd) return pd.supps;
  const d=DETAIL[name];
  if(d && SUPP_SET[d.s]) return SUPP_SET[d.s];
  const hay=(name+' '+panel).toLowerCase();
  let list=['Omega-3 EPA/DHA','Magnesium Glycinate','Vitamin D3'];
  for(const [re,arr] of SUPP_RULES){ if(re.test(hay)){ list=arr; break; } }
  return list.map((s,i)=>[s,5-i]);
}
function suppCard(name,rating,idx){
  const photo=imgFor(name);
  const tile = photo ? ('<img class="thumb" loading="lazy" alt="'+esc(name)+'" src="'+photo+'">')
                     : ('<div class="tile illus v'+(idx%3)+'">'+archFor(name)+'</div>');
  const star='<svg viewBox="0 0 24 24"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';
  return '<div class="scard">'+tile+
    '<div class="sb"><div class="snm">'+esc(name)+'</div>'+
    '<div class="srow"><span class="stars">'+star+rating+'</span><span class="srank">#'+(idx+1)+'</span></div></div></div>';
}
function openMarker(el){
  const name=el.dataset.name, panel=el.dataset.panel, status=el.dataset.status;
  const sec=el.closest('.section'); const tone=sec?sec.dataset.sec:'att';
  const cat=(panel.split('·')[0]||panel).trim();
  document.getElementById('mkCat').textContent=cat;
  document.getElementById('mkNameTxt').textContent=name;
  document.getElementById('mkExp').textContent=plainFor(name,panel,status,tone);

  const g=GAUGE[tone]||GAUGE.att;
  document.getElementById('mkFill').style.width=g.w+'%';
  document.getElementById('mkFill').style.background=g.c;
  document.getElementById('mkKnob').style.left=g.w+'%';
  const st=document.getElementById('mkStat'); st.textContent=status; st.style.color=g.t;

  const d=DETAIL[name];
  document.getElementById('mkSupps').innerHTML=suppFor(name,panel,tone).map((s,i)=>suppCard(s[0],s[1],i)).join('');
  document.getElementById('mkSuppSec').style.display='';

  let rows=[];
  const ap=(PROD[name]&&PROD[name].a)||(d&&d.a);
  if(ap) rows=ap.map(x=>'<div class="ar"><b>'+esc(x[0])+'</b> &middot; '+esc(x[1])+'</div>');
  else {
    const m=panel.match(/in (\d+) panels/);
    if(m) rows=['<div class="ar">Appears in <b>'+m[1]+' panels</b> across this report.</div>'];
    else rows=['<div class="ar">Part of your <b>'+esc(cat)+'</b> results.</div>'];
  }
  document.getElementById('mkAppears').innerHTML=rows.join('');
  document.getElementById('mkAppearsSec').style.display='';

  document.querySelector('.mk-scroll').scrollTop=0;
  mkOverlay.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeMarker(){ mkOverlay.classList.remove('open'); document.body.style.overflow=''; }

document.addEventListener('click',e=>{
  const it=e.target.closest('.item');
  if(it){ openMarker(it); return; }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape' && mkOverlay.classList.contains('open')) closeMarker();
  const it=e.target.closest && e.target.closest('.item');
  if(it && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); openMarker(it); }
});
document.getElementById('mkClose').addEventListener('click',closeMarker);
mkOverlay.addEventListener('click',e=>{ if(e.target===mkOverlay) closeMarker(); });


/* ---------- DONUT ---------- */
(function(){
  const seg = [['#e5484d',8],['#dd941f',34],['#2f9e54',58],['#aeb3bb',0.5]];
  const svg = document.getElementById('donut');
  const cx=21,cy=21,r=15.9155, C=2*Math.PI*r;
  let off=0;
  let html='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="#f1f1f0" stroke-width="6"/>';
  seg.forEach(([col,pct])=>{
    const len=C*pct/100;
    html+='<circle cx="21" cy="21" r="15.9155" fill="none" stroke="'+col+'" stroke-width="6.4" '+
      'stroke-dasharray="'+len.toFixed(3)+' '+(C-len).toFixed(3)+'" '+
      'stroke-dashoffset="'+(C*0.25 - off).toFixed(3)+'" stroke-linecap="butt"/>';
    off+=len;
  });
  html+='<text x="21" y="20" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="7" fill="#15151a">422</text>';
  html+='<text x="21" y="25.5" text-anchor="middle" font-family="Inter" font-weight="500" font-size="2.6" fill="#9aa0a8" letter-spacing="0.05">MARKERS</text>';
  svg.innerHTML=html;
})();

/* ---------- BAR CHART (by report section) ---------- */
(function(){
  // [section, optimal, moderate, attention]  (instance counts, approx from report)
  const rows = [
    ["Hair Health",24,12,6],
    ["Ketamine",9,3,0],
    ["Genetics",18,8,2],
    ["Weight Management",16,9,3],
    ["Trending Diets",14,4,0],
    ["Emotional Health",13,7,2],
    ["Preconception Ge…",11,6,3],
    ["Nutrition 2.0 w/…",62,30,8],
    ["New Sections",30,14,6],
  ];
  const max=120;
  const el=document.getElementById('bars');
  el.innerHTML = rows.map(r=>{
    const [nm,o,m,a]=r;
    const w=v=>(v/max*100).toFixed(2)+'%';
    return '<div class="bar-row"><span class="nm" title="'+esc(nm)+'">'+esc(nm)+'</span>'+
      '<div class="bar-track">'+
        '<i style="width:'+w(o)+';background:#2f9e54"></i>'+
        '<i style="width:'+w(m)+';background:#dd941f"></i>'+
        '<i style="width:'+w(a)+';background:#e5484d"></i>'+
      '</div></div>';
  }).join('');
})();

/* ---------- toggle buttons (visual) ---------- */
document.querySelectorAll('.toggle button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.toggle button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
  });
});

/* ---------- Export Report (downloads the attached PDF) ---------- */
function exportSummary(){
  try{
    const a=document.createElement('a');
    a.href='assets/report/Lifestyle-Genetics-Report-Recommendations.pdf';
    a.download='Lifestyle-Genetics-Report-Recommendations.pdf';
    document.body.appendChild(a); a.click(); a.remove();
  }catch(e){ alert('Could not export the report: '+(e&&e.message?e.message:e)); }
}
