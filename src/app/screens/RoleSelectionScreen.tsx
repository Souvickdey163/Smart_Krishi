import { useNavigate } from "react-router";
import { Tractor, ShoppingBag, Sprout } from "lucide-react";
import { Button } from "../components/ui/button";

export default function RoleSelectionScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-12 px-6 rounded-b-[2rem]">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Sprout className="w-8 h-8 text-primary" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-1">
          Choose Your Role
        </h1>
        <p className="text-center text-white/90">अपनी भूमिका चुनें</p>
      </div>

      {/* Role Selection */}
      <div className="flex-1 px-6 -mt-6 pb-12">
        <div className="space-y-4">
          {/* Farmer Card */}
          <button
            onClick={() => navigate("/farmer")}
            className="w-full bg-card rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-primary transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Tractor className="w-8 h-8 text-primary" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold mb-1">I am a Farmer</h3>
                <p className="text-base text-muted-foreground mb-1">मैं एक किसान हूं</p>
                <p className="text-sm text-muted-foreground">
                  Access crop insights, AI diagnosis & market prices
                </p>
              </div>
            </div>
          </button>

          {/* Buyer/Seller Card */}
          <button
            onClick={() => navigate("/buyer")}
            className="w-full bg-card rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-secondary transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <ShoppingBag className="w-8 h-8 text-secondary" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold mb-1">I am a Buyer / Seller</h3>
                <p className="text-base text-muted-foreground mb-1">
                  मैं एक खरीदार / विक्रेता हूं
                </p>
                <p className="text-sm text-muted-foreground">
                  Browse marketplace, connect with farmers & manage contracts
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Info Text */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-center text-muted-foreground">
            💡 You can switch roles anytime from your profile
          </p>
          <p className="text-sm text-center text-muted-foreground">
            आप किसी भी समय अपनी प्रोफ़ाइल से भूमिका बदल सकते हैं
          </p>
        </div>
      </div>
    </div>
  );
}
