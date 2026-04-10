import { useState } from "react";
import { ArrowLeft, Clock, CheckCircle, XCircle, Package, Star, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export default function Contracts() {
  const navigate = useNavigate();
  const [ratingModal, setRatingModal] = useState<{ dealId: string; farmer: string; crop: string } | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [activeDeals] = useState([
    {
      id: "C001",
      crop: "Basmati Rice",
      cropHi: "बासमती चावल",
      farmer: "Ramesh Kumar",
      quantity: "500 kg",
      price: "₹32,500",
      status: "In Progress",
      deliveryDate: "April 15, 2026",
      progress: 60,
    },
    {
      id: "C002",
      crop: "Organic Tomatoes",
      cropHi: "जैविक टमाटर",
      farmer: "Suresh Patel",
      quantity: "200 kg",
      price: "₹8,000",
      status: "Ready to Ship",
      deliveryDate: "April 12, 2026",
      progress: 90,
    },
  ]);

  const [prebookedCrops] = useState([
    {
      id: "P001",
      crop: "Wheat",
      cropHi: "गेहूं",
      farmer: "Vijay Singh",
      quantity: "1000 kg",
      price: "₹21,500",
      harvestDate: "May 20, 2026",
      status: "Growing",
    },
    {
      id: "P002",
      crop: "Cotton",
      cropHi: "कपास",
      farmer: "Mohan Lal",
      quantity: "300 kg",
      price: "₹20,400",
      harvestDate: "June 10, 2026",
      status: "Growing",
    },
  ]);

  const [completedDeals, setCompletedDeals] = useState([
    {
      id: "D001",
      crop: "Potatoes",
      farmer: "Ajay Kumar",
      quantity: "800 kg",
      price: "₹20,000",
      completedDate: "April 5, 2026",
      rating: 0,
      rated: false,
    },
    {
      id: "D002",
      crop: "Onions",
      farmer: "Ravi Sharma",
      quantity: "600 kg",
      price: "₹18,000",
      completedDate: "April 2, 2026",
      rating: 0,
      rated: false,
    },
    {
      id: "D003",
      crop: "Organic Carrots",
      farmer: "Suresh Patel",
      quantity: "150 kg",
      price: "₹6,750",
      completedDate: "March 28, 2026",
      rating: 4.8,
      rated: true,
    },
  ]);

  const handleSubmitRating = () => {
    if (!ratingModal || selectedStar === 0) return;

    setCompletedDeals((prev) =>
      prev.map((d) =>
        d.id === ratingModal.dealId ? { ...d, rating: selectedStar, rated: true } : d
      )
    );

    toast.success(`Rated ${ratingModal.farmer}'s ${ratingModal.crop}: ${"⭐".repeat(selectedStar)}`);
    setRatingModal(null);
    setSelectedStar(0);
    setHoverStar(0);
    setReviewText("");
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
            <h1 className="text-2xl font-bold text-white">Orders & Purchases</h1>
            <p className="text-white/90 text-sm">आदेश और खरीद</p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="prebooked">Pre-ordered</TabsTrigger>
            <TabsTrigger value="completed">Delivered</TabsTrigger>
          </TabsList>

          {/* Active Deals */}
          <TabsContent value="active" className="space-y-4">
            {activeDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-card rounded-2xl shadow-lg p-5 border border-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{deal.crop}</h3>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {deal.cropHi}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Contract ID: {deal.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{deal.price}</p>
                    <p className="text-xs text-muted-foreground">{deal.quantity}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Farmer:</span>
                    <span className="font-medium">{deal.farmer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expected Delivery:</span>
                    <span className="font-medium">{deal.deliveryDate}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="font-medium">{deal.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                      Track Delivery
                    </button>
                    <button className="flex-1 h-10 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
                      Contact Farmer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Pre-booked Crops */}
          <TabsContent value="prebooked" className="space-y-4">
            {prebookedCrops.map((crop) => (
              <div
                key={crop.id}
                className="bg-card rounded-2xl shadow-lg p-5 border border-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-5 h-5 text-secondary" />
                      <h3 className="font-semibold text-lg">{crop.crop}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {crop.cropHi}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pre-Booking ID: {crop.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary">{crop.price}</p>
                    <p className="text-xs text-muted-foreground">{crop.quantity}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Farmer:</span>
                    <span className="font-medium">{crop.farmer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expected Harvest:</span>
                    <span className="font-medium">{crop.harvestDate}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {crop.status} • Fresh organic produce on harvest
                    </span>
                  </div>

                  <button className="w-full h-10 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors">
                    View Growth Updates
                  </button>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Completed Deals */}
          <TabsContent value="completed" className="space-y-4">
            {completedDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-card rounded-2xl shadow-lg p-5 border border-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-lg">{deal.crop}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contract ID: {deal.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{deal.price}</p>
                    <p className="text-xs text-muted-foreground">{deal.quantity}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Farmer:</span>
                    <span className="font-medium">{deal.farmer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed On:</span>
                    <span className="font-medium">{deal.completedDate}</span>
                  </div>

                  {/* Interactive Rating */}
                  <button
                    onClick={() => {
                      if (!deal.rated) {
                        setRatingModal({
                          dealId: deal.id,
                          farmer: deal.farmer,
                          crop: deal.crop,
                        });
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      deal.rated
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200 hover:border-yellow-400 cursor-pointer"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        deal.rated ? "text-green-700" : "text-yellow-700"
                      }`}
                    >
                      {deal.rated ? "Your Rating:" : "⭐ Tap to Rate Farmer"}
                    </span>
                    <div className="flex items-center gap-1">
                      {deal.rated ? (
                        <>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= Math.round(deal.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="text-sm font-semibold ml-1">{deal.rating}</span>
                        </>
                      ) : (
                        <span className="text-xs text-yellow-600 font-medium">
                          Rate Now →
                        </span>
                      )}
                    </div>
                  </button>

                  <button className="w-full h-10 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold">Rate Farmer</h3>
                <p className="text-sm text-muted-foreground">किसान को रेट करें</p>
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

            <div className="text-center mb-4">
              <p className="font-semibold">{ratingModal.crop}</p>
              <p className="text-sm text-muted-foreground">from {ratingModal.farmer}</p>
            </div>

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
              disabled={selectedStar === 0}
              onClick={handleSubmitRating}
            >
              Submit Rating
              {selectedStar > 0 && (
                <span className="text-yellow-300">{"⭐".repeat(selectedStar)}</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}