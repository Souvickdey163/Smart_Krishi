import { Outlet } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { VoiceAssistant } from "../components/VoiceAssistant";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Home, ShoppingCart, PlusCircle, Package } from "lucide-react";

export default function BuyerLayout() {
  const navItems = [
    {
      to: "/buyer",
      icon: <Home className="w-6 h-6" />,
      label: "Home",
      labelHi: "होम",
    },
    {
      to: "/buyer/marketplace",
      icon: <ShoppingCart className="w-6 h-6" />,
      label: "Market",
      labelHi: "बाज़ार",
    },
    {
      to: "/buyer/post-demand",
      icon: <PlusCircle className="w-6 h-6" />,
      label: "Post",
      labelHi: "पोस्ट",
    },
    {
      to: "/buyer/contracts",
      icon: <Package className="w-6 h-6" />,
      label: "Orders",
      labelHi: "आदेश",
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