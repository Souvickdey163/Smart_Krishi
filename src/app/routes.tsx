import { createBrowserRouter } from "react-router";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import RoleSelectionScreen from "./screens/RoleSelectionScreen";
import FarmerLayout from "./layouts/FarmerLayout";
import BuyerLayout from "./layouts/BuyerLayout";
import FarmerHome from "./screens/farmer/FarmerHome";
import CropDoctor from "./screens/farmer/CropDoctor";
import SoilInsights from "./screens/farmer/SoilInsights";
import AlertMap from "./screens/farmer/AlertMap";
import Market from "./screens/farmer/Market";
import FarmerProfile from "./screens/farmer/FarmerProfile";
import SellCrops from "./screens/farmer/SellCrops";
import SoilProfileAnalyzer from "./screens/farmer/SoilProfileAnalyzer";
import BuyerHome from "./screens/buyer/BuyerHome";
import Marketplace from "./screens/buyer/Marketplace";
import PostDemand from "./screens/buyer/PostDemand";
import Contracts from "./screens/buyer/Contracts";
import BuyerProfile from "./screens/buyer/BuyerProfile";
import VoiceHelp from "./screens/shared/VoiceHelp";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/select-role",
    Component: RoleSelectionScreen,
  },
  {
    path: "/farmer",
    Component: FarmerLayout,
    children: [
      { index: true, Component: FarmerHome },
      { path: "crop-doctor", Component: CropDoctor },
      { path: "soil-insights", Component: SoilInsights },
      { path: "soil-profile-analyzer", Component: SoilProfileAnalyzer },
      { path: "alert-map", Component: AlertMap },
      { path: "market", Component: Market },
      { path: "sell-crops", Component: SellCrops },
      { path: "profile", Component: FarmerProfile },
      { path: "voice-help", Component: VoiceHelp },
    ],
  },
  {
    path: "/buyer",
    Component: BuyerLayout,
    children: [
      { index: true, Component: BuyerHome },
      { path: "marketplace", Component: Marketplace },
      { path: "post-demand", Component: PostDemand },
      { path: "contracts", Component: Contracts },
      { path: "profile", Component: BuyerProfile },
      { path: "voice-help", Component: VoiceHelp },
    ],
  },
]);