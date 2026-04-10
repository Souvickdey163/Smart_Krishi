import { useState } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  MapPin,
  Star,
  RefreshCw,
  ChevronDown,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  Zap,
  Landmark,
  ExternalLink,
  ChevronRight,
  Users,
  IndianRupee,
  BadgeCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useMarketData } from '../../hooks/useMarketData';
import PriceTrendChart from '../../components/PriceTrendChart';
import NewsTicker from '../../components/NewsTicker';

export default function Market() {
  const navigate = useNavigate();
  const {
    prices,
    news,
    mandis,
    states,
    policies,
    selectedState,
    setSelectedState,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    dataSource,
    serverOnline,
    refresh,
  } = useMarketData('Delhi');

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [expandedPrice, setExpandedPrice] = useState<number | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [policyFilter, setPolicyFilter] = useState<string>('all');

  const filteredPrices = selectedCrop
    ? prices.filter((p) => p.commodity === selectedCrop)
    : prices;

  const bestMandi = mandis.length > 0 ? mandis.reduce((a, b) => (a.rating > b.rating ? a : b)) : null;

  // Format last updated time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h1 className="text-2xl font-bold text-white">Market Prices</h1>
            <p className="text-white/90 text-sm">बाजार मूल्य</p>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center gap-2">
            {serverOnline ? (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                </span>
                <span className="text-xs text-white font-medium">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <WifiOff className="w-3.5 h-3.5 text-red-300" />
                <span className="text-xs text-red-200 font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* State Selector & Last Updated */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 hover:bg-white/25 transition-colors"
            >
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{selectedState}</span>
              <ChevronDown
                className={`w-4 h-4 text-white/80 transition-transform ${
                  showStateDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showStateDropdown && (
              <div className="absolute top-full mt-2 left-0 bg-card rounded-xl shadow-2xl border border-border z-50 min-w-[200px] overflow-hidden">
                {states.map((state) => (
                  <button
                    key={state.value}
                    onClick={() => {
                      setSelectedState(state.value);
                      setShowStateDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors flex items-center justify-between ${
                      selectedState === state.value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : ''
                    }`}
                  >
                    <span>{state.label}</span>
                    <span className="text-xs text-muted-foreground">{state.labelHi}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatTime(lastUpdated)}</span>
              </div>
            )}
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Connection Error</h3>
                <p className="text-sm text-muted-foreground mb-3">{error}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Make sure the backend server is running: <code className="bg-muted px-2 py-0.5 rounded text-xs">node server.js</code>
                </p>
                <button
                  onClick={refresh}
                  className="bg-destructive text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* News Ticker */}
        <NewsTicker news={news} isLoading={isLoading} />

        {/* AI Suggestion */}
        {!isLoading && bestMandi && (
          <div className="bg-gradient-to-r from-accent/30 to-primary/30 rounded-2xl p-5 border border-accent/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              AI Suggestion | AI सुझाव
            </h3>
            <p className="text-sm mb-1">
              <strong>Best place to sell today:</strong> {bestMandi.name}
            </p>
            {prices.length > 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                {prices[0].commodity} prices are{' '}
                <span className={prices[0].change >= 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                  {prices[0].change >= 0 ? '+' : ''}{prices[0].change}%
                </span>{' '}
                compared to yesterday. Distance: {bestMandi.distance}.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              आज बेचने के लिए सबसे अच्छी जगह: {bestMandi.nameHi}
            </p>
          </div>
        )}

        {/* Crop Filter Pills */}
        {!isLoading && prices.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCrop(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCrop === null
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-muted/70 text-foreground hover:bg-muted'
              }`}
            >
              All Crops
            </button>
            {prices.map((p) => (
              <button
                key={p.commodity}
                onClick={() =>
                  setSelectedCrop(selectedCrop === p.commodity ? null : p.commodity)
                }
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCrop === p.commodity
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-muted/70 text-foreground hover:bg-muted'
                }`}
              >
                {p.emoji} {p.commodity}
              </button>
            ))}
          </div>
        )}

        {/* Current Prices */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Today's Prices | आज की कीमतें
            </h2>
            {dataSource && (
              <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                via {dataSource}
              </span>
            )}
          </div>

          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted/70 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-12 bg-muted/70 rounded animate-pulse ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrices.map((item, index) => (
                <div key={index}>
                  <div
                    onClick={() =>
                      setExpandedPrice(expandedPrice === index ? null : index)
                    }
                    className={`flex items-center justify-between p-4 bg-muted/50 rounded-xl 
                      hover:bg-muted transition-all cursor-pointer
                      ${expandedPrice === index ? 'ring-2 ring-primary/30 bg-muted' : ''}
                      ${isRefreshing ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold">{item.commodity}</p>
                          {item.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.commodityHi}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        ₹{item.price.toLocaleString('en-IN')}
                        <span className="text-xs text-muted-foreground font-normal">
                          {item.unit}
                        </span>
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          item.trend === 'up'
                            ? 'text-green-600'
                            : 'text-destructive'
                        }`}
                      >
                        {item.change >= 0 ? '+' : ''}
                        {item.change}%
                      </p>
                    </div>
                  </div>

                  {/* Expanded Price Chart */}
                  {expandedPrice === index && item.history && item.history.length > 0 && (
                    <div className="mt-1 mx-1 bg-card rounded-xl border border-border p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        📈 7-Day Price Trend | ७ दिन का रुझान
                      </p>
                      <PriceTrendChart
                        history={item.history}
                        trend={item.trend}
                        height={80}
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                        <span>{item.history[0]?.date}</span>
                        <span>{item.history[item.history.length - 1]?.date}</span>
                      </div>
                      {item.market && (
                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>Market: {item.market}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Mandis */}
        <div className="bg-card rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Nearby Mandis | नजदीकी मंडियां
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-muted/50 rounded-xl border border-border"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted/70 rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted/50 rounded animate-pulse mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mandis.map((mandi, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted/50 rounded-xl border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold mb-0.5">{mandi.name}</p>
                      <p className="text-xs text-muted-foreground mb-1.5">{mandi.nameHi}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {mandi.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {mandi.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live prices for this mandi */}
                  {mandi.topPrices && mandi.topPrices.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto">
                      {mandi.topPrices.map((tp, tpIdx) => (
                        <div
                          key={tpIdx}
                          className="flex-shrink-0 bg-card rounded-lg px-3 py-2 border border-border"
                        >
                          <p className="text-xs text-muted-foreground">
                            {tp.commodity}
                          </p>
                          <p className="text-sm font-bold text-primary">
                            ₹{tp.price.toLocaleString('en-IN')}
                          </p>
                          <p
                            className={`text-[10px] font-medium ${
                              tp.change >= 0 ? 'text-green-600' : 'text-destructive'
                            }`}
                          >
                            {tp.change >= 0 ? '+' : ''}
                            {tp.change}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Best for:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {mandi.bestFor.map((crop, ci) => (
                        <span
                          key={ci}
                          className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                        >
                          {crop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Government Policies */}
        {!isLoading && policies.length > 0 && (
          <div className="bg-card rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Govt. Policies | सरकारी योजनाएं
                </h2>
                <p className="text-xs text-muted-foreground">
                  Latest schemes & benefits for farmers
                </p>
              </div>
            </div>

            {/* Policy Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide mb-3">
              {[
                { value: 'all', label: 'All', emoji: '📋' },
                { value: 'income', label: 'Income', emoji: '💰' },
                { value: 'insurance', label: 'Insurance', emoji: '🛡️' },
                { value: 'credit', label: 'Credit', emoji: '🏦' },
                { value: 'subsidy', label: 'Subsidy', emoji: '🎁' },
                { value: 'pricing', label: 'MSP', emoji: '📈' },
                { value: 'market', label: 'Market', emoji: '🏪' },
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setPolicyFilter(cat.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    policyFilter === cat.value
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-muted/70 text-foreground hover:bg-muted'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {policies
                .filter((p) => policyFilter === 'all' || p.category === policyFilter)
                .map((policy) => (
                <div key={policy.id}>
                  <div
                    onClick={() =>
                      setExpandedPolicy(
                        expandedPolicy === policy.id ? null : policy.id
                      )
                    }
                    className={`p-4 bg-muted/50 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                      expandedPolicy === policy.id
                        ? 'border-orange-400/50 bg-orange-50/30 ring-1 ring-orange-400/20'
                        : 'border-border hover:border-orange-300/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm">{policy.title}</p>
                          {policy.isNew && (
                            <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                              New
                            </span>
                          )}
                          {policy.status === 'announced' && (
                            <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Announced
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {policy.titleHi}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Landmark className="w-3 h-3" />
                            {policy.ministry.replace('Ministry of ', '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3 text-green-500" />
                            {policy.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="bg-orange-100 text-orange-700 rounded-lg px-3 py-1.5 text-xs font-bold">
                          {policy.amount}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Policy Details */}
                  {expandedPolicy === policy.id && (
                    <div className="mt-1 mx-1 bg-card rounded-xl border border-orange-200/50 p-4 shadow-sm">
                      <p className="text-sm text-foreground mb-2 leading-relaxed">
                        {policy.description}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        {policy.descriptionHi}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                            <Users className="w-3 h-3" />
                            Beneficiaries
                          </div>
                          <p className="text-xs font-semibold">{policy.beneficiaries}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                            <IndianRupee className="w-3 h-3" />
                            Amount
                          </div>
                          <p className="text-xs font-semibold">{policy.amount}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Updated: {new Date(policy.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <a
                          href={policy.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-lg"
                        >
                          Apply / Details
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Trend Summary */}
        {!isLoading && prices.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-5">
            <h3 className="font-semibold mb-3">📊 Market Summary</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center bg-card rounded-lg p-3 border border-border">
                <p className="text-2xl font-bold text-green-600">
                  {prices.filter((p) => p.trend === 'up').length}
                </p>
                <p className="text-xs text-muted-foreground">Rising ↑</p>
              </div>
              <div className="text-center bg-card rounded-lg p-3 border border-border">
                <p className="text-2xl font-bold text-destructive">
                  {prices.filter((p) => p.trend === 'down').length}
                </p>
                <p className="text-xs text-muted-foreground">Falling ↓</p>
              </div>
              <div className="text-center bg-card rounded-lg p-3 border border-border">
                <p className="text-2xl font-bold text-primary">{prices.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Overall market trend is{' '}
              <strong
                className={
                  prices.filter((p) => p.trend === 'up').length >=
                  prices.filter((p) => p.trend === 'down').length
                    ? 'text-green-600'
                    : 'text-destructive'
                }
              >
                {prices.filter((p) => p.trend === 'up').length >=
                prices.filter((p) => p.trend === 'down').length
                  ? 'positive'
                  : 'bearish'}
              </strong>{' '}
              for {selectedState} region.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedState} क्षेत्र के लिए बाजार का रुझान{' '}
              {prices.filter((p) => p.trend === 'up').length >=
              prices.filter((p) => p.trend === 'down').length
                ? 'सकारात्मक'
                : 'नकारात्मक'}{' '}
              है।
            </p>
          </div>
        )}

        {/* Data Source Footer */}
        {!isLoading && (
          <div className="text-center py-2">
            <p className="text-[10px] text-muted-foreground">
              Data refreshes every 5 minutes • Source: {dataSource || 'API'} •{' '}
              {lastUpdated ? `Last updated: ${formatTime(lastUpdated)}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
