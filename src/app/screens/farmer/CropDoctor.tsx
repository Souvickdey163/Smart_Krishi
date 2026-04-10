import { useState, useRef } from "react";
import { Camera, Upload, ArrowLeft, CheckCircle, AlertCircle, RefreshCw, ScanLine, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { toast } from "sonner";
import { analyzeCropImage, type CropDiagnosisResult } from "../../services/cropDoctorService";

export default function CropDoctor() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CropDiagnosisResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create object URL for immediate display
    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(objectUrl);
    setIsScanning(true);

    try {
      // Simulate typical ML upload & processing delay (e.g., 3 seconds) for a better UX,
      // while making the actual backend call simultaneously.
      const minDelay = new Promise(resolve => setTimeout(resolve, 3000));
      const backendCall = analyzeCropImage(file);
      
      const [_, result] = await Promise.all([minDelay, backendCall]);
      
      setDiagnosis(result);
    } catch (err) {
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    setDiagnosis(null);
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />

      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              if (selectedImage) URL.revokeObjectURL(selectedImage);
              navigate("/farmer");
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Crop Doctor AI</h1>
            <p className="text-white/90 text-sm">फसल डॉक्टर AI</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {!selectedImage ? (
          <>
            {/* Upload Options */}
            <div className="bg-card rounded-2xl shadow-lg p-6 border-2 border-border">
              <h2 className="text-lg font-semibold mb-4 text-center">
                Upload Crop Image | फसल की तस्वीर अपलोड करें
              </h2>

              <div className="space-y-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full bg-primary text-primary-foreground rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-primary/90 transition-colors shadow-md"
                >
                  <Camera className="w-12 h-12" />
                  <div className="text-center">
                    <p className="font-semibold text-lg">Take Photo</p>
                    <p className="text-sm opacity-90">फोटो लें</p>
                  </div>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase">or</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-secondary text-secondary-foreground rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-secondary/90 transition-colors shadow-md"
                >
                  <Upload className="w-12 h-12" />
                  <div className="text-center">
                    <p className="font-semibold text-lg">Upload from Gallery</p>
                    <p className="text-sm opacity-90">गैलरी से अपलोड करें</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                <ScanLine className="w-5 h-5" />
                Photo Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-700/80">
                <li>• Take a clear, well-lit photo of the affected area</li>
                <li>• Get close to the diseased leaves or stems</li>
                <li>• Avoid shadows and blur</li>
                <li className="pt-2 font-medium border-t border-blue-200/50 mt-2 text-blue-800">• साफ और अच्छी रोशनी में फोटो लें</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Display Image & Bounding Box ML Animation */}
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden border-2 border-primary/20">
              <div className="relative aspect-square w-full bg-black/5 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Scanned crop"
                  className={`w-full h-full object-cover transition-all duration-700 ${isScanning ? 'scale-105 blur-[2px] brightness-75' : 'scale-100 blur-0'} `}
                />
                
                {isScanning && (
                  <>
                    {/* ML Scanning Laser */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <div className="w-full h-1 bg-green-500 shadow-[0_0_15px_5px_rgba(34,197,94,0.5)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    {/* Random Detection Boxes Simulation */}
                    <div className="absolute inset-x-8 inset-y-12 border-2 border-green-500/50 rounded-lg animate-pulse z-10 p-2">
                      <span className="bg-green-500/80 text-white text-[10px] px-1 font-mono absolute -top-4 left-0 rounded-t">detecting features...</span>
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                    </div>
                    {/* Centered Loading text */}
                    <div className="absolute z-20 flex flex-col items-center justify-center">
                      <RefreshCw className="w-10 h-10 text-white animate-spin mb-3 shadow-lg" />
                      <div className="bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">
                        AI Analysis in Progress...
                      </div>
                    </div>
                  </>
                )}

                {!isScanning && diagnosis && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5 border-2 border-white/20 backdrop-blur-sm">
                    <CheckCircle className="w-4 h-4" /> Analyzed
                  </div>
                )}
              </div>
            </div>

            {/* Diagnosis Result */}
            {!isScanning && diagnosis && (
              <>
                <div className="bg-card rounded-2xl shadow-lg p-6 border-l-4 border-l-red-500">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 border border-red-200">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1 text-red-700">
                        {diagnosis.diseaseName}
                      </h3>
                      <p className="text-sm text-red-600/80 font-medium mb-2">
                        {diagnosis.diseaseNameHi}
                      </p>
                      <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                        <ScanLine className="w-3.5 h-3.5" />
                        {diagnosis.confidence}% Confidence Match
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border mt-3 mb-4">
                    <p className="mb-1">{diagnosis.description}</p>
                    <p className="text-xs">{diagnosis.descriptionHi}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Recommended Action Plan:
                      </h4>
                      <ul className="space-y-3">
                        {diagnosis.actionPlan.map((action, i) => (
                          <li key={i} className="flex gap-3 text-sm items-start">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">{action.step}</p>
                              <p className="text-xs text-muted-foreground">{action.stepHi}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Nearby/Recommended Products */}
                <div className="bg-card rounded-2xl shadow-lg p-6">
                  <h3 className="font-bold mb-4 flex items-center justify-between">
                    Recommended Products
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">Buy Online</span>
                  </h3>
                  <div className="space-y-3">
                    {diagnosis.recommendedProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-xl hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-bold text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{product.nameHi}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="font-bold text-primary text-sm">{product.price}</p>
                          {product.link && (
                            <a
                              href={product.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-green-600/20"
                            >
                              Buy <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scan Another */}
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-14 rounded-xl font-semibold border-2"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Scan Another Crop | दूसरी फसल स्कैन करें
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
