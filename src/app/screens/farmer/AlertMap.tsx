import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  Radio,
  Plus,
  ThumbsUp,
  Clock,
  Bug,
  Shield,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
  BellRing,
  Send,
  Leaf,
  Users,
  CheckCircle,
  Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { usePestAlerts } from '../../hooks/usePestAlerts';

const SEVERITY_CONFIG = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    icon: 'text-red-600',
    dot: 'bg-red-500',
    glow: 'shadow-red-200',
    label: 'High Risk',
    labelHi: 'उच्च जोखिम',
    mapBg: 'bg-red-500/20',
    mapBorder: 'border-red-500/40',
  },
  medium: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-700',
    icon: 'text-orange-600',
    dot: 'bg-orange-500',
    glow: 'shadow-orange-200',
    label: 'Medium Risk',
    labelHi: 'मध्यम जोखिम',
    mapBg: 'bg-orange-400/20',
    mapBorder: 'border-orange-400/40',
  },
  low: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: 'text-yellow-600',
    dot: 'bg-yellow-500',
    glow: 'shadow-yellow-200',
    label: 'Low Risk',
    labelHi: 'निम्न जोखिम',
    mapBg: 'bg-yellow-400/20',
    mapBorder: 'border-yellow-400/40',
  },
};

const PEST_OPTIONS = [
  { name: 'Brown Plant Hopper', nameHi: 'भूरा पौधा फुदका', crop: 'Rice' },
  { name: 'Stem Borer', nameHi: 'तना छेदक', crop: 'Rice' },
  { name: 'Leaf Folder', nameHi: 'पत्ती मोड़क', crop: 'Rice' },
  { name: 'Fall Armyworm', nameHi: 'फॉल आर्मीवर्म', crop: 'Maize' },
  { name: 'Aphids', nameHi: 'माहू (एफिड्स)', crop: 'Mustard' },
  { name: 'Whitefly', nameHi: 'सफेद मक्खी', crop: 'Cotton' },
  { name: 'Bollworm', nameHi: 'बॉलवर्म', crop: 'Cotton' },
  { name: 'Pod Borer', nameHi: 'फली छेदक', crop: 'Chickpea' },
  { name: 'Shoot Fly', nameHi: 'शूट फ्लाई', crop: 'Soybean' },
  { name: 'Fruit Borer', nameHi: 'फल छेदक', crop: 'Tomato' },
  { name: 'Termites', nameHi: 'दीमक', crop: 'Wheat' },
  { name: 'Other', nameHi: 'अन्य', crop: '' },
];

export default function AlertMap() {
  const navigate = useNavigate();
  const {
    alerts,
    stats,
    notifications,
    isLoading,
    isConnected,
    submitAlert,
    confirmAlert,
    refresh,
    dismissNotification,
    clearNotifications,
  } = usePestAlerts();

  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<number | null>(null);

  // Report form state
  const [formPest, setFormPest] = useState('');
  const [formCrop, setFormCrop] = useState('');
  const [formSeverity, setFormSeverity] = useState<'high' | 'medium' | 'low'>('medium');
  const [formDescription, setFormDescription] = useState('');
  const [formFarmerName, setFormFarmerName] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formDistrict, setFormDistrict] = useState('');

  const filteredAlerts = filterSeverity
    ? alerts.filter((a) => a.severity === filterSeverity)
    : alerts;

  // Format time ago
  const timeAgo = (dateStr: string) => {
    const hours = Math.round((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (hours < 1) return 'Just now | अभी';
    if (hours === 1) return '1 hour ago | 1 घंटे पहले';
    if (hours < 24) return `${hours} hours ago | ${hours} घंटे पहले`;
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago | ${days} दिन पहले`;
  };

  // Handle pest selection auto-fill
  const handlePestSelect = (pestName: string) => {
    setFormPest(pestName);
    const pest = PEST_OPTIONS.find((p) => p.name === pestName);
    if (pest && pest.crop) {
      setFormCrop(pest.crop);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formPest || !formFarmerName) return;

    setIsSubmitting(true);
    const pestInfo = PEST_OPTIONS.find((p) => p.name === formPest);

    const result = await submitAlert({
      pest: formPest,
      pestHi: pestInfo?.nameHi || '',
      crop: formCrop || 'Unknown',
      severity: formSeverity,
      description: formDescription,
      farmerName: formFarmerName,
      location: {
        lat: 28.7041 + (Math.random() - 0.5) * 0.2,
        lng: 77.1025 + (Math.random() - 0.5) * 0.2,
        district: formDistrict || 'Delhi',
        state: 'Delhi',
      },
      affectedArea: formArea || '1 acre',
    });

    setIsSubmitting(false);

    if (result) {
      setSubmitSuccess(true);
      setShowReportForm(false);
      // Reset form
      setFormPest('');
      setFormCrop('');
      setFormSeverity('medium');
      setFormDescription('');
      setFormFarmerName('');
      setFormArea('');
      setFormDistrict('');

      setTimeout(() => setSubmitSuccess(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary to-primary/90 pt-12 pb-6 px-6 rounded-b-[2rem] mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/farmer')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Pest Alert Map</h1>
            <p className="text-white/90 text-sm">कीट अलर्ट मानचित्र</p>
          </div>

          {/* Live & Notification indicators */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              {notifications.length > 0 ? (
                <BellRing className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <Bell className="w-5 h-5 text-white" />
              )}
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Connection status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${
              isConnected ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-200'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-white/80">Active</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-red-200">{stats.high}</p>
              <p className="text-[10px] text-white/80">High</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-orange-200">{stats.medium}</p>
              <p className="text-[10px] text-white/80">Medium</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
              <p className="text-xl font-bold text-yellow-200">{stats.low}</p>
              <p className="text-[10px] text-white/80">Low</p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Dropdown */}
      {showNotifications && notifications.length > 0 && (
        <div className="mx-6 mb-4 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4 text-primary" />
              Live Notifications ({notifications.length})
            </h3>
            <button onClick={clearNotifications} className="text-xs text-muted-foreground hover:text-foreground">
              Clear all
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 border-b border-border/50 last:border-b-0">
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                  n.type === 'new_alert' ? 'bg-red-500' :
                  n.type === 'severity_escalated' ? 'bg-orange-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{n.message}</p>
                  {n.messageHi && <p className="text-[10px] text-muted-foreground">{n.messageHi}</p>}
                </div>
                <button onClick={() => dismissNotification(n.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {submitSuccess && (
        <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Alert Reported Successfully!</p>
            <p className="text-xs text-green-600">
              All farmers in the area have been notified | क्षेत्र के सभी किसानों को सूचित कर दिया गया
            </p>
          </div>
        </div>
      )}

      <div className="px-6 space-y-6">
        {/* Map Visualization */}
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-green-100 relative p-6">
            {/* Simulated Map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Grid lines for map effect */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(8)].map((_, i) => (
                    <div key={`h${i}`} className="absolute w-full border-t border-green-700" style={{ top: `${(i + 1) * 12}%` }} />
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <div key={`v${i}`} className="absolute h-full border-l border-green-700" style={{ left: `${(i + 1) * 12}%` }} />
                  ))}
                </div>

                {/* Center point (you) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary/20 rounded-full animate-ping" />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-primary whitespace-nowrap bg-white/80 px-1 rounded">
                    You
                  </span>
                </div>

                {/* Dynamic alert markers from live data */}
                {filteredAlerts.slice(0, 6).map((alert, i) => {
                  const positions = [
                    { top: '25%', left: '65%' },
                    { top: '60%', left: '35%' },
                    { top: '35%', left: '25%' },
                    { top: '70%', left: '70%' },
                    { top: '20%', left: '40%' },
                    { top: '55%', left: '60%' },
                  ];
                  const pos = positions[i];
                  const cfg = SEVERITY_CONFIG[alert.severity];
                  const size = alert.severity === 'high' ? 'w-20 h-20' : alert.severity === 'medium' ? 'w-16 h-16' : 'w-12 h-12';
                  const iconSize = alert.severity === 'high' ? 'w-6 h-6' : alert.severity === 'medium' ? 'w-5 h-5' : 'w-4 h-4';

                  return (
                    <div
                      key={alert.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
                      style={{ top: pos.top, left: pos.left }}
                      onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                    >
                      <div className={`${size} ${cfg.mapBg} rounded-full border-2 ${cfg.mapBorder} ${alert.severity === 'high' ? 'animate-pulse' : ''}`} />
                      <AlertTriangle className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${iconSize} ${cfg.icon}`} />
                      {alert.upvotes > 5 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {alert.upvotes}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
              <p className="text-xs font-semibold mb-2">Risk Levels:</p>
              <div className="space-y-1.5">
                {(['high', 'medium', 'low'] as const).map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  const count = stats ? stats[sev] : 0;
                  return (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(filterSeverity === sev ? null : sev)}
                      className={`flex items-center gap-2 w-full text-left px-1 py-0.5 rounded transition-colors ${
                        filterSeverity === sev ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className={`w-3 h-3 ${cfg.dot} rounded-full`} />
                      <span className="text-xs">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={refresh}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white transition-colors"
            >
              <Radio className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-5 bg-muted rounded w-40" />
                    <div className="h-3 bg-muted rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Alerts */}
        {!isLoading && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Active Alerts | सक्रिय अलर्ट
              </h2>
              {filterSeverity && (
                <button
                  onClick={() => setFilterSeverity(null)}
                  className="text-xs text-primary flex items-center gap-1"
                >
                  Clear filter <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No active pest alerts in your area
                </p>
                <p className="text-xs text-muted-foreground">
                  आपके क्षेत्र में कोई सक्रिय कीट अलर्ट नहीं
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => {
                  const cfg = SEVERITY_CONFIG[alert.severity];
                  const isExpanded = expandedAlert === alert.id;

                  return (
                    <div key={alert.id}>
                      <div
                        onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${cfg.bg} ${cfg.border} ${
                          isExpanded ? `ring-2 ring-offset-1 ${cfg.glow}` : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.icon}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                              {alert.confirmed && (
                                <span className="text-[10px] font-medium bg-red-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> Confirmed
                                </span>
                              )}
                            </div>
                            <p className="font-semibold mb-0.5 flex items-center gap-1.5">
                              <Bug className="w-4 h-4 text-muted-foreground" />
                              {alert.pest}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.pestHi}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.location.district}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {alert.upvotes} confirmed
                              </span>
                              <span className="flex items-center gap-1">
                                <Leaf className="w-3 h-3" />
                                {alert.crop}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(alert.createdAt).split('|')[0].trim()}
                              </span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-1 mx-2 rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                          {/* Description */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                              Description
                            </p>
                            <p className="text-sm">{alert.description}</p>
                            {alert.descriptionHi && (
                              <p className="text-xs text-muted-foreground mt-1">{alert.descriptionHi}</p>
                            )}
                          </div>

                          {/* Remedy */}
                          {alert.remedy && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Suggested Remedy | सुझाया गया उपाय
                              </p>
                              <p className="text-sm text-green-800">{alert.remedy}</p>
                              {alert.remedyHi && (
                                <p className="text-xs text-green-600 mt-1">{alert.remedyHi}</p>
                              )}
                            </div>
                          )}

                          {/* Details grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-muted/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">Affected</p>
                              <p className="text-sm font-semibold">{alert.affectedArea}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">Reported by</p>
                              <p className="text-sm font-semibold truncate">{alert.farmerName}</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">Crop</p>
                              <p className="text-sm font-semibold">{alert.crop}</p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAlert(alert.id);
                              }}
                              variant="outline"
                              className="flex-1 h-10 text-sm gap-1.5"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Confirm ({alert.upvotes})
                            </Button>
                            <Button
                              variant="outline"
                              className={`flex-1 h-10 text-sm gap-1.5 transition-all ${
                                shareFeedback === alert.id
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : 'text-primary border-primary/30 hover:bg-primary/5'
                              }`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const text = `⚠️ Pest Alert: ${alert.pest} (${alert.severity.toUpperCase()}) in ${alert.location.district}.\n\n🌾 Crop: ${alert.crop}\n📍 Area: ${alert.affectedArea}\n👥 Confirmed by: ${alert.upvotes} farmers\n\n💊 Remedy: ${alert.remedy || 'N/A'}\n\nReported by ${alert.farmerName} via Smart Krishi App`;

                                // Always copy to clipboard first
                                const copyToClipboard = () => {
                                  const ta = document.createElement('textarea');
                                  ta.value = text;
                                  ta.style.position = 'fixed';
                                  ta.style.opacity = '0';
                                  document.body.appendChild(ta);
                                  ta.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(ta);
                                };

                                try {
                                  await navigator.clipboard.writeText(text);
                                } catch {
                                  copyToClipboard();
                                }

                                // Show feedback immediately
                                setShareFeedback(alert.id);
                                setTimeout(() => setShareFeedback(null), 2500);

                                // On mobile, also open native share dialog
                                const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                                if (isMobile && navigator.share) {
                                  try {
                                    await navigator.share({ title: `🐛 Pest Alert: ${alert.pest}`, text });
                                  } catch { /* user cancelled, that's fine — already copied */ }
                                }
                              }}
                            >
                              {shareFeedback === alert.id ? (
                                <><CheckCircle className="w-4 h-4" /> Copied!</>
                              ) : (
                                <><Send className="w-4 h-4" /> Share Alert</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Report Issue Dialog/Form */}
        {showReportForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-card rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Form Header */}
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Report Pest Issue</h2>
                    <p className="text-xs text-muted-foreground">कीट समस्या की रिपोर्ट करें</p>
                  </div>
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Farmer Name */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Your Name | आपका नाम <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFarmerName}
                    onChange={(e) => setFormFarmerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                {/* Pest Selection */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Pest / Disease | कीट / रोग <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PEST_OPTIONS.map((pest) => (
                      <button
                        key={pest.name}
                        onClick={() => handlePestSelect(pest.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          formPest === pest.name
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-muted/70 text-foreground hover:bg-muted'
                        }`}
                      >
                        🐛 {pest.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crop */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Affected Crop | प्रभावित फसल
                  </label>
                  <input
                    type="text"
                    value={formCrop}
                    onChange={(e) => setFormCrop(e.target.value)}
                    placeholder="e.g. Rice, Wheat, Cotton"
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Severity Level | गंभीरता स्तर <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high', 'medium', 'low'] as const).map((sev) => {
                      const cfg = SEVERITY_CONFIG[sev];
                      return (
                        <button
                          key={sev}
                          onClick={() => setFormSeverity(sev)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            formSeverity === sev
                              ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1`
                              : 'border-border hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className={`w-4 h-4 ${cfg.dot} rounded-full mx-auto mb-1`} />
                          <p className="text-xs font-semibold">{cfg.label}</p>
                          <p className="text-[10px] text-muted-foreground">{cfg.labelHi}</p>
                        </button>
                      );
                    })}
                  </div>
                  {formSeverity === 'high' && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      High severity will send immediate alerts to all nearby farmers
                    </p>
                  )}
                </div>

                {/* Area & District */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Affected Area | प्रभावित क्षेत्र
                    </label>
                    <input
                      type="text"
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      placeholder="e.g. 2 acres"
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      District | जिला
                    </label>
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      placeholder="e.g. North Delhi"
                      className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Description | विवरण
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe what you observed in your field..."
                    rows={3}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!formPest || !formFarmerName || isSubmitting}
                  className="w-full h-14 text-base gap-2 rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Alert...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Alert to All Farmers | सभी किसानों को अलर्ट भेजें
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Report Issue Button */}
        <Button
          onClick={() => setShowReportForm(true)}
          className="w-full h-14 text-lg gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Report an Issue | समस्या की रिपोर्ट करें
        </Button>
      </div>
    </div>
  );
}
