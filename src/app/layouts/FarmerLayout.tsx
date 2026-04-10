import { Outlet } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { VoiceAssistant } from "../components/VoiceAssistant";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Home, Stethoscope, Sprout, MapPin, TrendingUp, User } from "lucide-react";

export default function FarmerLayout() {
  const navItems = [
    {
      to: "/farmer",
      icon: <Home className="w-6 h-6" />,
      label: "Home",
      labelHi: "होम",
    },
    {
      to: "/farmer/crop-doctor",
      icon: <Stethoscope className="w-6 h-6" />,
      label: "Crop Doctor",
      labelHi: "डॉक्टर",
    },
    {
      to: "/farmer/soil-insights",
      icon: <Sprout className="w-6 h-6" />,
      label: "Soil",
      labelHi: "मिट्टी",
    },
    {
      to: "/farmer/alert-map",
      icon: <MapPin className="w-6 h-6" />,
      label: "Alerts",
      labelHi: "अलर्ट",
    },
    {
      to: "/farmer/market",
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Market",
      labelHi: "बाज़ार",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />
      <LanguageSwitcher />
      <VoiceAssistant />
      <BottomNav items={navItems} />
    </div>
  );
}

