import { ArrowLeft, Droplets, ThermometerSun, Activity, Sprout, FileText, Brain, Sparkles, Leaf, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { getLastAnalysis, type SoilAnalysisResult } from "../../services/soilService";

export default function SoilInsights() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<SoilAnalysisResult | null>(null);

  useEffect(() => {
    const saved = getLastAnalysis();
    if (saved) setAnalysis(saved);
  }, []);

  // Dynamic metrics from analysis or fallback defaults
  const soilMetrics = analysis ? [
    {
      label: "pH Level", labelHi: "pH स्तर",
      value: String(analysis.ph.value),
      status: analysis.ph.status.includes('Optimal') ? 'Optimal' : analysis.ph.status.includes('Slightly') ? 'Moderate' : 'Alert',
      icon: Activity, color: "text-primary",
    },
    {
      label: "Nitrogen", labelHi: "नाइट्रोजन",
      value: `${analysis.nutrients.nitrogen.value} kg/ha`,
      status: analysis.nutrients.nitrogen.status === 'high' ? 'High' : analysis.nutrients.nitrogen.status === 'medium' ? 'Medium' : 'Low',
      icon: Sprout, color: "text-green-600",
    },
    {
      label: "Phosphorus", labelHi: "फास्फोरस",
      value: `${analysis.nutrients.phosphorus.value} kg/ha`,
      status: analysis.nutrients.phosphorus.status === 'high' ? 'High' : analysis.nutrients.phosphorus.status === 'medium' ? 'Medium' : 'Low',
      icon: Leaf, color: "text-blue-600",
    },
    {
      label: "Potassium", labelHi: "पोटैशियम",
      value: `${analysis.nutrients.potassium.value} kg/ha`,
      status: analysis.nutrients.potassium.status === 'high' ? 'High' : analysis.nutrients.potassium.status === 'medium' ? 'Medium' : 'Low',
      icon: ThermometerSun, color: "text-orange-600",
    },
  ] : [
    { label: "pH Level", labelHi: "pH स्तर", value: "—", status: "Not tested", icon: Activity, color: "text-primary" },
    { label: "Nitrogen", labelHi: "नाइट्रोजन", value: "—", status: "Not tested", icon: Sprout, color: "text-green-600" },
    { label: "Phosphorus", labelHi: "फास्फोरस", value: "—", status: "Not tested", icon: Leaf, color: "text-blue-600" },
    { label: "Potassium", labelHi: "पोटैशियम", value: "—", status: "Not tested", icon: ThermometerSun, color: "text-orange-600" },
  ];

  const recommendedCrops = analysis
    ? analysis.cropRecommendations.slice(0, 4).map(c => ({ name: c.name, nameHi: c.nameHi, season: c.season, suitability: c.suitability }))
    : [
      { name: "Wheat", nameHi: "गेहूं", season: "Rabi", suitability: 0 },
      { name: "Rice", nameHi: "धान", season: "Kharif", suitability: 0 },
      { name: "Mustard", nameHi: "सरसों", season: "Rabi", suitability: 0 },
    ];

  const irrigationSchedule = analysis
    ? analysis.irrigation.schedule
    : [
      { day: "—", action: "Run soil analysis first", actionHi: "पहले मिट्टी विश्लेषण करें" },
    ];

  const statusBadgeColor = (s: string) => {
    if (s === 'Optimal' || s === 'High') return 'bg-green-100 text-green-700';
    if (s === 'Medium' || s === 'Moderate' || s === 'Good') return 'bg-yellow-100 text-yellow-700';
    if (s === 'Low' || s === 'Alert') return 'bg-red-100 text-red-700';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/farmer")}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Soil & Insights</h1>
            <p className="text-white/90 text-sm">मिट्टी और अंतर्दृष्टि</p>
          </div>
          {analysis && (
            <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[10px] text-white font-semibold">Score: {analysis.healthScore}/100</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Soil Profile Analyzer CTA */}
        <div className="bg-gradient-to-r from-secondary/20 to-accent/20 rounded-2xl p-5 border border-secondary/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                {analysis ? 'Update Soil Analysis' : 'Get AI Soil Analysis'}
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">AI POWERED</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {analysis
                  ? `Last analyzed: ${new Date(analysis.timestamp).toLocaleDateString()} • ${analysis.analysisType === 'lab_report' ? 'Lab Report' : 'Q&A Based'}`
                  : 'Upload lab report or answer questions to get personalized recommendations'
                }
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {analysis ? 'नया विश्लेषण करें' : 'एआई-संचालित मिट्टी विश्लेषण'}
              </p>
              <Button
                onClick={() => navigate("/farmer/soil-profile-analyzer")}
                className="w-full gap-2"
                variant="default"
              >
                <Brain className="w-4 h-4" />
                {analysis ? 'Re-Analyze / फिर से विश्लेषण' : 'Analyze Soil / मिट्टी विश्लेषण करें'}
              </Button>
            </div>
          </div>
        </div>

        {/* Health Score Banner (only if analysis exists) */}
        {analysis && (
          <div className={`rounded-2xl p-5 border-2 ${
            analysis.healthScore >= 80 ? 'bg-green-50 border-green-200' :
            analysis.healthScore >= 60 ? 'bg-yellow-50 border-yellow-200' :
            analysis.healthScore >= 40 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Soil Health</p>
                <p className="text-3xl font-bold" style={{
                  color: analysis.healthScore >= 80 ? '#22c55e' : analysis.healthScore >= 60 ? '#eab308' : analysis.healthScore >= 40 ? '#f97316' : '#ef4444'
                }}>
                  {analysis.healthScore}/100
                </p>
                <p className="text-sm font-medium">{analysis.healthLabel}</p>
                <p className="text-xs text-muted-foreground">{analysis.soilType} • {analysis.soilTypeHi}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{analysis.healthLabelHi}</p>
                {analysis.deficiencies.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{analysis.deficiencies.length} deficiencies</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Soil Health Card */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            {analysis ? 'Nutrient Levels | पोषक तत्व स्तर' : 'Soil Health Profile | मिट्टी स्वास्थ्य'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {soilMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                  <p className="text-xl font-bold mb-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.labelHi}</p>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadgeColor(metric.status)}`}>
                      {metric.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Crops */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Recommended Crops | सुझाई गई फसलें
          </h2>
          {!analysis && (
            <p className="text-xs text-muted-foreground mb-3 bg-muted/50 rounded-lg p-2">
              ⚡ Run AI Soil Analysis to get personalized crop recommendations
            </p>
          )}
          <div className="space-y-3">
            {recommendedCrops.map((crop, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{crop.name}</p>
                    <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                      {crop.season}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{crop.nameHi}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${crop.suitability}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {crop.suitability > 0 ? `${crop.suitability}%` : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Suitable</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Irrigation Advice */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Irrigation Schedule | सिंचाई अनुसूची
          </h2>
          {analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-blue-800">{analysis.irrigation.type}</p>
              <p className="text-xs text-blue-600">{analysis.irrigation.typeHi}</p>
            </div>
          )}
          <div className="space-y-3">
            {irrigationSchedule.map((schedule, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
                <div>
                  <p className="font-semibold text-sm">{schedule.day}</p>
                  <p className="text-xs text-muted-foreground">{schedule.actionHi}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{schedule.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Harvest Timing */}
        {analysis && (
          <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl p-6 border border-accent/30">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🌾 Top Crop Suggestion
            </h3>
            <p className="text-sm mb-2">
              Based on your soil analysis, <strong>{analysis.cropRecommendations[0]?.name}</strong> has the highest suitability at <strong>{analysis.cropRecommendations[0]?.suitability}%</strong> for the {analysis.cropRecommendations[0]?.season} season.
            </p>
            <p className="text-sm text-muted-foreground">
              आपकी मिट्टी के विश्लेषण के अनुसार, <strong>{analysis.cropRecommendations[0]?.nameHi}</strong> सबसे उपयुक्त फसल है।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}