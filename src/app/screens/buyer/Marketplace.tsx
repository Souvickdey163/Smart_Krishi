import { useState } from "react";
import { ArrowLeft, Filter, Search, MapPin, Star, X, ShoppingCart, Phone } from "lucide-react";
import { useNavigate } from "react-router";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useCropStore } from "../../context/CropStoreContext";
import { toast } from "sonner";

type FilterType = "all" | "organic" | "vegetables" | "grains" | "pulses" | "nearby";

export default function Marketplace() {
  const navigate = useNavigate();
  const { crops, isLoading, rateCrop } = useCropStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [ratingModal, setRatingModal] = useState<{ cropId: string; cropName: string } | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "organic", label: "🌿 Organic" },
    { value: "vegetables", label: "🥬 Vegetables" },
    { value: "grains", label: "🌾 Grains" },
    { value: "pulses", label: "🫘 Pulses" },
    { value: "nearby", label: "📍 Nearby" },
  ];

  // Apply filters
  let filteredProducts = crops;

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.cropName.toLowerCase().includes(q) ||
        p.farmer.toLowerCase().includes(q) ||
        (p.cropNameHi && p.cropNameHi.includes(q))
    );
  }

  // Category filter
  if (activeFilter === "organic") {
    filteredProducts = filteredProducts.filter((p) => p.organic);
  } else if (activeFilter === "vegetables") {
    filteredProducts = filteredProducts.filter((p) => p.category === "vegetables");
  } else if (activeFilter === "grains") {
    filteredProducts = filteredProducts.filter((p) => p.category === "grains");
  } else if (activeFilter === "pulses") {
    filteredProducts = filteredProducts.filter((p) => p.category === "pulses");
  } else if (activeFilter === "nearby") {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const distA = parseInt(a.distance || "999");
      const distB = parseInt(b.distance || "999");
      return distA - distB;
    });
  }

  const handleSubmitRating = async () => {
    if (!ratingModal || selectedStar === 0) return;
    setIsSubmittingRating(true);
    const success = await rateCrop(ratingModal.cropId, selectedStar, reviewText || undefined);
    setIsSubmittingRating(false);
    if (success) {
      toast.success(`Rated ${ratingModal.cropName} ${selectedStar} ⭐`);
      setRatingModal(null);
      setSelectedStar(0);
      setHoverStar(0);
      setReviewText("");
    } else {
      toast.error("Failed to submit rating");
    }
  };

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
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            <p className="text-white/90 text-sm">बाज़ार</p>
          </div>
          {!isLoading && (
            <div className="ml-auto bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="text-xs text-white font-medium">{crops.length} Listings</span>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search crops, farmers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white"
            />
          </div>
          <button className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-white/90 transition-colors">
            <Filter className="w-5 h-5 text-secondary" />
          </button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Interactive Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted/70 rounded" />
                  <div className="h-8 w-20 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">🔍</p>
            <h3 className="text-lg font-semibold mb-2">No crops found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : `No ${activeFilter} crops available`}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border hover:border-primary transition-all duration-200 hover:shadow-xl"
              >
                <div className="aspect-video bg-muted relative">
                  <ImageWithFallback
                    src={product.images?.[0] || ""}
                    alt={product.cropName}
                    className="w-full h-full object-cover"
                  />
                  {product.organic && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center gap-1">
                      🌿 Organic
                    </div>
                  )}
                  <button
                    onClick={() =>
                      setRatingModal({ cropId: product.id, cropName: product.cropName })
                    }
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-white transition-colors cursor-pointer group"
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">
                      {product.rating > 0 ? product.rating : "Rate"}
                    </span>
                    {product.ratingCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ({product.ratingCount})
                      </span>
                    )}
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.cropName}</h3>
                  {product.cropNameHi && (
                    <p className="text-sm text-muted-foreground mb-2">{product.cropNameHi}</p>
                  )}
                  {product.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        ₹{product.price}
                        <span className="text-sm text-muted-foreground font-normal">/kg</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} kg available
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border mb-3">
                    <p className="text-sm font-medium mb-1">Farmer: {product.farmer}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.farmerLocation || "Unknown"} • {product.distance || "—"} away
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 gap-1.5" size="sm">
                      <Phone className="w-4 h-4" />
                      Contact
                    </Button>
                    <Button variant="outline" className="flex-1 gap-1.5" size="sm">
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">Rate Product</h3>
                <p className="text-sm text-muted-foreground">उत्पाद को रेट करें</p>
              </div>
              <button
                onClick={() => {
                  setRatingModal(null);
                  setSelectedStar(0);
                  setHoverStar(0);
                  setReviewText("");
                }}
                className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="font-semibold text-center mb-4">{ratingModal.cropName}</p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setSelectedStar(star)}
                  className="transition-transform duration-200 hover:scale-125"
                >
                  <Star
                    className={`w-10 h-10 transition-colors duration-200 ${
                      star <= (hoverStar || selectedStar)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            {selectedStar > 0 && (
              <p className="text-center text-sm font-medium mb-4">
                {selectedStar === 1 && "Poor / खराब"}
                {selectedStar === 2 && "Fair / ठीक"}
                {selectedStar === 3 && "Good / अच्छा"}
                {selectedStar === 4 && "Very Good / बहुत अच्छा"}
                {selectedStar === 5 && "Excellent / उत्कृष्ट"}
              </p>
            )}

            {/* Optional Review */}
            <textarea
              placeholder="Write a review (optional) / समीक्षा लिखें..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full h-24 bg-muted rounded-xl p-3 text-sm resize-none border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors mb-4"
            />

            <Button
              className="w-full h-12 text-lg gap-2"
              disabled={selectedStar === 0 || isSubmittingRating}
              onClick={handleSubmitRating}
            >
              {isSubmittingRating ? (
                "Submitting..."
              ) : (
                <>
                  Submit Rating
                  {selectedStar > 0 && (
                    <span className="text-yellow-300">
                      {"⭐".repeat(selectedStar)}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
