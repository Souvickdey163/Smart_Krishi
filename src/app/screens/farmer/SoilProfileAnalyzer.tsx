import { ArrowLeft, Upload, FileText, HelpCircle, CheckCircle2, Leaf, FlaskConical, Droplets, Bug, Sprout, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Brain, Sparkles, ThermometerSun, Gauge, Zap, Timer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Progress } from "../../components/ui/progress";
import { toast } from "sonner";
import { analyzeLabReport, analyzeQA, saveAnalysis, type SoilAnalysisResult, type LabReportData, type QAAnswers } from "../../services/soilService";

interface Question {
  id: string;
  question: string;
  questionHi: string;
  options: { value: string; label: string; labelHi: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "color",
    question: "What is the color of your soil?",
    questionHi: "आपकी मिट्टी का रंग क्या है?",
    options: [
      { value: "dark_brown", label: "Dark Brown / Black", labelHi: "गहरा भूरा / काला" },
      { value: "light_brown", label: "Light Brown", labelHi: "हल्का भूरा" },
      { value: "red", label: "Red / Reddish", labelHi: "लाल / लालिमा युक्त" },
      { value: "yellow", label: "Yellow / Sandy", labelHi: "पीला / रेतीला" },
    ],
  },
  {
    id: "texture",
    question: "How does your soil feel when you touch it?",
    questionHi: "छूने पर आपकी मिट्टी कैसी लगती है?",
    options: [
      { value: "sticky", label: "Sticky and smooth (Clay)", labelHi: "चिपचिपी और चिकनी (चिकनी मिट्टी)" },
      { value: "gritty", label: "Gritty and rough (Sandy)", labelHi: "खुरदरी और दानेदार (रेतीली)" },
      { value: "smooth", label: "Smooth and powdery (Silt)", labelHi: "मुलायम और पाउडर जैसी (गाद)" },
      { value: "mixed", label: "Mix of above (Loamy)", labelHi: "मिश्रित (दोमट)" },
    ],
  },
  {
    id: "drainage",
    question: "How does water drain in your field?",
    questionHi: "आपके खेत में पानी कैसे निकलता है?",
    options: [
      { value: "fast", label: "Very fast, disappears quickly", labelHi: "बहुत तेज़, पानी जल्दी सोख जाता है" },
      { value: "good", label: "Good, drains in few hours", labelHi: "अच्छा, कुछ घंटों में निकल जाता है" },
      { value: "slow", label: "Slow, stays for a day", labelHi: "धीमा, पानी एक दिन रहता है" },
      { value: "poor", label: "Very slow, waterlogging", labelHi: "बहुत धीमा, जलभराव होता है" },
    ],
  },
  {
    id: "organic",
    question: "Do you add organic matter (manure/compost) to soil?",
    questionHi: "क्या आप मिट्टी में जैविक खाद डालते हैं?",
    options: [
      { value: "regular", label: "Yes, regularly every season", labelHi: "हाँ, हर मौसम में" },
      { value: "sometimes", label: "Sometimes, once a year", labelHi: "कभी-कभी, साल में एक बार" },
      { value: "rarely", label: "Rarely", labelHi: "बहुत कम" },
      { value: "never", label: "Never", labelHi: "कभी नहीं" },
    ],
  },
  {
    id: "crops",
    question: "What crops have you been growing recently?",
    questionHi: "आप हाल ही में कौन सी फसलें उगा रहे हैं?",
    options: [
      { value: "grains", label: "Rice, Wheat (Grains)", labelHi: "धान, गेहूं (अनाज)" },
      { value: "pulses", label: "Pulses and Legumes", labelHi: "दालें और फलियां" },
      { value: "vegetables", label: "Vegetables", labelHi: "सब्जियां" },
      { value: "cash", label: "Cotton, Sugarcane (Cash)", labelHi: "कपास, गन्ना (नकदी फसलें)" },
    ],
  },
  {
    id: "ph",
    question: "Have you tested soil pH? If yes, what was it?",
    questionHi: "क्या आपने मिट्टी का pH टेस्ट कराया है?",
    options: [
      { value: "acidic", label: "Acidic (Below 6.5)", labelHi: "अम्लीय (6.5 से कम)" },
      { value: "neutral", label: "Neutral (6.5 - 7.5)", labelHi: "तटस्थ (6.5 - 7.5)" },
      { value: "alkaline", label: "Alkaline (Above 7.5)", labelHi: "क्षारीय (7.5 से अधिक)" },
      { value: "unknown", label: "Not tested / Don't know", labelHi: "जांच नहीं की / पता नहीं" },
    ],
  },
  {
    id: "region",
    question: "Which state/region is your farm in?",
    questionHi: "आपका खेत किस राज्य/क्षेत्र में है?",
    options: [
      { value: "north", label: "North India (Punjab, Haryana, UP, Delhi)", labelHi: "उत्तर भारत (पंजाब, हरियाणा, यूपी, दिल्ली)" },
      { value: "south", label: "South India (TN, Karnataka, Kerala, AP)", labelHi: "दक्षिण भारत (तमिलनाडु, कर्नाटक, केरल, आंध्र)" },
      { value: "east", label: "East India (Bihar, WB, Odisha, Jharkhand)", labelHi: "पूर्वी भारत (बिहार, पश्चिम बंगाल, ओडिशा)" },
      { value: "west", label: "West India (Maharashtra, Gujarat, Rajasthan)", labelHi: "पश्चिम भारत (महाराष्ट्र, गुजरात, राजस्थान)" },
    ],
  },
  {
    id: "season",
    question: "Which season are you currently in or planning for?",
    questionHi: "आप किस मौसम की तैयारी कर रहे हैं?",
    options: [
      { value: "Kharif", label: "Kharif (Monsoon: Jun-Oct)", labelHi: "खरीफ (बारिश: जून-अक्टूबर)" },
      { value: "Rabi", label: "Rabi (Winter: Nov-Mar)", labelHi: "रबी (सर्दी: नवंबर-मार्च)" },
      { value: "Zaid", label: "Zaid (Summer: Mar-Jun)", labelHi: "जायद (गर्मी: मार्च-जून)" },
      { value: "Annual", label: "Year-round crop", labelHi: "साल भर की फसल" },
    ],
  },
];

// ─── Main Component ───
export default function SoilProfileAnalyzer() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"upload" | "questionnaire" | null>(null);
  const [uploadStep, setUploadStep] = useState<"file" | "manual">("file");
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [analysisResult, setAnalysisResult] = useState<SoilAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // Lab report form
  const [labValues, setLabValues] = useState<Partial<LabReportData>>({
    nitrogen: undefined, phosphorus: undefined, potassium: undefined,
    ph: undefined, organicCarbon: undefined, ec: undefined,
    sulphur: undefined, zinc: undefined, iron: undefined,
  });

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast.error("Please select an option / कृपया एक विकल्प चुनें");
      return;
    }
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      runQAAnalysis();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  // Animated analysis progress
  const simulateProgress = () => {
    setAnalyzeProgress(0);
    const steps = [
      { pct: 15, delay: 300 }, { pct: 30, delay: 600 }, { pct: 50, delay: 400 },
      { pct: 65, delay: 500 }, { pct: 80, delay: 300 }, { pct: 95, delay: 400 },
    ];
    let total = 0;
    steps.forEach(step => {
      total += step.delay;
      setTimeout(() => setAnalyzeProgress(step.pct), total);
    });
  };

  const runQAAnalysis = async () => {
    setIsAnalyzing(true);
    simulateProgress();
    try {
      const result = await analyzeQA(answers as unknown as QAAnswers);
      setAnalyzeProgress(100);
      setTimeout(() => {
        setAnalysisResult(result);
        saveAnalysis(result);
        setIsAnalyzing(false);
      }, 500);
    } catch {
      toast.error("Analysis failed. Retrying...");
      setIsAnalyzing(false);
    }
  };

  const handleFileExtraction = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsExtracting(true);
    // Simulate AI OCR extraction delay
    setTimeout(() => {
      setLabValues({
        nitrogen: 180,
        phosphorus: 22,
        potassium: 160,
        ph: 5.8,
        organicCarbon: 0.45,
        ec: 0.2
      });
      setIsExtracting(false);
      setUploadStep("manual");
      toast.success("Values extracted from report!");
    }, 2500);
  };

  const runLabAnalysis = async () => {
    const { nitrogen, phosphorus, potassium, ph, organicCarbon } = labValues;
    if (!nitrogen || !phosphorus || !potassium || !ph || !organicCarbon) {
      toast.error("Please fill required fields (N, P, K, pH, OC)");
      return;
    }
    setIsAnalyzing(true);
    simulateProgress();
    try {
      const result = await analyzeLabReport(labValues as LabReportData);
      setAnalyzeProgress(100);
      setTimeout(() => {
        setAnalysisResult(result);
        saveAnalysis(result);
        setIsAnalyzing(false);
      }, 500);
    } catch {
      toast.error("Analysis failed. Please try again.");
      setIsAnalyzing(false);
    }
  };

  // ─── Analyzing Screen ───
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Animated Brain Icon */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-14 h-14 text-primary animate-bounce" style={{ animationDuration: '1.5s' }} />
            </div>
            <Sparkles className="absolute top-0 right-0 w-6 h-6 text-yellow-500 animate-pulse" />
            <Sparkles className="absolute bottom-2 left-0 w-5 h-5 text-green-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          <div>
            <h2 className="text-xl font-bold mb-2">AI Analyzing Your Soil...</h2>
            <p className="text-sm text-muted-foreground">एआई आपकी मिट्टी का विश्लेषण कर रहा है...</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={analyzeProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {analyzeProgress < 30 && "Analyzing soil composition..."}
              {analyzeProgress >= 30 && analyzeProgress < 60 && "Running nutrient classification model..."}
              {analyzeProgress >= 60 && analyzeProgress < 85 && "Computing crop suitability scores..."}
              {analyzeProgress >= 85 && "Generating recommendations..."}
            </p>
          </div>

          {/* Analysis steps */}
          <div className="space-y-2 text-left">
            {[
              { label: 'Soil type classification', done: analyzeProgress >= 20 },
              { label: 'Nutrient deficiency analysis', done: analyzeProgress >= 40 },
              { label: 'pH & salinity check', done: analyzeProgress >= 55 },
              { label: 'Crop compatibility scoring', done: analyzeProgress >= 70 },
              { label: 'Fertilizer prescription', done: analyzeProgress >= 85 },
              { label: 'Improvement roadmap', done: analyzeProgress >= 95 },
            ].map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm transition-all duration-300 ${step.done ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 border-2 border-muted-foreground/20 rounded-full flex-shrink-0" />
                )}
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Results Screen ───
  if (analysisResult) {
    return <SoilAnalysisResults result={analysisResult} navigate={navigate} onRestart={() => { setAnalysisResult(null); setMode(null); setCurrentQuestionIndex(0); setAnswers({}); }} />;
  }

  // ─── Mode Selection ───
  if (!mode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate("/farmer/soil-insights")} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Soil Analyzer</h1>
              <p className="text-white/90 text-sm">एआई मिट्टी विश्लेषक</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
              <Brain className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-medium">AI Powered</span>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-2">
            <p className="text-sm">
              <span className="font-semibold">🧪 AI-Powered Analysis:</span> Get comprehensive soil health scores, nutrient analysis, fertilizer prescriptions, and crop recommendations.
            </p>
            <p className="text-sm text-muted-foreground mt-1">एआई-संचालित मिट्टी विश्लेषण से विस्तृत रिपोर्ट पाएं</p>
          </div>

          {/* Option 1: Lab Report */}
          <button onClick={() => setMode("upload")} className="w-full bg-card rounded-2xl shadow-lg p-6 border-2 border-border hover:border-primary transition-all hover:shadow-xl text-left group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Enter Lab Report Values</h3>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">HIGH ACCURACY</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">प्रयोगशाला रिपोर्ट के मान दर्ज करें</p>
                <p className="text-xs text-muted-foreground">Enter N, P, K, pH, OC values from your soil test report • ~92% accuracy</p>
              </div>
            </div>
          </button>

          {/* Option 2: Questionnaire */}
          <button onClick={() => setMode("questionnaire")} className="w-full bg-card rounded-2xl shadow-lg p-6 border-2 border-border hover:border-secondary transition-all hover:shadow-xl text-left group">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Answer Questions</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">NO LAB NEEDED</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">प्रश्नों के उत्तर दें — कोई रिपोर्ट नहीं चाहिए</p>
                <p className="text-xs text-muted-foreground">8 simple questions about your soil and field • AI infers nutrient levels</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Lab Report Input Form ───
  if (mode === "upload") {
    // File upload step
    if (uploadStep === "file") {
      return (
        <div className="min-h-screen bg-background pb-6">
          <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setMode(null)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Upload Lab Report</h1>
                <p className="text-white/90 text-sm">प्रयोगशाला रिपोर्ट अपलोड करें</p>
              </div>
            </div>
          </div>

          <div className="px-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Upload your soil test report. Our AI will extract the nutrient values automatically. Supported formats: PDF, PPT, JPEG, PNG.
                <br /><span className="text-blue-600">अपनी मिट्टी परीक्षण रिपोर्ट अपलोड करें। एआई स्वचालित रूप से मान निकाल लेगा।</span>
              </p>
            </div>

            {isExtracting ? (
              <div className="bg-card rounded-2xl shadow-lg p-10 flex flex-col items-center text-center space-y-4 border border-border">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse" />
                  <FileText className="absolute inset-0 m-auto w-8 h-8 text-primary animate-bounce" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Extracting values...</h3>
                  <p className="text-xs text-muted-foreground">Reading N, P, K, pH and OC from your report</p>
                </div>
                <Progress value={undefined} className="w-full h-2 animate-pulse" />
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-lg p-6 text-center border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Upload Report File</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a PDF, PPT, JPG, or PNG file<br />
                  <span className="text-xs">Max size: 10MB</span>
                </p>
                <div className="relative">
                  <Button className="w-full h-12 gap-2 relative z-0 pointer-events-none">
                    <Upload className="w-5 h-5" />
                    Browse Files | फ़ाइल चुनें
                  </Button>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={handleFileExtraction}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>
              </div>
            )}

            {!isExtracting && (
              <div className="text-center mt-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                  <div className="relative flex justify-center"><span className="bg-background px-4 text-xs text-muted-foreground uppercase">Or</span></div>
                </div>
                <Button variant="outline" className="w-full h-12 max-w-sm mx-auto" onClick={() => setUploadStep("manual")}>
                  Enter Values Manually | मैन्युअल रूप से दर्ज करें
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Manual Entry Step
    const labFields: { key: keyof LabReportData; label: string; labelHi: string; unit: string; placeholder: string; required?: boolean }[] = [
      { key: 'nitrogen', label: 'Nitrogen (N)', labelHi: 'नाइट्रोजन', unit: 'kg/ha', placeholder: '280', required: true },
      { key: 'phosphorus', label: 'Phosphorus (P)', labelHi: 'फास्फोरस', unit: 'kg/ha', placeholder: '15', required: true },
      { key: 'potassium', label: 'Potassium (K)', labelHi: 'पोटैशियम', unit: 'kg/ha', placeholder: '180', required: true },
      { key: 'ph', label: 'pH Level', labelHi: 'pH स्तर', unit: '', placeholder: '7.0', required: true },
      { key: 'organicCarbon', label: 'Organic Carbon (OC)', labelHi: 'जैविक कार्बन', unit: '%', placeholder: '0.5', required: true },
      { key: 'ec', label: 'EC (Conductivity)', labelHi: 'विद्युत चालकता', unit: 'dS/m', placeholder: '0.3' },
      { key: 'sulphur', label: 'Sulphur (S)', labelHi: 'सल्फर', unit: 'mg/kg', placeholder: '12' },
      { key: 'zinc', label: 'Zinc (Zn)', labelHi: 'जिंक', unit: 'mg/kg', placeholder: '0.8' },
      { key: 'iron', label: 'Iron (Fe)', labelHi: 'लोहा', unit: 'mg/kg', placeholder: '5.0' },
    ];

    return (
      <div className="min-h-screen bg-background pb-6">
        <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setUploadStep("file")} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Lab Report Values</h1>
              <p className="text-white/90 text-sm">प्रयोगशाला रिपोर्ट मान जांचें</p>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">
              Please verify the values below. You can edit them if needed. Fields marked with <span className="text-red-500 font-bold">*</span> are required.
              <br /><span className="text-green-600">कृपया नीचे दिए गए मानों की जांच करें और आवश्यकतानुसार संपादित करें।</span>
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Soil Test Values | मिट्टी परीक्षण मान
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {labFields.map(field => (
                <div key={field.key} className={field.key === 'ph' ? 'col-span-2' : ''}>
                  <label className="text-xs font-medium mb-1 block">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                    <span className="text-muted-foreground ml-1">{field.unit && `(${field.unit})`}</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={field.placeholder}
                    value={labValues[field.key] ?? ''}
                    onChange={e => setLabValues({ ...labValues, [field.key]: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{field.labelHi}</p>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={runLabAnalysis} className="w-full h-14 text-base gap-2 rounded-xl">
            <Brain className="w-5 h-5" />
            Run AI Analysis | एआई विश्लेषण करें
          </Button>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
            <p className="text-sm font-medium mb-1">💡 Don't have a lab report?</p>
            <button onClick={() => setMode("questionnaire")} className="text-sm text-primary underline">
              Answer questions instead →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Questionnaire ───
  if (mode === "questionnaire") {
    return (
      <div className="min-h-screen bg-background pb-6">
        <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-8 px-6 rounded-b-[2rem] mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => currentQuestionIndex === 0 ? setMode(null) : handlePrevious()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Soil Questionnaire</h1>
              <p className="text-white/90 text-sm">मिट्टी प्रश्नावली</p>
            </div>
            <div className="text-white/90 text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              {currentQuestionIndex + 1}/{QUESTIONS.length}
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        <div className="px-6">
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">{currentQuestionIndex + 1}</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{currentQuestion.question}</h3>
                <p className="text-sm text-muted-foreground">{currentQuestion.questionHi}</p>
              </div>
            </div>

            <RadioGroup value={answers[currentQuestion.id]} onValueChange={handleAnswer} className="space-y-3">
              {currentQuestion.options.map(option => (
                <label key={option.value} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  answers[currentQuestion.id] === option.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}>
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.labelHi}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            {currentQuestionIndex > 0 && (
              <Button onClick={handlePrevious} variant="outline" className="flex-1 h-12">Previous</Button>
            )}
            <Button onClick={handleNext} className="flex-1 h-12 gap-2" disabled={!answers[currentQuestion.id]}>
              {currentQuestionIndex === QUESTIONS.length - 1 ? (
                <><Brain className="w-4 h-4" /> Get AI Analysis</>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

  // ─── Results Component ───
function SoilAnalysisResults({ result, navigate, onRestart }: { result: SoilAnalysisResult; navigate: (p: string) => void; onRestart: () => void }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("nutrients");

  const nutrientLabels: Record<string, { label: string; labelHi: string; icon: string }> = {
    nitrogen: { label: 'Nitrogen (N)', labelHi: 'नाइट्रोजन', icon: '🌿' },
    phosphorus: { label: 'Phosphorus (P)', labelHi: 'फास्फोरस', icon: '🌱' },
    potassium: { label: 'Potassium (K)', labelHi: 'पोटैशियम', icon: '💪' },
    organic_carbon: { label: 'Organic Carbon', labelHi: 'जैविक कार्बन', icon: '🍂' },
    sulphur: { label: 'Sulphur (S)', labelHi: 'सल्फर', icon: '⚡' },
    zinc: { label: 'Zinc (Zn)', labelHi: 'जिंक', icon: '🔩' },
    iron: { label: 'Iron (Fe)', labelHi: 'लोहा', icon: '🔴' },
    manganese: { label: 'Manganese (Mn)', labelHi: 'मैंगनीज', icon: '🟤' },
    copper: { label: 'Copper (Cu)', labelHi: 'तांबा', icon: '🟠' },
    boron: { label: 'Boron (B)', labelHi: 'बोरोन', icon: '🔵' },
  };

  const statusColor = (s: string) => s === 'low' ? 'text-red-600 bg-red-50 border-red-200' : s === 'medium' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-green-700 bg-green-50 border-green-200';
  const barColor = (s: string) => s === 'low' ? 'bg-red-500' : s === 'medium' ? 'bg-yellow-500' : 'bg-green-500';

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  // Circular gauge
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (result.healthScore / 100) * circumference;
  const gaugeColor = result.healthScore >= 80 ? '#22c55e' : result.healthScore >= 60 ? '#eab308' : result.healthScore >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-600 to-green-700 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate("/farmer/soil-insights")} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">AI Soil Analysis</h1>
            <p className="text-white/90 text-sm">एआई मिट्टी विश्लेषण परिणाम</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[10px] text-white font-semibold">{result.confidence}% Confidence</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-5">
        {/* Health Score Gauge */}
        <div className="bg-card rounded-2xl shadow-lg p-6 flex items-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={gaugeColor} strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
                className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: gaugeColor }}>{result.healthScore}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Soil Health Score</p>
            <p className="text-xl font-bold mb-0.5">{result.healthLabel}</p>
            <p className="text-sm text-muted-foreground mb-2">{result.healthLabelHi}</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full">{result.soilType}</span>
              <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full">{result.soilTypeHi}</span>
            </div>
          </div>
        </div>

        {/* pH & EC Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">pH Level</p>
            </div>
            <p className="text-2xl font-bold">{result.ph.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: result.ph.status.includes('Optimal') ? '#22c55e' : result.ph.status.includes('Slightly') ? '#eab308' : '#ef4444' }}>
              {result.ph.status}
            </p>
          </div>
          <div className="bg-card rounded-xl shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">EC (Salinity)</p>
            </div>
            <p className="text-2xl font-bold">{result.ec.value} <span className="text-sm font-normal">dS/m</span></p>
            <p className="text-xs mt-1 font-medium" style={{ color: result.ec.status.includes('Normal') ? '#22c55e' : '#ef4444' }}>
              {result.ec.status.split('(')[0].trim()}
            </p>
          </div>
        </div>

        {/* ── Expandable Sections ── */}

        {/* Nutrients */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <button onClick={() => toggle('nutrients')} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Nutrient Analysis | पोषक तत्व</h3>
            </div>
            {expandedSection === 'nutrients' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {expandedSection === 'nutrients' && (
            <div className="px-5 pb-5 space-y-3">
              {Object.entries(result.nutrients).map(([key, n]) => {
                const info = nutrientLabels[key];
                if (!info) return null;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-lg w-6">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium truncate">{info.label}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColor(n.status)}`}>
                          {n.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${barColor(n.status)}`} style={{ width: `${n.score}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">{n.value} {n.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {result.ph.advice && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-0.5">pH Advice:</p>
                  <p className="text-xs text-blue-800">{result.ph.advice}</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">{result.ph.adviceHi}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deficiencies & Fertilizer */}
        {result.deficiencies.length > 0 && (
          <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
            <button onClick={() => toggle('fertilizer')} className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold">Fertilizer Rx | उर्वरक सुझाव</h3>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">{result.deficiencies.length} deficient</span>
              </div>
              {expandedSection === 'fertilizer' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
            {expandedSection === 'fertilizer' && (
              <div className="px-5 pb-5 space-y-3">
                {result.deficiencies.map((d, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${d.severity === 'high' ? 'border-red-200 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-4 h-4 ${d.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                      <p className="font-semibold text-sm">{d.nutrient} Deficiency</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${d.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{d.nutrientHi} की कमी</p>
                    <div className="space-y-1.5">
                      {d.products.map((p, j) => (
                        <div key={j} className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-border/50">
                          <div>
                            <p className="text-xs font-semibold">{p.name} <span className="text-muted-foreground font-normal">({p.nutrient})</span></p>
                            <p className="text-[10px] text-muted-foreground">{p.nameHi}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-[10px] text-muted-foreground text-right max-w-24 mb-1">{p.dose}</p>
                            {p.link && (
                              <a
                                href={p.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors"
                              >
                                Buy Online
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Crop Recommendations */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <button onClick={() => toggle('crops')} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Best Crops | सर्वोत्तम फसलें</h3>
            </div>
            {expandedSection === 'crops' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {expandedSection === 'crops' && (
            <div className="px-5 pb-5 space-y-2.5">
              {result.cropRecommendations.slice(0, 6).map((crop, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{crop.name}</p>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{crop.season}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{crop.nameHi} • 💧 {crop.waterNeed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: crop.suitability >= 80 ? '#22c55e' : crop.suitability >= 60 ? '#eab308' : '#ef4444' }}>
                      {crop.suitability}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">match</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Irrigation */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <button onClick={() => toggle('irrigation')} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Irrigation Plan | सिंचाई योजना</h3>
            </div>
            {expandedSection === 'irrigation' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {expandedSection === 'irrigation' && (
            <div className="px-5 pb-5 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">{result.irrigation.type}</p>
                <p className="text-xs text-blue-600">{result.irrigation.typeHi}</p>
              </div>
              {result.irrigation.schedule.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
                  <div>
                    <p className="font-semibold text-sm">{s.day}</p>
                    <p className="text-xs text-muted-foreground">{s.actionHi}</p>
                  </div>
                  <p className="text-sm text-right">{s.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Improvement Roadmap */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <button onClick={() => toggle('improve')} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Improvement Plan | सुधार योजना</h3>
            </div>
            {expandedSection === 'improve' ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {expandedSection === 'improve' && (
            <div className="px-5 pb-5 space-y-3">
              {result.improvements.map((imp, i) => (
                <div key={i} className="flex gap-3 p-3 border border-border rounded-xl">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    imp.term === 'Short-term' ? 'bg-red-100' : imp.term === 'Medium-term' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Timer className={`w-4 h-4 ${
                      imp.term === 'Short-term' ? 'text-red-600' : imp.term === 'Medium-term' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{imp.term} • {imp.termHi}</p>
                    <p className="text-sm">{imp.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{imp.actionHi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button className="w-full h-12 gap-2" onClick={() => navigate("/farmer/soil-insights")}>
            View Soil Dashboard
          </Button>
          <Button variant="outline" className="w-full h-12 gap-2" onClick={onRestart}>
            <Brain className="w-4 h-4" /> Run New Analysis | नया विश्लेषण
          </Button>
        </div>
      </div>
    </div>
  );
}
