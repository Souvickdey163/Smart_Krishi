import { ArrowLeft, User, Phone, MapPin, Globe, Volume2, LogOut, ChevronRight, Camera } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { useLanguage, AppLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

export default function FarmerProfile() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);

  const languages: AppLanguage[] = ["English", "हिंदी", "ਪੰਜਾਬੀ", "తెలుగు", "தமிழ்"];

  useEffect(() => {
    fetch("http://localhost:3001/api/profile")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data);
        }
      });
  }, []);

  const handleLanguageChange = (lang: AppLanguage) => {
    setLanguage(lang);
    toast.success(`${t("Language")} -> ${lang}`);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newAvatarUrl = reader.result;
      setProfile({ ...profile, avatarUrl: newAvatarUrl });
      fetch("http://localhost:3001/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });
      toast.success(t("Profile updated"));
    };
    reader.readAsDataURL(file);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-6">
      <input 
        type="file" 
        accept="image/*" 
        capture="user" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleAvatarUpload} 
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-16 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/farmer")}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("Profile")}</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border border-white/30 hover:bg-white/30 transition-colors"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
              <div className="absolute bottom-0 w-full bg-black/40 h-6 flex justify-center items-center">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {profile.name}
              </h2>
              <p className="text-white/90 text-sm mb-1">Farmer ID: {profile.farmerId}</p>
              <p className="text-white/80 text-xs">Member since {profile.memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Personal Information */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{profile.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t("Language")}
          </h3>
          <div className="space-y-2">
            {languages.map((lang, index) => (
              <button
                key={index}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  language === lang
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{lang}</span>
                  {language === lang && (
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            {t("Settings")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("Voice Help")}</p>
                </div>
              </div>
              <Switch defaultChecked={profile.settings.voiceAssistant} />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="font-medium">{t("Notifications")}</p>
              </div>
              <Switch defaultChecked={profile.settings.pushNotifications} />
            </div>
          </div>
        </div>

        {/* Switch Role */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => navigate("/select-role")}
        >
          Switch to Buyer / Seller Role
        </Button>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full h-12 gap-2"
          onClick={() => navigate("/login")}
        >
          <LogOut className="w-5 h-5" />
          {t("Logout")}
        </Button>
      </div>
    </div>
  );
}
