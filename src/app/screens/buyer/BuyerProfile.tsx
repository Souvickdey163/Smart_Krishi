import { ArrowLeft, User, Phone, MapPin, Mail, Star, LogOut, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";

export default function BuyerProfile() {
  const navigate = useNavigate();

  const stats = [
    { label: "Total Orders", value: "142" },
    { label: "Active Contracts", value: "8" },
    { label: "Trust Score", value: "95%" },
  ];

  const recentOrders = [
    { crop: "Basmati Rice", quantity: "500 kg", date: "April 8, 2026" },
    { crop: "Organic Tomatoes", quantity: "200 kg", date: "April 5, 2026" },
    { crop: "Fresh Potatoes", quantity: "800 kg", date: "April 2, 2026" },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary to-secondary/90 pt-12 pb-16 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/buyer")}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-white/90 text-sm">प्रोफाइल</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                Rajesh Trading Co.
              </h2>
              <p className="text-white/90 text-sm mb-1">Buyer ID: #BY54321</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-white text-sm font-medium">4.8 Rating</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Personal Information */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            Business Information | व्यापार जानकारी
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">+91 98765 12345</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-medium">rajesh@tradingco.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="font-medium">Azadpur Market, Delhi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders History */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            Recent Orders | हाल के ऑर्डर
          </h3>
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="font-medium">{order.crop}</p>
                  <p className="text-sm text-muted-foreground">{order.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 h-10 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
            View All Orders
          </button>
        </div>

        {/* Trust & Ratings */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            Trust & Ratings | विश्वास और रेटिंग
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
              <div>
                <p className="font-medium text-green-700">Verified Buyer</p>
                <p className="text-xs text-green-600">✓ Phone & Email Verified</p>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">
                  Payment Score
                </p>
                <p className="text-2xl font-bold text-primary">98%</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">
                  On-Time Pickup
                </p>
                <p className="text-2xl font-bold text-primary">95%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            Quick Links | त्वरित लिंक
          </h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <span>Payment Methods</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <span>Saved Addresses</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <span>Help & Support</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <span>Terms & Conditions</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Switch Role */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => navigate("/select-role")}
        >
          Switch to Farmer Role
        </Button>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full h-12 gap-2"
          onClick={() => navigate("/login")}
        >
          <LogOut className="w-5 h-5" />
          Logout | लॉग आउट
        </Button>
      </div>
    </div>
  );
}
