import { ArrowLeft, Upload, Plus, Minus, Camera, IndianRupee, Trash2, Leaf } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { useCropStore } from "../../context/CropStoreContext";

export default function SellCrops() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addCrop } = useCropStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quantity, setQuantity] = useState(100);
  const [images, setImages] = useState<string[]>([]);
  const [cropName, setCropName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isOrganic, setIsOrganic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      toast.error("You can only upload up to 4 images max");
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!cropName || !price || !category) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:3001/api/crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName, category, quantity, price, description, images, organic: isOrganic
        })
      });
      const data = await response.json();
      
      if (data.success) {
        // Push to shared context so buyer side sees it immediately
        addCrop(data.data);
        toast.success("Your crop listing has been successfully submitted to the market!");
        setTimeout(() => navigate("/farmer"), 1500);
      } else {
        toast.error("Failed to list crop: " + data.error);
      }
    } catch (err) {
      toast.error("Server error submitting crop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "grains", label: "Grains / अनाज" },
    { value: "vegetables", label: "Vegetables / सब्जियां" },
    { value: "fruits", label: "Fruits / फल" },
    { value: "pulses", label: "Pulses / दालें" },
    { value: "organic", label: "Organic / जैविक" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <input 
        type="file" 
        accept="image/*" 
        multiple
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/farmer")}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("Sell Crops")}</h1>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Info Card */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
          <p className="text-sm">
            <span className="font-semibold">📢 Direct to Buyers:</span> List your crops and connect directly with city buyers looking for fresh, organic produce!
          </p>
        </div>

        {/* Crop Details Form */}
        <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
          <h2 className="font-semibold text-lg mb-4">Crop Details / फसल विवरण</h2>

          {/* Crop Name */}
          <div className="space-y-2">
            <Label htmlFor="cropName">Crop Name / फसल का नाम *</Label>
            <Input
              id="cropName"
              placeholder="e.g., Basmati Rice, Organic Tomatoes"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category / श्रेणी *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organic Certified Toggle */}
          <div className="space-y-2">
            <Label>Organic Certified / जैविक प्रमाणित</Label>
            <button
              type="button"
              onClick={() => setIsOrganic(!isOrganic)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                isOrganic
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-border bg-muted/30 hover:border-muted-foreground/30"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isOrganic
                    ? "bg-green-500 text-white shadow-md scale-110"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Leaf className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-semibold ${isOrganic ? "text-green-700" : ""}`}>
                  {isOrganic ? "✅ Organic Certified" : "Mark as Organic"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOrganic
                    ? "Your crop will be highlighted with an organic badge in the marketplace"
                    : "जैविक प्रमाणित फसल के रूप में चिह्नित करें"}
                </p>
              </div>
              {/* Toggle switch */}
              <div
                className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                  isOrganic ? "bg-green-500" : "bg-muted"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    isOrganic ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity (kg) / मात्रा *</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(10, quantity - 10))}
                className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-12 text-center font-semibold text-lg flex-1"
              />
              <button
                onClick={() => setQuantity(quantity + 10)}
                className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Price per kg */}
          <div className="space-y-2">
            <Label htmlFor="price">Price per kg / प्रति किलो कीमत *</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                placeholder="e.g., 45"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-12 pl-10"
              />
            </div>
          </div>

          {/* Total Value Display */}
          {price && quantity && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Value / कुल मूल्य:</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{(Number(price) * quantity).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / विवरण (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your crop quality, farming method, harvest date..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Crop Images / फोटो (optional)</Label>
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="aspect-square bg-muted rounded-lg flex items-center justify-center relative group overflow-hidden"
                >
                  <img src={img} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add</span>
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Add up to 4 photos of your crop
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-semibold"
          >
            {isSubmitting ? "Listing..." : "List Crop for Sale / फसल सूचीबद्ध करें"}
          </Button>
        </div>
      </div>
    </div>
  );
}
