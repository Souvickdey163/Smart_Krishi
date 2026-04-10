import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

export default function PostDemand() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    crop: "",
    quantity: "",
    budget: "",
    location: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your demand has been posted! Nearby farmers will be notified. / आपकी मांग पोस्ट कर दी गई है!");
    navigate("/buyer/contracts");
  };

  const popularCrops = [
    "Wheat",
    "Rice",
    "Potatoes",
    "Onions",
    "Tomatoes",
    "Cotton",
    "Maize",
    "Sugarcane",
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/buyer")}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Post Organic Demand</h1>
            <p className="text-white/90 text-sm">जैविक फसल की मांग</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Info Card */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-5 border border-primary/30">
          <h3 className="font-semibold mb-2">📢 Looking for Fresh Organic Produce?</h3>
          <p className="text-sm text-muted-foreground">
            Fill in the details below and nearby farmers will reach out to you with their fresh organic crops.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ताज़ी जैविक फसलों के लिए नीचे विवरण भरें।
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
            {/* Crop Selection */}
            <div className="space-y-2">
              <Label htmlFor="crop">
                Crop Needed | आवश्यक फसल
              </Label>
              <Input
                id="crop"
                placeholder="e.g., Wheat, Rice, Potatoes"
                value={formData.crop}
                onChange={(e) =>
                  setFormData({ ...formData, crop: e.target.value })
                }
                className="h-12"
                required
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {popularCrops.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => setFormData({ ...formData, crop })}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity Required | आवश्यक मात्रा
              </Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity in kg"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="h-12"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kg
                </span>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">
                Budget Per KG | प्रति किलो बजट
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter your budget"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  className="h-12 pl-8"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Delivery Location | डिलीवरी स्थान
              </Label>
              <Input
                id="location"
                placeholder="e.g., Delhi, Mumbai, Jaipur"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="h-12"
                required
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Additional Notes (Optional) | अतिरिक्त जानकारी
              </Label>
              <Textarea
                id="notes"
                placeholder="Preference for organic, pesticide-free crops..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="min-h-24 resize-none"
              />
            </div>

            {/* Organic Preference */}
            <div className="space-y-3">
              <Label>Certification Preference | प्रमाणन वरीयता</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-sm">Organic Certified</p>
                    <p className="text-xs text-muted-foreground">जैविक प्रमाणित</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-sm">Pesticide Free</p>
                    <p className="text-xs text-muted-foreground">कीटनाशक मुक्त</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-14 text-lg gap-2">
            <Plus className="w-5 h-5" />
            Post Request | अनुरोध पोस्ट करें
          </Button>
        </form>

        {/* Info Footer */}
        <div className="bg-muted/50 rounded-xl p-5">
          <h3 className="font-semibold mb-2">💡 Tips:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Specify if you prefer organic or certified crops</li>
            <li>• Set a realistic budget based on market rates</li>
            <li>• Farmers within 50 km will see your request</li>
            <li>• Direct from farm to city - fresh & healthy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}