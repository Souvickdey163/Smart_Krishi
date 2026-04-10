import { useNavigate } from "react-router";
import { Camera, TrendingUp, Mic, Bell, User, ShoppingBag, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function FarmerHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Fetch initial alerts
    fetch("http://localhost:3001/api/pest-alerts")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAlerts(data.data.filter((a: any) => a.status === 'active'));
        }
      })
      .catch(console.error);
      
    // Listen for SSE updates
    const eventSource = new EventSource("http://localhost:3001/api/pest-alerts/stream");
    eventSource.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts(prev => {
        if (newAlert.status === 'resolved') {
          return prev.filter(a => a.id !== newAlert.id);
        }
        const exists = prev.find(a => a.id === newAlert.id);
        if (exists) return prev.map(a => a.id === newAlert.id ? newAlert : a);
        return [newAlert, ...prev];
      });
    };
    return () => eventSource.close();
  }, []);

  const unreadCount = alerts.length;

  const quickActions = [
    {
      title: t("Scan Crop"),
      icon: <Camera className="w-8 h-8" />,
      color: "bg-primary",
      action: () => navigate("/farmer/crop-doctor"),
    },
    {
      title: t("Sell Crops"),
      icon: <ShoppingBag className="w-8 h-8" />,
      color: "bg-secondary",
      action: () => navigate("/farmer/sell-crops"),
    },
    {
      title: t("Market Prices"),
      icon: <TrendingUp className="w-8 h-8" />,
      color: "bg-accent",
      action: () => navigate("/farmer/market"),
    },
    {
      title: t("Voice Help"),
      icon: <Mic className="w-8 h-8" />,
      color: "bg-green-600",
      action: () => navigate("/farmer/voice-help"),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-20 px-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {t("Namaste, Farmer 🌱")}
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-white text-xs flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/farmer/profile")}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Weather Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">{t("Today's Weather")}</p>
              <p className="text-3xl font-bold text-white">28°C</p>
              <p className="text-white/90 text-sm">Partly Cloudy</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Humidity</p>
              <p className="text-xl font-bold text-white">65%</p>
              <p className="text-white/80 text-sm mt-2">Wind: 12 km/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-12 mb-6">
        <div className="bg-card rounded-2xl shadow-lg p-5">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`${action.color} w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="flex-1" onClick={() => setShowNotifications(false)} />
          <div className="bg-background w-full h-[80vh] rounded-t-3xl shadow-2xl p-6 flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <h2 className="text-xl font-bold">{t("Notifications")}</h2>
              <button onClick={() => setShowNotifications(false)} className="p-2 bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-4 flex-1 pb-10">
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No new notifications.</p>
              ) : (
                alerts.map((alert: any) => (
                  <div key={alert.id} className="bg-card border border-red-200 shadow-sm rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <h4 className="font-bold text-red-700 flex items-center gap-1">
                          🚨 {alert.pest} Alert
                        </h4>
                        <p className="text-sm font-medium mt-1">Found in {alert.crop} near {alert.location.district}</p>
                        <p className="text-xs text-muted-foreground mt-2">Reported by {alert.farmerName}</p>
                      </div>
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                        High Risk
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}