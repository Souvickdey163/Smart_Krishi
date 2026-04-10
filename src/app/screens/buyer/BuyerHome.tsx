import { useNavigate } from "react-router";
import { Bell, User, TrendingUp, Users, Package, Star, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useCropStore } from "../../context/CropStoreContext";

export default function BuyerHome() {
  const navigate = useNavigate();
  const { crops, isLoading } = useCropStore();

  // Take latest 2 crops as featured
  const featuredCrops = crops.slice(0, 2);

  // Derive unique farmer count from listings
  const uniqueFarmers = new Set(crops.map((c) => c.farmer)).size;

  // Derive organic crop count
  const organicCount = crops.filter((c) => c.organic).length;

  const nearbyFarmers = [
    { name: "Vijay Singh", crops: "Wheat, Rice", distance: "5 km", rating: 4.8 },
    { name: "Mohan Lal", crops: "Vegetables", distance: "8 km", rating: 4.6 },
    { name: "Ajay Kumar", crops: "Cotton, Maize", distance: "12 km", rating: 4.5 },
  ];

  const demandHighlights = [
    { crop: "Onions", demand: "High", trend: "up" },
    { crop: "Potatoes", demand: "Medium", trend: "stable" },
    { crop: "Tomatoes", demand: "High", trend: "up" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-20 px-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome, City Buyer 🛒
            </h1>
            <p className="text-white/90">स्वागत है, शहरी खरीदार</p>
          </div>
          <div className="flex gap-3">
            <button className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center">
                2
              </span>
            </button>
            <button
              onClick={() => navigate("/buyer/profile")}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <Package className="w-6 h-6 text-white mb-2" />
            <p className="text-2xl font-bold text-white">{crops.length}</p>
            <p className="text-xs text-white/80">Listings</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <Users className="w-6 h-6 text-white mb-2" />
            <p className="text-2xl font-bold text-white">{uniqueFarmers}</p>
            <p className="text-xs text-white/80">Farmers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <TrendingUp className="w-6 h-6 text-white mb-2" />
            <p className="text-2xl font-bold text-white">{organicCount}</p>
            <p className="text-xs text-white/80">Organic</p>
          </div>
        </div>
      </div>

      {/* Featured Crops — Dynamic from CropStore */}
      <div className="px-6 -mt-12 mb-6">
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Fresh Crops | ताज़ी फसलें
            </h2>
            <button
              onClick={() => navigate("/buyer/marketplace")}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-3 bg-muted/50 rounded-xl animate-pulse">
                  <div className="w-24 h-24 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted/70 rounded" />
                    <div className="h-5 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {featuredCrops.map((crop) => (
                <div
                  key={crop.id}
                  className="flex gap-4 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate("/buyer/marketplace")}
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
                    <ImageWithFallback
                      src={crop.images?.[0] || ""}
                      alt={crop.cropName}
                      className="w-full h-full object-cover"
                    />
                    {crop.organic && (
                      <div className="absolute top-1 left-1 bg-green-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-medium">
                        🌿
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{crop.cropName}</h3>
                    {crop.cropNameHi && (
                      <p className="text-sm text-muted-foreground mb-2">{crop.cropNameHi}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-primary">₹{crop.price}/kg</p>
                        <p className="text-xs text-muted-foreground">
                          {crop.quantity} kg available
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold">{crop.rating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">From</p>
                        <p className="text-sm font-medium">{crop.farmer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nearby Farmers */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Nearby Farmers | नजदीकी किसान
        </h2>
        <div className="space-y-3">
          {nearbyFarmers.map((farmer, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-4 shadow-sm border border-border"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold mb-1">{farmer.name}</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {farmer.crops}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    📍 {farmer.distance} away
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{farmer.rating}</span>
                  </div>
                  <button className="text-sm text-primary hover:underline">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demand Highlights */}
      <div className="px-6 mb-6">
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <h2 className="text-lg font-semibold mb-4">
            Demand Highlights | मांग की जानकारी
          </h2>
          <div className="space-y-3">
            {demandHighlights.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <span className="font-medium">{item.crop}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      item.demand === "High"
                        ? "text-destructive"
                        : "text-orange-600"
                    }`}
                  >
                    {item.demand} Demand
                  </span>
                  {item.trend === "up" && (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="px-6 mb-6">
        <button
          onClick={() => navigate("/buyer/post-demand")}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-1">
            Post Organic Crop Demand
          </h3>
          <p className="text-sm opacity-90">
            जैविक फसलें खोजें
          </p>
        </button>
      </div>
    </div>
  );
}