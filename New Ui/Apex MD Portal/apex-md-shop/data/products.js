/* Apex MD Shop — catalog data. Requires photos.js loaded first. */
const wl = [
  {name:'Compounded Semaglutide',img:PHOTO.semaVial.src,tile:PHOTO.semaVial.bg,fit:'contain',desc:'Injectable compounded semaglutide for effective, sustained weight loss.',price:'$299',per:'/mo',badge:{text:'Most Popular',color:'blue'}},
  {name:'Compounded Tirzepatide',img:PHOTO.tirzVial.src,tile:PHOTO.tirzVial.bg,fit:'contain',desc:'Dual GIP/GLP-1 agonist for maximum metabolic impact.',price:'$399',per:'/mo',badge:{text:'Strongest',color:'red'}},
  {name:'Semaglutide ODT',img:PHOTO.semaODT.src,tile:PHOTO.semaODT.bg,fit:'contain',desc:'Oral dissolving tablet \u2014 no injections required.',price:'$349',per:'/mo'},
  {name:'Tirzepatide ODT',img:PHOTO.tirzODT.src,tile:PHOTO.tirzODT.bg,fit:'contain',desc:'Oral tirzepatide for dual-action weight management.',price:'$419',per:'/mo'},
  {name:'Semaglutide Microdose',img:PHOTO.semaVial.src,tile:PHOTO.semaVial.bg,fit:'contain',desc:'Micro-dosing protocol ideal for beginners or maintenance.',price:'$249',per:'/mo',badge:{text:'Best Value',color:'green'}},
  {name:'Tirzepatide Microdose',img:PHOTO.tirzVial.src,tile:PHOTO.tirzVial.bg,fit:'contain',desc:'Low-dose tirzepatide for gradual, sustainable results.',price:'$249',per:'/mo'},
  {name:'Semaglutide ODT Microdose',img:PHOTO.semaODT.src,tile:PHOTO.semaODT.bg,fit:'contain',desc:'Oral micro-dose semaglutide \u2014 easy and convenient.',price:'$249',per:'/mo'},
  {name:'Tirzepatide ODT Microdose',img:PHOTO.tirzODT.src,tile:PHOTO.tirzODT.bg,fit:'contain',desc:'Oral micro-dose tirzepatide for gentle weight management.',price:'$249',per:'/mo'},
  {name:'Semaglutide Pen',img:PHOTO.penSema.src,tile:'#ffffff',fit:'contain',desc:'Once-weekly subcutaneous semaglutide in a simple auto-injector pen.',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}},
  {name:'Tirzepatide Pen',img:PHOTO.penTirz.src,tile:'#ffffff',fit:'contain',desc:'Once-weekly subcutaneous tirzepatide in a simple auto-injector pen.',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}},
  {name:'Tirzepatide Travel Kit',img:PHOTO.kitTirz.src,tile:'#ffffff',fit:'contain',desc:'Insulated travel case with digital thermometer, ice packs, and Tirzepatide pens — keeps your medication cool on the go.',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}}
];
const longevity = [
  {name:'NAD+ Injectable',type:'vial',kind:'Cellular',desc:'Cellular energy and DNA-repair support via physician-dosed NAD+.',price:'$349',per:'/mo',badge:{text:'Most Popular',color:'purple'}},
  {name:'Sermorelin',type:'vial',kind:'GH Support',desc:'Growth-hormone secretagogue for recovery, sleep, and lean mass.',price:'$299',per:'/mo'},
  {name:'Glutathione',type:'vial',kind:'Antioxidant',desc:'Master antioxidant for detox, skin clarity, and immune support.',price:'$199',per:'/mo'},
  {name:'Rapamycin',type:'bottle',kind:'Compounded',desc:'mTOR-modulating longevity protocol, fully physician-supervised.',price:'$279',per:'/mo',badge:{text:'Advanced',color:'blue'}}
];
const trt = [
  {name:'Testosterone Cypionate',img:PHOTO.t2.src,tile:PHOTO.t2.bg,fit:'contain',desc:'Injectable testosterone cypionate with anastrozole, monitored with ongoing labs.',price:'$199',per:'/month',badge:{text:'Most Popular',color:'blue'}},
  {name:'Enclomiphene Citrate',img:PHOTO.enclo.src,tile:PHOTO.enclo.bg,fit:'contain',desc:'Oral capsules that boost natural testosterone while preserving fertility.',price:'$199',per:'/month'},
  {name:'TRT Gel',img:PHOTO.gel.src,tile:PHOTO.gel.bg,fit:'contain',desc:'Topical testosterone gel \u2014 a needle-free daily application.',price:'$199',per:'/month'},
  {name:'Oral TRT',img:PHOTO.oral.src,tile:PHOTO.oral.bg,fit:'contain',desc:'Daily oral testosterone replacement \u2014 no injections required.',price:'$199',per:'/month'}
];
const hrt = [
  {type:'intro',img:PHOTO.hrtIntro.src,lead:'Don’t know',lead2:'what you want?',desc:'Click here to get started with labs and physician consult to see if HRT is right for you.',cta:'Get Started'},
  {name:'Estrogen',img:PHOTO.hrtEstrogen.src,tile:PHOTO.hrtEstrogen.bg,fit:'contain',desc:'Bioidentical estrogen 4mg/gm topical cream with SmartPump® metered dosing.',price:'$199',per:'/month'},
  {name:'Enclomiphene Citrate',img:PHOTO.hrtEnclomiphene.src,tile:PHOTO.hrtEnclomiphene.bg,fit:'contain',desc:'Oral enclomiphene citrate capsules to support healthy, natural hormone production.',price:'$199',per:'/month'},
  {name:'Progesterone',img:PHOTO.hrtProgesterone.src,tile:PHOTO.hrtProgesterone.bg,fit:'contain',desc:'Bioidentical progesterone, 60 capsules for hormone balance and better sleep.',price:'$199',per:'/month'}
];
const peptides = [
  {name:'BPC-157',img:PHOTO.pepBpc.src,tile:PHOTO.pepBpc.bg,fit:'contain',desc:'Recovery and gut-health peptide for tissue repair.',price:'$159',per:'/mo',badge:{text:'Most Popular',color:'blue'}},
  {name:'NAD+',img:PHOTO.pepNad.src,tile:PHOTO.pepNad.bg,fit:'contain',desc:'Cellular energy and longevity support for metabolism, focus, and recovery.',price:'$199',per:'/mo'},
  {name:'NAD+ Nasal Spray',img:PHOTO.pepNadSpray.src,tile:PHOTO.pepNadSpray.bg,fit:'contain',desc:'Convenient intranasal NAD+ for daily cellular energy — 30 mg per spray.',price:'$149',per:'/mo'},
  {name:'Sermorelin',img:PHOTO.pepSermorelin.src,tile:PHOTO.pepSermorelin.bg,fit:'contain',desc:'GH-axis peptide supporting recovery, sleep, and body composition.',price:'$189',per:'/mo'},
  {name:'Sermorelin ODT',img:PHOTO.pepSermorelinODT.src,tile:PHOTO.pepSermorelinODT.bg,fit:'contain',desc:'Oral dissolving GH-axis peptide — no injections required.',price:'$179',per:'/mo'},
  {name:'Tesamorelin',img:PHOTO.pepTesa.src,tile:PHOTO.pepTesa.bg,fit:'contain',desc:'Targeted visceral-fat reduction and GH support.',price:'$269',per:'/mo'},
  {name:'MOTS-C',img:PHOTO.pepMotsc.src,tile:PHOTO.pepMotsc.bg,fit:'contain',desc:'Mitochondrial peptide for metabolic health, endurance, and energy.',price:'$219',per:'/mo'},
  {name:'Epitalon',img:PHOTO.pepEpitalon.src,tile:PHOTO.pepEpitalon.bg,fit:'contain',desc:'Telomere-supporting longevity peptide for healthy aging.',price:'$199',per:'/mo'},
  {name:'GHK-Cu',img:PHOTO.pepGhkcu.src,tile:PHOTO.pepGhkcu.bg,fit:'contain',desc:'Copper peptide for skin, hair, and tissue regeneration.',price:'$179',per:'/mo'},
  {name:'PT-141',img:PHOTO.pepPt141.src,tile:PHOTO.pepPt141.bg,fit:'contain',desc:'Libido and sexual-wellness peptide therapy.',price:'$139',per:'/mo'}
];
const peptideBlends = [
  {name:'Wolverine',img:PHOTO.pbWolverine.src,tile:PHOTO.pbWolverine.bg,fit:'contain',desc:'BPC-157 / TB-500 recovery blend for accelerated tissue repair and full-body recovery.',price:'$239',per:'/mo',badge:{text:'Most Popular',color:'blue'}},
  {name:'Wolverine Pen',img:PHOTO.pbWolverinePen.src,tile:PHOTO.pbWolverinePen.bg,fit:'contain',desc:'The Wolverine BPC-157 / TB-500 blend in a simple once-weekly auto-injector pen.',price:'$269',per:'/mo',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}},
  {name:'CJC-1295',img:PHOTO.pbCJC.src,tile:PHOTO.pbCJC.bg,fit:'contain',desc:'Long-acting GHRH for growth-hormone support, recovery, and lean body composition.',price:'$229',per:'/mo'},
  {name:'CJC-1295 / Ipamorelin Pen',img:PHOTO.pbCjcPen.src,tile:PHOTO.pbCjcPen.bg,fit:'contain',desc:'Growth-hormone releasing CJC-1295 / Ipamorelin blend in a simple auto-injector pen.',price:'$279',per:'/mo',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}},
  {name:'Semax / Selank',img:PHOTO.pbSemax.src,tile:PHOTO.pbSemax.bg,fit:'contain',desc:'Nootropic peptide blend for focus, mood, and cognitive resilience.',price:'$189',per:'/mo'},
  {name:'Semax / Selank Pen',img:PHOTO.pbSemaxPen.src,tile:PHOTO.pbSemaxPen.bg,fit:'contain',desc:'The Semax / Selank nootropic blend in a once-weekly auto-injector pen.',price:'$209',per:'/mo',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}},
  {name:'Tesamorelin / Ipamorelin',img:PHOTO.pbTesaIpa.src,tile:PHOTO.pbTesaIpa.bg,fit:'contain',desc:'Visceral-fat reduction with GH-axis support for recovery and body composition.',price:'$279',per:'/mo'},
  {name:'Tesamorelin / Ipamorelin Pen',img:PHOTO.pbTesaPen.src,tile:PHOTO.pbTesaPen.bg,fit:'contain',desc:'Visceral-fat reduction with GH-axis support in a once-weekly auto-injector pen.',price:'$309',per:'/mo',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}},
  {name:'Glow+',img:PHOTO.pbGlow.src,tile:PHOTO.pbGlow.bg,fit:'contain',desc:'GHK-Cu / BPC-157 / TB-500 / Epitalon regenerative blend for skin, hair, and tissue health.',price:'$269',per:'/mo'},
  {name:'Glow+ Pen',img:PHOTO.pbGlowPen.src,tile:PHOTO.pbGlowPen.bg,fit:'contain',desc:'GHK-Cu / BPC-157 / TB-500 / Epitalon regenerative blend for skin, hair, and tissue health.',price:'$299',per:'/mo',soon:'Coming September 2026',badge:{text:'Coming Soon',color:'soon'}}
];
const labdx = [
  {name:'Comprehensive Blood Work',img:PHOTO.labBlood.src,tile:PHOTO.labBlood.bg,fit:'cover',desc:'100+ biomarkers across metabolic, cardiac, hormone, and thyroid panels.',price:'from $249',per:'',clickable:true,badge:{text:'Most Popular',color:'blue'}},
  {name:'Biological Age Test',img:PHOTO.labBioage.src,tile:PHOTO.labBioage.bg,fit:'cover',desc:'Epigenetic and biomarker analysis of how old your cells really are.',price:'$399',per:'/month',clickable:true},
  {name:'Micronutrient Testing',img:PHOTO.labMicro.src,tile:PHOTO.labMicro.bg,fit:'cover',desc:'Uncover vitamin and mineral gaps to support energy, immunity, and overall wellness.',price:'$299',per:'/month',clickable:true},
  {name:'Genetics Testing',img:PHOTO.labGenetics.src,tile:PHOTO.labGenetics.bg,fit:'cover',desc:'DNA insights on metabolism, medications, and lifestyle fit.',price:'$399',per:'/month',clickable:true},
  {name:'Food Sensitivity Test',img:PHOTO.labFood.src,tile:PHOTO.labFood.bg,fit:'cover',desc:'190+ foods screened for IgG-mediated sensitivities.',price:'$299',per:'/month',clickable:true},
  {name:'Microbiome Testing',img:PHOTO.labMicrobiome.src,tile:PHOTO.labMicrobiome.bg,fit:'cover',desc:'Gut microbiome sequencing to understand the microbes that shape your health.',price:'$349',per:'/month',clickable:true}
];
const supplements = [
  {name:'Whey · Vanilla',img:PHOTO.s_whey_van.src,tile:'#ffffff',fit:'contain',desc:'Vanilla milkshake whey protein blend for lean muscle.',price:'$59.99',per:'/bag',badge:{text:'Most Popular',color:'blue'}},
  {name:'Whey · Chocolate',img:PHOTO.s_whey_choc.src,tile:'#ffffff',fit:'contain',desc:'Chocolate milkshake whey protein blend for lean muscle.',price:'$59.99',per:'/bag'},
  {name:'Whey · Cinnamon Swirl',img:PHOTO.s_whey_cin.src,tile:'#ffffff',fit:'contain',desc:'Cinnamon swirl whey protein blend for lean muscle.',price:'$59.99',per:'/bag'},
  {name:'Vegan · Vanilla',img:PHOTO.s_vegan_van.src,tile:'#ffffff',fit:'contain',desc:'Vanilla plant-based protein for lean muscle support.',price:'$59.99',per:'/bag'},
  {name:'Vegan · Chocolate',img:PHOTO.s_vegan_choc.src,tile:'#ffffff',fit:'contain',desc:'Chocolate plant-based protein for lean muscle support.',price:'$59.99',per:'/bag'},
  {name:'Preworkout · Georgia Peach',img:PHOTO.s_pre_peach.src,tile:'#ffffff',fit:'contain',desc:'Clean energy, focus, and endurance — Georgia peach.',price:'$39.99',per:'/tub'},
  {name:'Preworkout · Tropical Sunrise',img:PHOTO.s_pre_trop.src,tile:'#ffffff',fit:'contain',desc:'Clean energy, focus, and endurance — tropical sunrise.',price:'$39.99',per:'/tub'},
  {name:'Preworkout · Watermelon',img:PHOTO.s_pre_water.src,tile:'#ffffff',fit:'contain',desc:'Clean energy, focus, and endurance — watermelon.',price:'$39.99',per:'/tub'},
  {name:'BCAA · Watermelon',img:PHOTO.s_bcaa_water.src,tile:'#ffffff',fit:'contain',desc:'7.5g BCAA recovery with electrolytes — watermelon.',price:'$34.99',per:'/tub',badge:{text:'New',color:'red'}},
  {name:'BCAA · Green Apple',img:PHOTO.s_bcaa_apple.src,tile:'#ffffff',fit:'contain',desc:'7.5g BCAA recovery with electrolytes — green apple.',price:'$34.99',per:'/tub',badge:{text:'New',color:'red'}},
  {name:'Creatine Powder',img:PHOTO.s_creatine.src,tile:'#ffffff',fit:'contain',desc:'Micronized 100% creatine monohydrate for strength.',price:'$39.99',per:'/tub',badge:{text:'Best Value',color:'green'}},
  {name:'Probiotic',img:PHOTO.s_probiotic.src,tile:'#ffffff',fit:'contain',desc:'40 billion CFU, 10-strain probiotic for gut & immune health.',price:'$34.99',per:'/bottle'},
  {name:'Women\'s Multivitamin',img:PHOTO.s_womensmulti.src,tile:'#ffffff',fit:'contain',desc:'25+ vitamins & minerals for daily women\'s health.',price:'$29.99',per:'/bottle'},
  {name:'Men\'s Multivitamin',img:PHOTO.s_mensmulti.src,tile:'#ffffff',fit:'contain',desc:'Daily essential vitamins & minerals for men.',price:'$29.99',per:'/bottle'},
  {name:'Vitamin K2 + D3',img:PHOTO.s_k2d3.src,tile:'#ffffff',fit:'contain',desc:'Vitamin K2 (MK-7) + D3 for bone, heart & immune health.',price:'$24.99',per:'/bottle'},
  {name:'Omega 3',img:PHOTO.s_omega3.src,tile:'#ffffff',fit:'contain',desc:'High-EPA/DHA fish oil for heart and brain health.',price:'$29.99',per:'/bottle'},
  {name:'RED Superfood',img:PHOTO.s_superfood.src,tile:'#ffffff',fit:'contain',desc:'Kiwi strawberry reds blend with antioxidants & prebiotic fiber.',price:'$39.99',per:'/tub'},
  {name:'Glutamine Powder',img:PHOTO.s_glutamine.src,tile:'#ffffff',fit:'contain',desc:'L-glutamine to support recovery and gut health.',price:'$34.99',per:'/tub'}
];
const memberships = [
  {name:'Advanced Health Check',cta:'Purchase',type:'plan',img:PHOTO.cgBiomarker.src,tile:PHOTO.cgBiomarker.bg,fit:'cover',topPrice:'$399',topNote:'one time payment',desc:'A physician-reviewed diagnostic workup — includes a consult and personalized optimization outline from an Apex MD physician.',features:[{name:'Comprehensive Metabolic Panel',desc:'Overall metabolic health including glucose, electrolytes, and kidney function'},{name:'Advanced Lipid Panel',desc:'LDL particle size and number for deeper cardiovascular risk assessment'},{name:'Hormone Panels',desc:'Adrenal stress profile, cortisol, estrogen, progesterone, and testosterone'},{name:'Inflammation & Immune Panel',desc:'CRP and cytokine panel assessing pro- and anti-inflammatory markers'},{name:'Optimization Outline',desc:'Personalized vitamins, peptides, and hormones when applicable'}],price:'',per:''},
  {name:'Foundational Annual Program',cta:'Purchase',topPrice:'$399/month',type:'plan',img:PHOTO.cgTele.src,tile:PHOTO.cgTele.bg,fit:'cover',desc:'A physician-reviewed diagnostic workup — includes a consult and <strong>continuous personalized optimization management with Apex MD physician</strong>.',features:[{name:'Comprehensive Metabolic Panel',desc:'Overall metabolic health including glucose, electrolytes, and kidney function'},{name:'Advanced Lipid Panel',desc:'LDL particle size and number for deeper cardiovascular risk assessment'},{name:'Hormone Panels',desc:'Adrenal stress profile, cortisol, estrogen, progesterone, and testosterone'},{name:'Inflammation & Immune Panel',desc:'CRP and cytokine panel assessing pro- and anti-inflammatory markers'},{name:'Personalized Longevity Protocol',desc:'Built on your biomarkers, genetics, lifestyle, and goals. Includes nutritional and exercise guidance, supplements, and medication recommendations when needed.',inc:false},{name:'Supplementation & Medication Management',desc:'Physician-prescribed supplementation and medication protocols where clinically indicated',inc:false},{name:'<span style="color:var(--accent)">Continuous Optimization Management</span>',desc:'Quarterly lab work and physician visits. Ongoing health management with personalized vitamins, peptides, and hormones when applicable'}],price:'',per:''},
  {name:'Apex Elite',cta:'Purchase',topPrice:'$1,250/month',topNote:'or $1,063/month if paid annually',type:'plan',img:PHOTO.cgLongevity.src,tile:PHOTO.cgLongevity.bg,fit:'cover',desc:'A physician-reviewed diagnostic workup — includes a consult and <strong>continuous personalized optimization management with Apex MD physician</strong>.',features:[{name:'Comprehensive Metabolic Panel',desc:'Overall metabolic health including glucose, electrolytes, and kidney function'},{name:'Advanced Lipid Panel',desc:'LDL particle size and number for deeper cardiovascular risk assessment'},{name:'Hormone Panels',desc:'Adrenal stress profile, cortisol, estrogen, progesterone, and testosterone'},{name:'Micronutrient & Fatty Acids Panel',desc:'Vitamins, minerals, amino acids, omega-3 and omega-6 levels'},{name:'Inflammation & Immune Panel',desc:'CRP and cytokine panel assessing pro- and anti-inflammatory markers'},{name:'Gut Health & Microbiome Panel',desc:'Comprehensive stool analysis, intestinal permeability, and SIBO breath testing'},{name:'Genetic Variants Panel',desc:'Genetic predispositions affecting your health and metabolism'},{name:'Heavy Metals & Toxin Panel',desc:'Exposure to heavy metals and environmental toxins'},{name:'Food Sensitivity Testing',desc:'Identifies food triggers and sensitivities to guide your dietary protocol'},{name:'Personalized Longevity Protocol',desc:'Built on your biomarkers, genetics, lifestyle, and goals. Includes nutritional and exercise guidance, supplements, and medication recommendations when needed.'},{name:'Supplementation & Medication Management',desc:'Physician-prescribed supplementation and medication protocols where clinically indicated'},{name:'<span style="color:var(--accent)">Continuous Optimization Management</span>',desc:'Quarterly lab work and physician visits. Ongoing health management with personalized vitamins, peptides, and hormones when applicable'}],price:'',per:''}
];
const programs = [
  {name:'8-Week Ultimate Tennis',type:'plan',img:PHOTO.tennis.src,tile:PHOTO.tennis.bg,fit:'poster',desc:'Sport-specific tennis program — move better, hit harder, and play longer with speed, power, core strength, and endurance training.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'12-Week GLP-1 Fat Loss & Muscle Gain Program for Men',type:'plan',img:PHOTO.glp1Men.src,tile:PHOTO.glp1Men.bg,fit:'poster',desc:'Doctor-approved 12-week program to lose fat faster while preserving lean muscle, building strength, and transforming your body with GLP-1 optimization.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'12-Week GLP-1 Fat Loss & Muscle Gain Program for Women',type:'plan',img:PHOTO.glp1Women.src,tile:PHOTO.glp1Women.bg,fit:'poster',desc:'Doctor-approved 12-week program to lose fat faster while preserving lean muscle, building strength, and transforming your body with GLP-1 optimization.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'12-Week Bone Growth Program',type:'plan',img:PHOTO.boneGrowth.src,tile:PHOTO.boneGrowth.bg,fit:'poster',desc:'Doctor-approved 12-week program to grow bone in as little as 12 weeks — reverse osteoporosis and osteopenia, improve balance, reduce fracture risk, and live pain-free.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'8-Week Ultimate Glutes Program',type:'plan',img:PHOTO.glutes.src,tile:PHOTO.glutes.bg,fit:'poster',desc:'Targeted 8-week program to build, lift, and shape your glutes with proven workouts for maximum results, better shape, and more confidence.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'6-Week Back Pain Relief Program',type:'plan',img:PHOTO.backPain.src,tile:PHOTO.backPain.bg,fit:'poster',desc:'Doctor-approved 6-week program to reduce back pain, improve mobility and flexibility, strengthen your back, and help you live a pain-free life.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'12-Week Post Baby Workout Program',type:'plan',img:PHOTO.postBaby.src,tile:PHOTO.postBaby.bg,fit:'poster',desc:'Doctor-approved 12-week program with diastasis recti correction to heal, strengthen, and tone your body — designed for moms, built for real life.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'8-Week Ultimate Tennis Program',type:'plan',img:PHOTO.tennisW.src,tile:PHOTO.tennisW.bg,fit:'poster',desc:'Doctor-approved 8-week program to improve speed, power, endurance, and on-court performance — so you can move better, hit harder, play longer, and win more.',price:'$199',per:'',badge:{text:'Apex Fit',color:'red'}},
  {name:'Metabolic Reset',type:'plan',desc:'12-week GLP-1 + nutrition + coaching weight-loss program.',price:'$349',per:'/mo',badge:{text:'Most Popular',color:'blue'}},
  {name:'Hormone Optimization',type:'plan',desc:'TRT/HRT program with labs, dosing, and follow-ups included.',price:'$259',per:'/mo'},
  {name:'Longevity Protocol',type:'plan',desc:'Comprehensive anti-aging program across diagnostics and therapy.',price:'$399',per:'/mo'},
  {name:'Recovery & Performance',type:'plan',desc:'Peptide + training program for recovery and body composition.',price:'$299',per:'/mo'}
];
const training = [
  {name:'1:1 Personal Training',type:'plan',desc:'Weekly remote coaching with a dedicated Apex Fit trainer.',price:'$249',per:'/mo',badge:{text:'Most Popular',color:'blue'}},
  {name:'Custom Program Design',type:'plan',desc:'A periodized training plan built around your goals and labs.',price:'$99',per:'/mo'},
  {name:'Nutrition Coaching',type:'plan',desc:'Macro and meal planning aligned to your protocol.',price:'$129',per:'/mo'},
  {name:'Hybrid Concierge',type:'plan',desc:'Training + nutrition + check-ins in one managed plan.',price:'$349',per:'/mo'}
];
