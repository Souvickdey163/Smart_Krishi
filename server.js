import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// ─── In-Memory Cache ──────────────────────────────────────────────
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// ─── Realistic Baseline Prices (INR per Quintal) ──────────────────
const BASELINE_PRICES = {
  Wheat: { base: 2275, min: 2000, max: 2600, hindiName: 'गेहूं', emoji: '🌾' },
  Rice: { base: 3100, min: 2800, max: 3500, hindiName: 'चावल', emoji: '🍚' },
  Sugarcane: { base: 350, min: 280, max: 420, hindiName: 'गन्ना', emoji: '🎋' },
  Cotton: { base: 6800, min: 6000, max: 7800, hindiName: 'कपास', emoji: '☁️' },
  Soybean: { base: 4500, min: 4000, max: 5200, hindiName: 'सोयाबीन', emoji: '🫘' },
  Maize: { base: 1950, min: 1700, max: 2200, hindiName: 'मक्का', emoji: '🌽' },
  Mustard: { base: 5200, min: 4800, max: 5800, hindiName: 'सरसों', emoji: '🌻' },
  Potato: { base: 1200, min: 800, max: 1600, hindiName: 'आलू', emoji: '🥔' },
  Onion: { base: 1800, min: 1200, max: 2500, hindiName: 'प्याज', emoji: '🧅' },
  Tomato: { base: 2000, min: 1000, max: 3500, hindiName: 'टमाटर', emoji: '🍅' },
  Chickpea: { base: 5100, min: 4600, max: 5800, hindiName: 'चना', emoji: '🟤' },
  Groundnut: { base: 5500, min: 5000, max: 6200, hindiName: 'मूंगफली', emoji: '🥜' },
};

// ─── Mandi Data ───────────────────────────────────────────────────
const MANDIS_DATA = {
  Delhi: [
    { name: 'Azadpur Mandi', nameHi: 'आज़ादपुर मंडी', distance: '12 km', rating: 4.5, lat: 28.7041, lng: 77.1025, bestFor: ['Wheat', 'Rice', 'Onion'], address: 'Azadpur, New Delhi' },
    { name: 'Ghazipur Mandi', nameHi: 'ग़ाज़ीपुर मंडी', distance: '18 km', rating: 4.2, lat: 28.6228, lng: 77.3203, bestFor: ['Tomato', 'Potato', 'Onion'], address: 'Ghazipur, East Delhi' },
    { name: 'Okhla Mandi', nameHi: 'ओखला मंडी', distance: '25 km', rating: 4.0, lat: 28.5355, lng: 77.2740, bestFor: ['Onion', 'Potato', 'Tomato'], address: 'Okhla, South Delhi' },
    { name: 'Narela Mandi', nameHi: 'नरेला मंडी', distance: '30 km', rating: 3.9, lat: 28.8527, lng: 77.0930, bestFor: ['Wheat', 'Mustard', 'Maize'], address: 'Narela, North Delhi' },
  ],
  Maharashtra: [
    { name: 'Vashi APMC', nameHi: 'वाशी APMC', distance: '8 km', rating: 4.6, lat: 19.0728, lng: 73.0070, bestFor: ['Onion', 'Potato', 'Tomato'], address: 'Vashi, Navi Mumbai' },
    { name: 'Pune Market Yard', nameHi: 'पुणे मार्केट यार्ड', distance: '15 km', rating: 4.3, lat: 18.5074, lng: 73.8077, bestFor: ['Soybean', 'Groundnut'], address: 'Gultekdi, Pune' },
    { name: 'Nashik Mandi', nameHi: 'नासिक मंडी', distance: '22 km', rating: 4.1, lat: 20.0063, lng: 73.7900, bestFor: ['Onion', 'Tomato', 'Wheat'], address: 'Nashik, Maharashtra' },
  ],
  Punjab: [
    { name: 'Khanna Grain Mandi', nameHi: 'खन्ना अनाज मंडी', distance: '10 km', rating: 4.7, lat: 30.6942, lng: 76.2167, bestFor: ['Wheat', 'Rice', 'Maize'], address: 'Khanna, Ludhiana' },
    { name: 'Jalandhar Mandi', nameHi: 'जालंधर मंडी', distance: '20 km', rating: 4.1, lat: 31.3260, lng: 75.5762, bestFor: ['Potato', 'Wheat'], address: 'Jalandhar, Punjab' },
    { name: 'Amritsar Mandi', nameHi: 'अमृतसर मंडी', distance: '28 km', rating: 4.4, lat: 31.6340, lng: 74.8723, bestFor: ['Wheat', 'Rice', 'Cotton'], address: 'Amritsar, Punjab' },
  ],
  'Uttar Pradesh': [
    { name: 'Lucknow Mandi', nameHi: 'लखनऊ मंडी', distance: '10 km', rating: 4.3, lat: 26.8467, lng: 80.9462, bestFor: ['Wheat', 'Rice', 'Sugarcane'], address: 'Aminabad, Lucknow' },
    { name: 'Kanpur Anaj Mandi', nameHi: 'कानपुर अनाज मंडी', distance: '15 km', rating: 4.0, lat: 26.4499, lng: 80.3319, bestFor: ['Wheat', 'Potato', 'Mustard'], address: 'Naya Ganj, Kanpur' },
    { name: 'Agra Mandi', nameHi: 'आगरा मंडी', distance: '20 km', rating: 3.8, lat: 27.1767, lng: 78.0081, bestFor: ['Potato', 'Onion', 'Soybean'], address: 'Agra, UP' },
    { name: 'Varanasi Mandi', nameHi: 'वाराणसी मंडी', distance: '12 km', rating: 4.1, lat: 25.3176, lng: 83.0064, bestFor: ['Rice', 'Wheat', 'Chickpea'], address: 'Varanasi, UP' },
  ],
  'Madhya Pradesh': [
    { name: 'Indore Mandi', nameHi: 'इंदौर मंडी', distance: '8 km', rating: 4.5, lat: 22.7196, lng: 75.8577, bestFor: ['Soybean', 'Wheat', 'Chickpea'], address: 'Siyaganj, Indore' },
    { name: 'Bhopal Mandi', nameHi: 'भोपाल मंडी', distance: '14 km', rating: 4.2, lat: 23.2599, lng: 77.4126, bestFor: ['Wheat', 'Soybean', 'Maize'], address: 'Karond, Bhopal' },
    { name: 'Neemuch Mandi', nameHi: 'नीमच मंडी', distance: '25 km', rating: 4.6, lat: 24.4624, lng: 74.8710, bestFor: ['Soybean', 'Groundnut', 'Mustard'], address: 'Neemuch, MP' },
  ],
  Rajasthan: [
    { name: 'Jaipur Mandi', nameHi: 'जयपुर मंडी', distance: '10 km', rating: 4.3, lat: 26.9124, lng: 75.7873, bestFor: ['Mustard', 'Wheat', 'Chickpea'], address: 'Muhana, Jaipur' },
    { name: 'Jodhpur Mandi', nameHi: 'जोधपुर मंडी', distance: '18 km', rating: 4.0, lat: 26.2389, lng: 73.0243, bestFor: ['Groundnut', 'Mustard', 'Cotton'], address: 'Jodhpur, Rajasthan' },
    { name: 'Kota Mandi', nameHi: 'कोटा मंडी', distance: '22 km', rating: 4.1, lat: 25.2138, lng: 75.8648, bestFor: ['Soybean', 'Wheat', 'Maize'], address: 'Kota, Rajasthan' },
  ],
  Gujarat: [
    { name: 'Rajkot APMC', nameHi: 'राजकोट APMC', distance: '10 km', rating: 4.5, lat: 22.3039, lng: 70.8022, bestFor: ['Groundnut', 'Cotton', 'Soybean'], address: 'Rajkot, Gujarat' },
    { name: 'Ahmedabad APMC', nameHi: 'अहमदाबाद APMC', distance: '12 km', rating: 4.4, lat: 23.0225, lng: 72.5714, bestFor: ['Cotton', 'Wheat', 'Potato'], address: 'Jamalpur, Ahmedabad' },
    { name: 'Unjha Mandi', nameHi: 'ऊंझा मंडी', distance: '20 km', rating: 4.7, lat: 23.8044, lng: 72.3909, bestFor: ['Mustard', 'Chickpea', 'Groundnut'], address: 'Unjha, Gujarat' },
  ],
  Karnataka: [
    { name: 'Yeshwanthpur APMC', nameHi: 'यशवंतपुर APMC', distance: '8 km', rating: 4.4, lat: 13.0220, lng: 77.5395, bestFor: ['Tomato', 'Onion', 'Potato'], address: 'Yeshwanthpur, Bengaluru' },
    { name: 'Hubli APMC', nameHi: 'हुबली APMC', distance: '15 km', rating: 4.2, lat: 15.3647, lng: 75.1240, bestFor: ['Cotton', 'Maize', 'Groundnut'], address: 'Hubli, Karnataka' },
    { name: 'Belgaum Mandi', nameHi: 'बेलगाम मंडी', distance: '22 km', rating: 3.9, lat: 15.8497, lng: 74.4977, bestFor: ['Sugarcane', 'Soybean', 'Rice'], address: 'Belgaum, Karnataka' },
  ],
  Haryana: [
    { name: 'Karnal Mandi', nameHi: 'करनाल मंडी', distance: '10 km', rating: 4.6, lat: 29.6857, lng: 76.9905, bestFor: ['Wheat', 'Rice', 'Mustard'], address: 'Karnal, Haryana' },
    { name: 'Hisar Mandi', nameHi: 'हिसार मंडी', distance: '15 km', rating: 4.3, lat: 29.1492, lng: 75.7217, bestFor: ['Cotton', 'Wheat', 'Mustard'], address: 'Hisar, Haryana' },
    { name: 'Panipat Mandi', nameHi: 'पानीपत मंडी', distance: '20 km', rating: 4.0, lat: 29.3909, lng: 76.9635, bestFor: ['Rice', 'Wheat', 'Maize'], address: 'Panipat, Haryana' },
  ],
};

// ─── Government Policies for Farmers ──────────────────────────────
const GOVT_POLICIES = [
  {
    id: 'pm-kisan',
    title: 'PM-KISAN Samman Nidhi',
    titleHi: 'पीएम-किसान सम्मान निधि',
    description: 'Direct income support of ₹6,000 per year in 3 installments to all land-holding farmer families.',
    descriptionHi: 'सभी भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष 3 किस्तों में सीधी आय सहायता।',
    ministry: 'Ministry of Agriculture',
    status: 'active',
    beneficiaries: '11+ crore farmers',
    amount: '₹6,000/year',
    link: 'https://pmkisan.gov.in',
    category: 'income',
    lastUpdated: '2026-04-01',
    isNew: false,
  },
  {
    id: 'pm-fasal-bima',
    title: 'PM Fasal Bima Yojana (PMFBY)',
    titleHi: 'पीएम फसल बीमा योजना',
    description: 'Comprehensive crop insurance scheme covering all food & oilseed crops. Premium: 2% for Kharif, 1.5% for Rabi crops.',
    descriptionHi: 'सभी खाद्य एवं तिलहन फसलों को कवर करने वाली व्यापक फसल बीमा योजना। प्रीमियम: खरीफ 2%, रबी 1.5%।',
    ministry: 'Ministry of Agriculture',
    status: 'active',
    beneficiaries: '4+ crore farmers',
    amount: 'Up to full sum insured',
    link: 'https://pmfby.gov.in',
    category: 'insurance',
    lastUpdated: '2026-03-15',
    isNew: false,
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC)',
    titleHi: 'किसान क्रेडिट कार्ड (KCC)',
    description: 'Short-term crop loans at 4% interest rate (after subsidy). Credit limit up to ₹3 lakh with no collateral.',
    descriptionHi: 'अल्पकालिक फसल ऋण 4% ब्याज दर (सब्सिडी के बाद) पर। बिना गारंटी ₹3 लाख तक क्रेडिट सीमा।',
    ministry: 'Ministry of Finance',
    status: 'active',
    beneficiaries: '7+ crore farmers',
    amount: 'Up to ₹3 lakh',
    link: 'https://www.pmjdy.gov.in',
    category: 'credit',
    lastUpdated: '2026-02-20',
    isNew: false,
  },
  {
    id: 'soil-health-card',
    title: 'Soil Health Card Scheme',
    titleHi: 'मृदा स्वास्थ्य कार्ड योजना',
    description: 'Free soil testing and health cards with crop-wise recommendations for nutrients & fertilizers. Issued every 2 years.',
    descriptionHi: 'मुफ्त मृदा परीक्षण और फसलवार पोषक तत्व एवं उर्वरक सिफारिशों के साथ स्वास्थ्य कार्ड। हर 2 वर्ष में जारी।',
    ministry: 'Ministry of Agriculture',
    status: 'active',
    beneficiaries: '12+ crore cards issued',
    amount: 'Free service',
    link: 'https://soilhealth.dac.gov.in',
    category: 'advisory',
    lastUpdated: '2026-01-10',
    isNew: false,
  },
  {
    id: 'enam',
    title: 'e-NAM (National Agriculture Market)',
    titleHi: 'ई-नाम (राष्ट्रीय कृषि बाजार)',
    description: 'Online trading platform for agricultural commodities. Connects 1,361 mandis across 23 states for transparent pricing.',
    descriptionHi: 'कृषि वस्तुओं के लिए ऑनलाइन ट्रेडिंग प्लेटफॉर्म। 23 राज्यों की 1,361 मंडियों को पारदर्शी मूल्य निर्धारण से जोड़ता है।',
    ministry: 'Ministry of Agriculture',
    status: 'active',
    beneficiaries: '1.76 crore farmers',
    amount: 'Free registration',
    link: 'https://enam.gov.in',
    category: 'market',
    lastUpdated: '2026-03-25',
    isNew: false,
  },
  {
    id: 'pm-kusum',
    title: 'PM-KUSUM (Solar Energy for Farmers)',
    titleHi: 'पीएम-कुसुम (किसानों के लिए सौर ऊर्जा)',
    description: 'Subsidy up to 60% for solar pumps and grid-connected solar power plants. Earn extra income by selling surplus power.',
    descriptionHi: 'सौर पंप और ग्रिड-कनेक्टेड सोलर प्लांट के लिए 60% तक सब्सिडी। अतिरिक्त बिजली बेचकर अतिरिक्त आय अर्जित करें।',
    ministry: 'Ministry of New & Renewable Energy',
    status: 'active',
    beneficiaries: '35+ lakh farmers',
    amount: '60% subsidy',
    link: 'https://pmkusum.mnre.gov.in',
    category: 'subsidy',
    lastUpdated: '2026-04-05',
    isNew: true,
  },
  {
    id: 'agri-infra-fund',
    title: 'Agriculture Infrastructure Fund',
    titleHi: 'कृषि अवसंरचना कोष',
    description: 'Financing facility of ₹1 lakh crore for farm-gate infrastructure: cold storage, warehouses, processing units. Interest subvention of 3%.',
    descriptionHi: 'फार्म-गेट इन्फ्रा: कोल्ड स्टोरेज, गोदाम, प्रसंस्करण इकाई के लिए ₹1 लाख करोड़ की वित्तपोषण सुविधा। 3% ब्याज अनुदान।',
    ministry: 'Ministry of Agriculture',
    status: 'active',
    beneficiaries: 'FPOs, Farmers, Startups',
    amount: '₹2 crore per project',
    link: 'https://agriinfra.dac.gov.in',
    category: 'infrastructure',
    lastUpdated: '2026-04-08',
    isNew: true,
  },
  {
    id: 'msp-2026',
    title: 'MSP Hike for Kharif 2026-27',
    titleHi: 'खरीफ 2026-27 के लिए MSP वृद्धि',
    description: 'Government announces 5-7% increase in Minimum Support Prices for 14 Kharif crops. Paddy MSP raised to ₹2,450/quintal.',
    descriptionHi: 'सरकार ने 14 खरीफ फसलों के न्यूनतम समर्थन मूल्य में 5-7% वृद्धि की घोषणा। धान MSP ₹2,450/क्विंटल।',
    ministry: 'Cabinet Committee on Economic Affairs',
    status: 'announced',
    beneficiaries: 'All farmers',
    amount: '5-7% hike',
    link: 'https://farmer.gov.in',
    category: 'pricing',
    lastUpdated: '2026-04-09',
    isNew: true,
  },
  {
    id: 'natural-farming',
    title: 'National Mission on Natural Farming',
    titleHi: 'राष्ट्रीय प्राकृतिक खेती मिशन',
    description: 'Promoting chemical-free farming with ₹2,481 crore budget. Training & input support for 1 crore farmers over 4 years.',
    descriptionHi: 'रासायनिक मुक्त खेती को ₹2,481 करोड़ बजट से बढ़ावा। 4 वर्षों में 1 करोड़ किसानों को प्रशिक्षण एवं इनपुट सहायता।',
    ministry: 'Ministry of Agriculture',
    status: 'active',
    beneficiaries: '1 crore farmers',
    amount: '₹2,481 crore',
    link: 'https://naturalfarming.dac.gov.in',
    category: 'sustainability',
    lastUpdated: '2026-03-20',
    isNew: true,
  },
];

// ─── Generate Realistic Price Fluctuations ────────────────────────
function generateLivePrices(state = 'Delhi') {
  const now = new Date();
  const seed = now.getHours() * 60 + now.getMinutes(); // changes each minute

  return Object.entries(BASELINE_PRICES).map(([crop, info]) => {
    // Create deterministic but time-varying prices
    const hash = (seed * crop.charCodeAt(0) * 31) % 1000;
    const fluctuation = ((hash / 1000) - 0.5) * 0.15; // ±7.5% fluctuation
    const stateOffset = (state.charCodeAt(0) % 10 - 5) * 0.01; // small state-based offset
    
    const currentPrice = Math.round(info.base * (1 + fluctuation + stateOffset));
    const clampedPrice = Math.max(info.min, Math.min(info.max, currentPrice));
    
    // Calculate yesterday's price for change %
    const yesterdayHash = ((seed - 60) * crop.charCodeAt(0) * 31) % 1000;
    const yesterdayFluctuation = ((yesterdayHash / 1000) - 0.5) * 0.15;
    const yesterdayPrice = Math.round(info.base * (1 + yesterdayFluctuation + stateOffset));
    const clampedYesterday = Math.max(info.min, Math.min(info.max, yesterdayPrice));
    
    const changePercent = (((clampedPrice - clampedYesterday) / clampedYesterday) * 100).toFixed(1);
    
    // Generate 7-day history
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const daySeed = ((seed - i * 1440) * crop.charCodeAt(0) * 31) % 1000;
      const dayFluctuation = ((Math.abs(daySeed) / 1000) - 0.5) * 0.12;
      const dayPrice = Math.round(info.base * (1 + dayFluctuation + stateOffset));
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(info.min, Math.min(info.max, dayPrice)),
      });
    }

    return {
      commodity: crop,
      commodityHi: info.hindiName,
      emoji: info.emoji,
      price: clampedPrice,
      unit: '/quintal',
      change: parseFloat(changePercent),
      trend: parseFloat(changePercent) >= 0 ? 'up' : 'down',
      state: state,
      market: MANDIS_DATA[state]?.[0]?.name || 'Local Market',
      lastUpdated: now.toISOString(),
      history,
    };
  });
}

// ─── Generate Simulated Agricultural News ─────────────────────────
const NEWS_TEMPLATES = [
  { title: 'Wheat prices surge {change}% as export demand rises', titleHi: 'निर्यात मांग बढ़ने से गेहूं की कीमतों में {change}% की बढ़ोतरी', crop: 'Wheat', category: 'price' },
  { title: 'Rice procurement at MSP begins in {state}', titleHi: '{state} में MSP पर चावल खरीद शुरू', crop: 'Rice', category: 'policy' },
  { title: 'Cotton crop quality improves with favorable weather', titleHi: 'अनुकूल मौसम से कपास की फसल की गुणवत्ता में सुधार', crop: 'Cotton', category: 'weather' },
  { title: 'Government raises MSP for Kharif crops by 5-7%', titleHi: 'सरकार ने खरीफ फसलों का MSP 5-7% बढ़ाया', crop: 'General', category: 'policy' },
  { title: 'Onion prices stable after new stock arrives from Maharashtra', titleHi: 'महाराष्ट्र से नई खेप आने पर प्याज की कीमतें स्थिर', crop: 'Onion', category: 'supply' },
  { title: 'Soybean futures hit 3-month high on strong global demand', titleHi: 'वैश्विक मांग से सोयाबीन वायदा 3 महीने के उच्चतम स्तर पर', crop: 'Soybean', category: 'market' },
  { title: 'Unseasonal rain damages sugarcane crop in UP', titleHi: 'UP में बेमौसम बारिश से गन्ने की फसल को नुकसान', crop: 'Sugarcane', category: 'weather' },
  { title: 'Tomato prices drop 15% as supply improves', titleHi: 'आपूर्ति बढ़ने से टमाटर की कीमतों में 15% की गिरावट', crop: 'Tomato', category: 'price' },
  { title: 'Maize export ban lifted, traders expect price rise', titleHi: 'मक्का निर्यात प्रतिबंध हटा, व्यापारियों को कीमत बढ़ने की उम्मीद', crop: 'Maize', category: 'policy' },
  { title: 'Mustard oil prices fall as crushing season begins', titleHi: 'पेराई का मौसम शुरू होने से सरसों तेल की कीमतों में गिरावट', crop: 'Mustard', category: 'market' },
  { title: 'Groundnut arrivals increase 20% in Gujarat markets', titleHi: 'गुजरात बाजारों में मूंगफली की आवक में 20% वृद्धि', crop: 'Groundnut', category: 'supply' },
  { title: 'Potato cold storage stocks running low in West Bengal', titleHi: 'पश्चिम बंगाल में आलू शीत भंडार का स्टॉक कम', crop: 'Potato', category: 'supply' },
  { title: 'Chickpea prices see upward trend ahead of festival season', titleHi: 'त्योहारी सीजन से पहले चने की कीमतों में तेजी', crop: 'Chickpea', category: 'price' },
  { title: 'Delhi mandis report record arrivals of fresh produce', titleHi: 'दिल्ली मंडियों में ताज़ा उपज की रिकॉर्ड आवक', crop: 'General', category: 'supply' },
  { title: 'AI-powered crop advisory helping farmers boost yield by 15%', titleHi: 'AI-संचालित फसल सलाहकार से किसानों की पैदावार 15% बढ़ी', crop: 'General', category: 'tech' },
];

function generateNews(state = 'Delhi') {
  const now = new Date();
  const shuffleSeed = now.getDate() + now.getHours();
  
  // Pick 6-8 news items based on time
  const count = 6 + (shuffleSeed % 3);
  const selected = [];
  const indices = new Set();
  
  for (let i = 0; i < count; i++) {
    let idx = (shuffleSeed * (i + 1) * 7) % NEWS_TEMPLATES.length;
    while (indices.has(idx)) {
      idx = (idx + 1) % NEWS_TEMPLATES.length;
    }
    indices.add(idx);
    
    const template = NEWS_TEMPLATES[idx];
    const hoursAgo = Math.floor((i * 3) + (shuffleSeed % 4));
    const publishedAt = new Date(now.getTime() - hoursAgo * 3600000);
    
    selected.push({
      title: template.title.replace('{change}', String(3 + (shuffleSeed % 10))).replace('{state}', state),
      titleHi: template.titleHi.replace('{change}', String(3 + (shuffleSeed % 10))).replace('{state}', state),
      crop: template.crop,
      category: template.category,
      source: ['Agri Tribune', 'Krishi Times', 'Mandi Express', 'Farm Today', 'Rural India News'][i % 5],
      publishedAt: publishedAt.toISOString(),
      timeAgo: hoursAgo < 1 ? 'Just now' : hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`,
      url: '#',
    });
  }
  
  return selected;
}

// ─── API Routes ───────────────────────────────────────────────────

// GET /api/market-prices?state=Delhi&commodity=Wheat
app.get('/api/market-prices', async (req, res) => {
  const { state = 'Delhi', commodity } = req.query;
  const cacheKey = `prices_${state}_${commodity || 'all'}`;
  
  // Check cache first
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true, source: 'cache' });
  }

  try {
    // Try data.gov.in API first
    if (process.env.DATA_GOV_API_KEY) {
      const apiKey = process.env.DATA_GOV_API_KEY;
      const resourceId = '9ef84268-d588-465a-a308-a864a43d0070'; // Daily commodity prices
      let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=50&filters[state]=${encodeURIComponent(state)}`;
      
      if (commodity) {
        url += `&filters[commodity]=${encodeURIComponent(commodity)}`;
      }

      const response = await fetch(url, { timeout: 8000 });
      
      if (response.ok) {
        const apiData = await response.json();
        
        if (apiData.records && apiData.records.length > 0) {
          // Transform government API data to our format
          const prices = apiData.records.map(record => ({
            commodity: record.commodity,
            commodityHi: BASELINE_PRICES[record.commodity]?.hindiName || record.commodity,
            emoji: BASELINE_PRICES[record.commodity]?.emoji || '🌿',
            price: parseInt(record.modal_price) || parseInt(record.max_price),
            minPrice: parseInt(record.min_price),
            maxPrice: parseInt(record.max_price),
            unit: '/quintal',
            state: record.state,
            market: record.market,
            lastUpdated: record.arrival_date || new Date().toISOString(),
            change: 0, // API doesn't provide change, would need historical comparison
            trend: 'up',
            history: [],
          }));
          
          setCache(cacheKey, prices);
          return res.json({ success: true, data: prices, cached: false, source: 'data.gov.in' });
        }
      }
    }
    
    // Fallback to realistic simulation
    let prices = generateLivePrices(state);
    
    if (commodity) {
      prices = prices.filter(p => p.commodity.toLowerCase() === commodity.toLowerCase());
    }
    
    setCache(cacheKey, prices);
    res.json({ success: true, data: prices, cached: false, source: 'simulation' });
    
  } catch (error) {
    console.error('Market prices error:', error.message);
    // Fallback to simulation on any error
    const prices = generateLivePrices(state);
    res.json({ success: true, data: prices, cached: false, source: 'simulation-fallback' });
  }
});

// GET /api/crop-news?state=Delhi&crop=Wheat
app.get('/api/crop-news', async (req, res) => {
  const { state = 'Delhi', crop } = req.query;
  const cacheKey = `news_${state}_${crop || 'all'}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true, source: 'cache' });
  }

  try {
    // Try GNews API first
    if (process.env.GNEWS_API_KEY) {
      const apiKey = process.env.GNEWS_API_KEY;
      const query = crop 
        ? `${crop} crop price India ${state}` 
        : `agriculture crop prices India mandi ${state}`;
      
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=8&token=${apiKey}`;
      
      const response = await fetch(url, { timeout: 8000 });
      
      if (response.ok) {
        const apiData = await response.json();
        
        if (apiData.articles && apiData.articles.length > 0) {
          const news = apiData.articles.map((article, i) => {
            const publishedAt = new Date(article.publishedAt);
            const hoursAgo = Math.round((Date.now() - publishedAt.getTime()) / 3600000);
            
            return {
              title: article.title,
              titleHi: '', // GNews doesn't provide Hindi translations
              crop: crop || 'General',
              category: 'news',
              source: article.source?.name || 'News Source',
              publishedAt: article.publishedAt,
              timeAgo: hoursAgo < 1 ? 'Just now' : hoursAgo === 1 ? '1 hour ago' : hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.round(hoursAgo / 24)} days ago`,
              url: article.url,
              image: article.image,
              description: article.description,
            };
          });
          
          setCache(cacheKey, news);
          return res.json({ success: true, data: news, cached: false, source: 'gnews' });
        }
      }
    }

    // Fallback to simulated news
    let news = generateNews(state);
    if (crop) {
      news = news.filter(n => n.crop === crop || n.crop === 'General');
    }

    setCache(cacheKey, news);
    res.json({ success: true, data: news, cached: false, source: 'simulation' });

  } catch (error) {
    console.error('News error:', error.message);
    const news = generateNews(state);
    res.json({ success: true, data: news, cached: false, source: 'simulation-fallback' });
  }
});

// GET /api/mandis?state=Delhi
app.get('/api/mandis', (req, res) => {
  const { state = 'Delhi' } = req.query;
  const mandis = MANDIS_DATA[state] || MANDIS_DATA.Delhi;

  // Add live price data to each mandi
  const prices = generateLivePrices(state);
  const enrichedMandis = mandis.map(mandi => ({
    ...mandi,
    topPrices: mandi.bestFor.slice(0, 3).map(crop => {
      const priceData = prices.find(p => p.commodity === crop);
      return priceData ? { commodity: crop, price: priceData.price, change: priceData.change } : null;
    }).filter(Boolean),
  }));

  res.json({ success: true, data: enrichedMandis, source: 'local' });
});

// GET /api/govt-policies?category=income
app.get('/api/govt-policies', (req, res) => {
  const { category } = req.query;
  let policies = [...GOVT_POLICIES];

  if (category && category !== 'all') {
    policies = policies.filter(p => p.category === category);
  }

  // Sort: new policies first, then by lastUpdated
  policies.sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  res.json({ success: true, data: policies });
});

// GET /api/states - available states
app.get('/api/states', (req, res) => {
  const states = [
    { value: 'Delhi', label: 'Delhi', labelHi: 'दिल्ली' },
    { value: 'Maharashtra', label: 'Maharashtra', labelHi: 'महाराष्ट्र' },
    { value: 'Punjab', label: 'Punjab', labelHi: 'पंजाब' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh', labelHi: 'उत्तर प्रदेश' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh', labelHi: 'मध्य प्रदेश' },
    { value: 'Rajasthan', label: 'Rajasthan', labelHi: 'राजस्थान' },
    { value: 'Gujarat', label: 'Gujarat', labelHi: 'गुजरात' },
    { value: 'Karnataka', label: 'Karnataka', labelHi: 'कर्नाटक' },
    { value: 'Haryana', label: 'Haryana', labelHi: 'हरियाणा' },
  ];
  res.json({ success: true, data: states });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasDataGovKey: !!process.env.DATA_GOV_API_KEY,
    hasGNewsKey: !!process.env.GNEWS_API_KEY,
  });
});

// ─── AI Soil Analysis Expert System ───────────────────────────────
// Comprehensive knowledge base derived from ICAR agricultural research

const SOIL_KNOWLEDGE = {
  // Nutrient optimal ranges (Indian agricultural standards, per kg of soil)
  nutrientRanges: {
    nitrogen:    { low: [0, 280], medium: [280, 560], high: [560, 999] },
    phosphorus:  { low: [0, 10], medium: [10, 25], high: [25, 999] },
    potassium:   { low: [0, 108], medium: [108, 280], high: [280, 999] },
    organic_carbon: { low: [0, 0.5], medium: [0.5, 0.75], high: [0.75, 5] },
    sulphur:     { low: [0, 10], medium: [10, 20], high: [20, 999] },
    zinc:        { low: [0, 0.6], medium: [0.6, 1.2], high: [1.2, 50] },
    iron:        { low: [0, 4.5], medium: [4.5, 9], high: [9, 999] },
    manganese:   { low: [0, 2], medium: [2, 4], high: [4, 999] },
    copper:      { low: [0, 0.2], medium: [0.2, 0.4], high: [0.4, 50] },
    boron:       { low: [0, 0.5], medium: [0.5, 1], high: [1, 50] },
  },

  // Soil type characteristics for QA-based inference
  soilTypeInference: {
    // color + texture → soil type mapping
    dark_brown: { sticky: 'Black Cotton (Vertisol)', gritty: 'Dark Loamy', smooth: 'Alluvial', mixed: 'Black Loamy' },
    light_brown: { sticky: 'Clay Loam', gritty: 'Sandy Loam', smooth: 'Silty Loam', mixed: 'Loamy (Dоmат)' },
    red: { sticky: 'Red Clay (Laterite)', gritty: 'Red Sandy', smooth: 'Red Silt', mixed: 'Red Loamy' },
    yellow: { sticky: 'Yellow Clay', gritty: 'Sandy (Arid)', smooth: 'Desert Silt', mixed: 'Sandy Loam' },
  },

  // QA-based nutrient level inference
  nutrientInference: {
    // organic matter practice → base nutrient multiplier
    organic: { regular: 1.3, sometimes: 1.0, rarely: 0.7, never: 0.5 },
    // soil color → organic carbon indicator
    colorOC: { dark_brown: 0.85, light_brown: 0.55, red: 0.45, yellow: 0.35 },
    // drainage → texture-nutrient factor
    drainage: { fast: { K: 0.6, N: 0.5 }, good: { K: 1.0, N: 1.0 }, slow: { K: 1.2, N: 0.8 }, poor: { K: 1.3, N: 0.6 } },
    // crop history → nutrient depletion
    crops: { grains: { N: -0.2, P: -0.1 }, pulses: { N: 0.3, P: -0.1 }, vegetables: { N: -0.1, P: -0.2 }, cash: { N: -0.3, K: -0.2 } },
  },

  // Crop-soil compatibility database
  cropDatabase: [
    { name: 'Rice', nameHi: 'धान', season: 'Kharif', idealPH: [5.5, 7.0], idealTexture: ['sticky', 'mixed'], waterNeed: 'high', N: 120, P: 60, K: 40, soilTypes: ['Alluvial', 'Clay', 'Loamy'], tempRange: [20, 35] },
    { name: 'Wheat', nameHi: 'गेहूं', season: 'Rabi', idealPH: [6.0, 7.5], idealTexture: ['mixed', 'smooth'], waterNeed: 'medium', N: 120, P: 60, K: 40, soilTypes: ['Alluvial', 'Loamy', 'Clay Loam'], tempRange: [10, 25] },
    { name: 'Maize', nameHi: 'मक्का', season: 'Kharif', idealPH: [5.8, 7.0], idealTexture: ['mixed', 'gritty'], waterNeed: 'medium', N: 120, P: 60, K: 40, soilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'], tempRange: [18, 32] },
    { name: 'Mustard', nameHi: 'सरसों', season: 'Rabi', idealPH: [6.0, 7.5], idealTexture: ['mixed', 'smooth'], waterNeed: 'low', N: 80, P: 40, K: 20, soilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'], tempRange: [10, 25] },
    { name: 'Chickpea', nameHi: 'चना', season: 'Rabi', idealPH: [6.0, 8.0], idealTexture: ['mixed', 'gritty'], waterNeed: 'low', N: 20, P: 50, K: 20, soilTypes: ['Loamy', 'Sandy Loam', 'Black Cotton'], tempRange: [15, 30] },
    { name: 'Soybean', nameHi: 'सोयाबीन', season: 'Kharif', idealPH: [6.0, 7.5], idealTexture: ['mixed', 'smooth'], waterNeed: 'medium', N: 20, P: 80, K: 40, soilTypes: ['Black Cotton', 'Loamy', 'Clay Loam'], tempRange: [20, 30] },
    { name: 'Cotton', nameHi: 'कपास', season: 'Kharif', idealPH: [6.0, 8.0], idealTexture: ['sticky', 'mixed'], waterNeed: 'medium', N: 120, P: 60, K: 60, soilTypes: ['Black Cotton', 'Alluvial', 'Loamy'], tempRange: [20, 35] },
    { name: 'Sugarcane', nameHi: 'गन्ना', season: 'Annual', idealPH: [6.0, 7.5], idealTexture: ['mixed', 'smooth'], waterNeed: 'high', N: 150, P: 80, K: 60, soilTypes: ['Alluvial', 'Loamy', 'Clay Loam'], tempRange: [20, 35] },
    { name: 'Potato', nameHi: 'आलू', season: 'Rabi', idealPH: [5.0, 6.5], idealTexture: ['gritty', 'mixed'], waterNeed: 'medium', N: 150, P: 80, K: 100, soilTypes: ['Sandy Loam', 'Loamy', 'Alluvial'], tempRange: [15, 25] },
    { name: 'Tomato', nameHi: 'टमाटर', season: 'Rabi/Summer', idealPH: [6.0, 7.0], idealTexture: ['mixed', 'smooth'], waterNeed: 'medium', N: 120, P: 60, K: 80, soilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'], tempRange: [15, 30] },
    { name: 'Onion', nameHi: 'प्याज', season: 'Rabi', idealPH: [6.0, 7.0], idealTexture: ['mixed', 'smooth'], waterNeed: 'medium', N: 100, P: 50, K: 60, soilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'], tempRange: [15, 28] },
    { name: 'Groundnut', nameHi: 'मूंगफली', season: 'Kharif', idealPH: [6.0, 7.0], idealTexture: ['gritty', 'mixed'], waterNeed: 'low', N: 20, P: 40, K: 50, soilTypes: ['Sandy Loam', 'Red Loamy', 'Loamy'], tempRange: [20, 35] },
  ],

  // Fertilizer product recommendations
  fertilizerProducts: {
    nitrogen: [
      { name: 'Urea', nutrient: '46% N', dose: '2.17 kg per kg N needed', nameHi: 'यूरिया', link: 'https://www.amazon.in/s?k=urea' },
      { name: 'DAP', nutrient: '18% N + 46% P₂O₅', dose: 'Combined N+P source', nameHi: 'डीएपी', link: 'https://www.amazon.in/s?k=dap' },
    ],
    phosphorus: [
      { name: 'SSP', nutrient: '16% P₂O₅', dose: '6.25 kg per kg P₂O₅ needed', nameHi: 'सिंगल सुपर फॉस्फेट', link: 'https://www.amazon.in/s?k=single+super+phosphate' },
      { name: 'DAP', nutrient: '46% P₂O₅', dose: '2.17 kg per kg P₂O₅ needed', nameHi: 'डीएपी', link: 'https://www.amazon.in/s?k=dap' },
    ],
    potassium: [
      { name: 'MOP', nutrient: '60% K₂O', dose: '1.67 kg per kg K₂O needed', nameHi: 'म्यूरेट ऑफ पोटाश', link: 'https://www.amazon.in/s?k=mop+fertilizer' },
    ],
    zinc: [
      { name: 'Zinc Sulphate', nutrient: '33% Zn', dose: '25 kg/hectare', nameHi: 'जिंक सल्फेट', link: 'https://www.amazon.in/s?k=zinc+sulphate' },
    ],
    sulphur: [
      { name: 'Gypsum', nutrient: '18% S', dose: '250 kg/hectare', nameHi: 'जिप्सम', link: 'https://www.amazon.in/s?k=gypsum+fertilizer' },
    ],
    boron: [
      { name: 'Borax', nutrient: '11% B', dose: '10 kg/hectare', nameHi: 'बोरेक्स', link: 'https://www.amazon.in/s?k=boron+fertilizer' },
    ],
  },
};

// ── Expert System: Lab Report Analysis ──
function analyzeLabReport(data) {
  const {
    nitrogen = 250, phosphorus = 12, potassium = 150,
    ph = 7.0, organicCarbon = 0.5, ec = 0.3,
    sulphur, zinc, iron, manganese, copper, boron,
    region = 'Delhi', currentCrop = '', season = 'Rabi',
  } = data;

  // 1. Classify each nutrient
  const nutrients = {};
  const ranges = SOIL_KNOWLEDGE.nutrientRanges;

  function classify(value, range) {
    if (value <= range.low[1]) return { status: 'low', score: Math.round((value / range.low[1]) * 33) };
    if (value <= range.medium[1]) return { status: 'medium', score: 33 + Math.round(((value - range.medium[0]) / (range.medium[1] - range.medium[0])) * 34) };
    return { status: 'high', score: Math.min(100, 67 + Math.round(((value - range.high[0]) / Math.max(range.high[0], 1)) * 33)) };
  }

  nutrients.nitrogen = { value: nitrogen, unit: 'kg/ha', ...classify(nitrogen, ranges.nitrogen) };
  nutrients.phosphorus = { value: phosphorus, unit: 'kg/ha', ...classify(phosphorus, ranges.phosphorus) };
  nutrients.potassium = { value: potassium, unit: 'kg/ha', ...classify(potassium, ranges.potassium) };
  nutrients.organic_carbon = { value: organicCarbon, unit: '%', ...classify(organicCarbon, ranges.organic_carbon) };
  if (sulphur != null) nutrients.sulphur = { value: sulphur, unit: 'mg/kg', ...classify(sulphur, ranges.sulphur) };
  if (zinc != null) nutrients.zinc = { value: zinc, unit: 'mg/kg', ...classify(zinc, ranges.zinc) };
  if (iron != null) nutrients.iron = { value: iron, unit: 'mg/kg', ...classify(iron, ranges.iron) };
  if (manganese != null) nutrients.manganese = { value: manganese, unit: 'mg/kg', ...classify(manganese, ranges.manganese) };
  if (copper != null) nutrients.copper = { value: copper, unit: 'mg/kg', ...classify(copper, ranges.copper) };
  if (boron != null) nutrients.boron = { value: boron, unit: 'mg/kg', ...classify(boron, ranges.boron) };

  // 2. pH analysis
  let phStatus, phAdvice, phAdviceHi;
  if (ph < 5.5) { phStatus = 'Strongly Acidic'; phAdvice = 'Apply lime @ 2-4 quintal/acre to raise pH'; phAdviceHi = 'pH बढ़ाने के लिए 2-4 क्विंटल/एकड़ चूना डालें'; }
  else if (ph < 6.5) { phStatus = 'Slightly Acidic'; phAdvice = 'Apply lime @ 1-2 quintal/acre'; phAdviceHi = '1-2 क्विंटल/एकड़ चूना डालें'; }
  else if (ph <= 7.5) { phStatus = 'Neutral (Optimal)'; phAdvice = 'pH is in the ideal range. Maintain current practices.'; phAdviceHi = 'pH आदर्श सीमा में है। वर्तमान प्रक्रियाएं जारी रखें।'; }
  else if (ph <= 8.5) { phStatus = 'Alkaline'; phAdvice = 'Apply gypsum @ 2-4 quintal/acre and organic matter to reduce pH'; phAdviceHi = 'pH कम करने के लिए 2-4 क्विंटल/एकड़ जिप्सम और जैविक खाद डालें'; }
  else { phStatus = 'Strongly Alkaline'; phAdvice = 'Apply gypsum @ 4-6 quintal/acre. Consider sulphur application.'; phAdviceHi = '4-6 क्विंटल/एकड़ जिप्सम और गंधक डालें'; }

  // 3. EC (salinity) analysis
  let ecStatus;
  if (ec < 1) ecStatus = 'Normal (No salinity issue)';
  else if (ec < 2) ecStatus = 'Slightly Saline';
  else if (ec < 4) ecStatus = 'Moderately Saline';
  else ecStatus = 'Highly Saline — salt-tolerant crops recommended';

  // 4. Soil type inference from pH + EC + texture
  let soilType, soilTypeHi;
  if (ph > 7.5 && ec < 1) { soilType = 'Alluvial (Indo-Gangetic)'; soilTypeHi = 'जलोढ़ (गंगा का मैदान)'; }
  else if (ph > 7.5 && ec > 1) { soilType = 'Saline-Alkaline'; soilTypeHi = 'लवणीय-क्षारीय'; }
  else if (ph < 6.5 && organicCarbon > 0.6) { soilType = 'Red Laterite'; soilTypeHi = 'लाल लेटराइट'; }
  else if (organicCarbon > 0.8) { soilType = 'Black Cotton (Vertisol)'; soilTypeHi = 'काली कपास मिट्टी'; }
  else { soilType = 'Loamy (Mixed)'; soilTypeHi = 'दोमट (मिश्रित)'; }

  // 5. Overall health score (weighted)
  const weights = { nitrogen: 0.2, phosphorus: 0.2, potassium: 0.15, organic_carbon: 0.2, ph: 0.15, ec: 0.1 };
  const phScore = ph >= 6.0 && ph <= 7.5 ? 85 : ph >= 5.5 && ph <= 8.0 ? 60 : 30;
  const ecScore = ec < 1 ? 90 : ec < 2 ? 60 : 30;
  let healthScore = Math.round(
    (nutrients.nitrogen.score * weights.nitrogen) +
    (nutrients.phosphorus.score * weights.phosphorus) +
    (nutrients.potassium.score * weights.potassium) +
    (nutrients.organic_carbon.score * weights.organic_carbon) +
    (phScore * weights.ph) +
    (ecScore * weights.ec)
  );
  healthScore = Math.min(100, Math.max(5, healthScore));

  let healthLabel, healthLabelHi;
  if (healthScore >= 80) { healthLabel = 'Excellent'; healthLabelHi = 'उत्कृष्ट'; }
  else if (healthScore >= 60) { healthLabel = 'Good'; healthLabelHi = 'अच्छा'; }
  else if (healthScore >= 40) { healthLabel = 'Moderate'; healthLabelHi = 'मध्यम'; }
  else { healthLabel = 'Poor — Needs Improvement'; healthLabelHi = 'खराब — सुधार आवश्यक'; }

  // 6. Crop suitability
  const cropScores = SOIL_KNOWLEDGE.cropDatabase.map(crop => {
    let score = 50; // base
    // pH match
    if (ph >= crop.idealPH[0] && ph <= crop.idealPH[1]) score += 25;
    else if (ph >= crop.idealPH[0] - 0.5 && ph <= crop.idealPH[1] + 0.5) score += 10;
    else score -= 15;
    // Nutrient availability (N, P, K)
    if (nutrients.nitrogen.status !== 'low') score += 8; else score -= 5;
    if (nutrients.phosphorus.status !== 'low') score += 8; else score -= 5;
    if (nutrients.potassium.status !== 'low') score += 8; else score -= 5;
    // Organic carbon
    if (nutrients.organic_carbon.status === 'high') score += 5;
    // Salinity penalty
    if (ec > 2) score -= 15;
    return { ...crop, suitability: Math.min(99, Math.max(10, score)) };
  }).sort((a, b) => b.suitability - a.suitability);

  // 7. Fertilizer prescription
  const deficientNutrients = [];
  if (nutrients.nitrogen.status === 'low') deficientNutrients.push({ nutrient: 'Nitrogen', nutrientHi: 'नाइट्रोजन', severity: 'high', products: SOIL_KNOWLEDGE.fertilizerProducts.nitrogen });
  else if (nutrients.nitrogen.status === 'medium') deficientNutrients.push({ nutrient: 'Nitrogen', nutrientHi: 'नाइट्रोजन', severity: 'medium', products: SOIL_KNOWLEDGE.fertilizerProducts.nitrogen });
  if (nutrients.phosphorus.status === 'low') deficientNutrients.push({ nutrient: 'Phosphorus', nutrientHi: 'फास्फोरस', severity: 'high', products: SOIL_KNOWLEDGE.fertilizerProducts.phosphorus });
  if (nutrients.potassium.status === 'low') deficientNutrients.push({ nutrient: 'Potassium', nutrientHi: 'पोटैशियम', severity: 'high', products: SOIL_KNOWLEDGE.fertilizerProducts.potassium });
  if (nutrients.zinc?.status === 'low') deficientNutrients.push({ nutrient: 'Zinc', nutrientHi: 'जिंक', severity: 'medium', products: SOIL_KNOWLEDGE.fertilizerProducts.zinc });
  if (nutrients.sulphur?.status === 'low') deficientNutrients.push({ nutrient: 'Sulphur', nutrientHi: 'सल्फर', severity: 'medium', products: SOIL_KNOWLEDGE.fertilizerProducts.sulphur });

  // 8. Irrigation advice based on soil type
  let irrigationType, irrigationHi, irrigationSchedule;
  if (soilType.includes('Alluvial') || soilType.includes('Loamy')) {
    irrigationType = 'Moderate frequency, medium duration';
    irrigationHi = 'मध्यम आवृत्ति, मध्यम अवधि';
    irrigationSchedule = [
      { day: 'Mon/Thu', action: 'Light irrigation - 30 min', actionHi: 'हल्की सिंचाई - 30 मिनट' },
      { day: 'Wed/Sat', action: 'Deep irrigation - 60 min', actionHi: 'गहरी सिंचाई - 60 मिनट' },
    ];
  } else if (soilType.includes('Sandy') || soilType.includes('Arid')) {
    irrigationType = 'High frequency, short duration (drip recommended)';
    irrigationHi = 'अधिक आवृत्ति, कम अवधि (ड्रिप सिंचाई)';
    irrigationSchedule = [
      { day: 'Daily', action: 'Drip irrigation - 20 min', actionHi: 'ड्रिप सिंचाई - 20 मिनट' },
      { day: 'Alt. days', action: 'Sprinkler - 30 min', actionHi: 'स्प्रिंकलर - 30 मिनट' },
    ];
  } else {
    irrigationType = 'Low frequency, long duration';
    irrigationHi = 'कम आवृत्ति, लंबी अवधि';
    irrigationSchedule = [
      { day: 'Tue/Fri', action: 'Deep irrigation - 90 min', actionHi: 'गहरी सिंचाई - 90 मिनट' },
      { day: 'As needed', action: 'Check soil moisture before watering', actionHi: 'सिंचाई से पहले नमी जांचें' },
    ];
  }

  // 9. Improvement roadmap
  const improvements = [];
  if (nutrients.organic_carbon.status !== 'high') {
    improvements.push({
      term: 'Short-term', termHi: 'अल्पकालिक',
      action: 'Apply FYM/Compost @ 5-10 tonnes/acre to boost organic carbon',
      actionHi: 'जैविक कार्बन बढ़ाने के लिए 5-10 टन/एकड़ गोबर/कम्पोस्ट खाद डालें',
      priority: 'high',
    });
  }
  if (deficientNutrients.length > 0) {
    improvements.push({
      term: 'Short-term', termHi: 'अल्पकालिक',
      action: `Address ${deficientNutrients.map(d => d.nutrient).join(', ')} deficiency with recommended fertilizers`,
      actionHi: `सुझाए गए उर्वरकों से ${deficientNutrients.map(d => d.nutrientHi).join(', ')} की कमी दूर करें`,
      priority: 'high',
    });
  }
  improvements.push({
    term: 'Medium-term', termHi: 'मध्यकालिक',
    action: 'Practice crop rotation — alternate cereals with legumes (N-fixing)',
    actionHi: 'फसल चक्र अपनाएं — दलहनी फसलों को शामिल करें (नाइट्रोजन स्थिरीकरण)',
    priority: 'medium',
  });
  improvements.push({
    term: 'Long-term', termHi: 'दीर्घकालिक',
    action: 'Adopt green manuring, mulching, and minimum tillage to build soil structure',
    actionHi: 'मिट्टी की संरचना सुधारने के लिए हरी खाद, मल्चिंग और न्यूनतम जुताई अपनाएं',
    priority: 'medium',
  });
  if (ph < 6.0 || ph > 8.0) {
    improvements.push({
      term: 'Medium-term', termHi: 'मध्यकालिक',
      action: phAdvice,
      actionHi: phAdviceHi,
      priority: 'high',
    });
  }

  return {
    soilType, soilTypeHi,
    healthScore, healthLabel, healthLabelHi,
    nutrients,
    ph: { value: ph, status: phStatus, advice: phAdvice, adviceHi: phAdviceHi },
    ec: { value: ec, status: ecStatus },
    cropRecommendations: cropScores.slice(0, 8),
    deficiencies: deficientNutrients,
    irrigation: { type: irrigationType, typeHi: irrigationHi, schedule: irrigationSchedule },
    improvements,
    confidence: data.nitrogen != null ? 92 : 75, // Higher confidence with lab data
    analysisType: 'lab_report',
    timestamp: new Date().toISOString(),
  };
}

// ── Expert System: QA-Based Inference ──
function analyzeQA(answers) {
  const { color = 'light_brown', texture = 'mixed', drainage = 'good', organic = 'sometimes', crops = 'grains', ph: phAnswer = 'unknown', region = 'Delhi', season = 'Rabi' } = answers;

  // 1. Infer soil type
  const soilTypeMap = SOIL_KNOWLEDGE.soilTypeInference[color] || SOIL_KNOWLEDGE.soilTypeInference.light_brown;
  const soilType = soilTypeMap[texture] || 'Loamy (Mixed)';
  const soilTypeHi = {
    'Black Cotton (Vertisol)': 'काली कपास (वर्टिसोल)', 'Dark Loamy': 'गहरी दोमट',
    'Alluvial': 'जलोढ़', 'Black Loamy': 'काली दोमट',
    'Clay Loam': 'चिकनी दोमट', 'Sandy Loam': 'रेतीली दोमट',
    'Silty Loam': 'गादयुक्त दोमट', 'Loamy (Dоmат)': 'दोमट',
    'Red Clay (Laterite)': 'लाल चिकनी (लेटराइट)', 'Red Sandy': 'लाल रेतीली',
    'Red Silt': 'लाल गाद', 'Red Loamy': 'लाल दोमट',
    'Yellow Clay': 'पीली चिकनी', 'Sandy (Arid)': 'रेतीली (शुष्क)',
    'Desert Silt': 'रेगिस्तानी गाद', 'Sandy Loam': 'रेतीली दोमट',
  }[soilType] || 'दोमट';

  // 2. Infer pH
  let inferredPH;
  if (phAnswer === 'acidic') inferredPH = 5.8;
  else if (phAnswer === 'neutral') inferredPH = 7.0;
  else if (phAnswer === 'alkaline') inferredPH = 8.0;
  else {
    // Infer from drainage + color
    const pHBase = { dark_brown: 7.2, light_brown: 7.0, red: 5.8, yellow: 7.5 };
    const drainageAdj = { fast: -0.3, good: 0, slow: 0.3, poor: 0.5 };
    inferredPH = Math.round(((pHBase[color] || 7.0) + (drainageAdj[drainage] || 0)) * 10) / 10;
  }

  // 3. Infer nutrient levels
  const organicFactor = SOIL_KNOWLEDGE.nutrientInference.organic[organic] || 1.0;
  const colorOC = SOIL_KNOWLEDGE.nutrientInference.colorOC[color] || 0.5;
  const drainageFactor = SOIL_KNOWLEDGE.nutrientInference.drainage[drainage] || { K: 1.0, N: 1.0 };
  const cropFactor = SOIL_KNOWLEDGE.nutrientInference.crops[crops] || { N: 0, P: 0 };

  // Base nutrient values for Indian soils
  const baseN = 300, baseP = 15, baseK = 180;
  const inferredN = Math.round(baseN * organicFactor * (drainageFactor.N || 1.0) * (1 + (cropFactor.N || 0)));
  const inferredP = Math.round(baseP * organicFactor * (1 + (cropFactor.P || 0)));
  const inferredK = Math.round(baseK * (drainageFactor.K || 1.0) * (1 + (cropFactor.K || 0)));
  const inferredOC = Math.round(colorOC * organicFactor * 100) / 100;

  // 4. Run through the same lab analysis engine
  const result = analyzeLabReport({
    nitrogen: inferredN,
    phosphorus: inferredP,
    potassium: inferredK,
    ph: inferredPH,
    organicCarbon: inferredOC,
    ec: drainage === 'poor' ? 1.5 : 0.4,
    region,
    season,
  });

  // Override some fields for QA context
  result.soilType = soilType;
  result.soilTypeHi = soilTypeHi;
  result.analysisType = 'questionnaire';
  result.confidence = phAnswer !== 'unknown' ? 72 : 58;
  result.inferredValues = { nitrogen: inferredN, phosphorus: inferredP, potassium: inferredK, ph: inferredPH, organicCarbon: inferredOC };

  return result;
}

// ── API Endpoints ──

app.post('/api/soil/analyze-report', (req, res) => {
  try {
    const result = analyzeLabReport(req.body);
    console.log(`   🧪 Lab report analysis: Health ${result.healthScore}/100 (${result.healthLabel})`);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Soil analysis error:', err);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

app.post('/api/soil/analyze-qa', (req, res) => {
  try {
    const result = analyzeQA(req.body);
    console.log(`   🧪 QA analysis: ${result.soilType} — Health ${result.healthScore}/100 (${result.healthLabel})`);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Soil QA analysis error:', err);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// ─── AI Crop Doctor Expert System ──────────────────────────────────
// Knowledge base for common crop diseases in India
const CROP_DISEASE_KNOWLEDGE = [
  {
    name: 'Leaf Rust (Wheat/Coffee)',
    nameHi: 'पत्ती का जंग रोग',
    confidenceRange: [85, 96],
    cropTypes: ['wheat', 'coffee', 'grains'],
    description: 'Small, circular, orange-brown pustules on the upper leaf surface that produce rust-colored spores.',
    descriptionHi: 'पत्ती की ऊपरी सतह पर छोटे, गोल, नारंगी-भूरे रंग के दाने जो जंग के रंग के बीजाणु पैदा करते हैं।',
    solutions: [
      { step: 'Apply fungicide immediately to affected areas', stepHi: 'प्रभावित हिस्सों पर तुरंत फंगीसाइड का छिड़काव करें' },
      { step: 'Remove and destroy severely infected leaves', stepHi: 'गंभीर रूप से संक्रमित पत्तियों को हटा दें और नष्ट कर दें' },
      { step: 'Improve air circulation between plants', stepHi: 'पौधों के बीच हवा का प्रवाह सुधारें' },
      { step: 'Avoid overhead watering to keep foliage dry', stepHi: 'पत्तियों को सूखा रखने के लिए ऊपर से पानी देने से बचें' },
    ],
    products: [
      { name: 'Triazole Fungicide (Propiconazole 25% EC)', nameHi: 'ट्राईज़ोल फंगीसाइड', price: '₹450/L', link: 'https://www.amazon.in/s?k=propiconazole' },
      { name: 'Mancozeb 75% WP', nameHi: 'मैनकोज़ेब फंगीसाइड', price: '₹320/kg', link: 'https://www.amazon.in/s?k=mancozeb' },
    ]
  },
  {
    name: 'Fall Armyworm',
    nameHi: 'फॉल आर्मीवर्म',
    confidenceRange: [88, 98],
    cropTypes: ['maize', 'sorghum', 'corn'],
    description: 'Severe damage to whorl leaves resulting in ragged holes. Caterpillars are actively feeding, leaving large amounts of moist frass.',
    descriptionHi: 'गोभ की पत्तियों को गंभीर नुकसान जिससे फटे हुए छेद हो जाते हैं। इल्लियाँ सक्रिय रूप से खा रही हैं, मल छोड़ रही हैं।',
    solutions: [
      { step: 'Apply Spinetoram 11.7 SC @ 4ml/10L water in early morning or late evening', stepHi: 'सुबह जल्दी या देर शाम को स्पिनेटोरम 11.7 SC @ 4ml/10L पानी में छिड़कें' },
      { step: 'Install pheromone traps for monitoring male moths', stepHi: 'नर पतंगों की निगरानी के लिए फेरोमोन जाल स्थापित करें' },
      { step: 'Manually collect and destroy egg masses if infestation is early', stepHi: 'यदि संक्रमण शुरुआती है, तो अंडे के गुच्छों को मैन्युअल रूप से इकट्ठा करें और नष्ट कर दें' },
    ],
    products: [
      { name: 'Spinetoram 11.7% SC (Delegate)', nameHi: 'स्पिनेटोरम', price: '₹1200/100ml', link: 'https://www.amazon.in/s?k=spinetoram' },
      { name: 'Chlorantraniliprole 18.5% SC (Coragen)', nameHi: 'कोरजेन कोराजन', price: '₹950/60ml', link: 'https://www.amazon.in/s?k=chlorantraniliprole' },
      { name: 'FAW Pheromone Lure', nameHi: 'फेरोमोन ल्यूर', price: '₹350/pack', link: 'https://www.amazon.in/s?k=pheromone+trap' },
    ]
  },
  {
    name: 'Powdery Mildew',
    nameHi: 'पाउडरी फफूंदी (सफेद रोली)',
    confidenceRange: [82, 94],
    cropTypes: ['cucurbits', 'grapes', 'mango', 'peas'],
    description: 'White or gray powdery spots form on leaves, stems, and fruits, eventually covering entire surfaces and causing leaves to yellow and drop.',
    descriptionHi: 'पत्तियों, तनों और फलों पर सफेद या भूरे रंग के पाउडर जैसे धब्बे बनते हैं, जिससे पत्तियां पीली होकर गिर जाती हैं।',
    solutions: [
      { step: 'Spray wettable sulphur @ 3g/L of water', stepHi: '3 ग्राम/लीटर पानी में घुलनशील सल्फर का छिड़काव करें' },
      { step: 'Ensure proper plant spacing for sunlight penetration', stepHi: 'सूरज की रोशनी के लिए पौधों के बीच उचित दूरी सुनिश्चित करें' },
      { step: 'Prune away heavily diseased foliage to reduce spore spread', stepHi: 'बीजाणुओं को फैलने से रोकने के लिए अधिक रोगग्रस्त पत्तियों को काट दें' },
    ],
    products: [
      { name: 'Wettable Sulphur 80% WDG', nameHi: 'घुलनशील सल्फर', price: '₹180/kg', link: 'https://www.amazon.in/s?k=wettable+sulphur' },
      { name: 'Hexaconazole 5% SC', nameHi: 'हेक्साकोनाजोल', price: '₹400/L', link: 'https://www.amazon.in/s?k=hexaconazole' },
      { name: 'Organic Neem Oil Extract', nameHi: 'जैविक नीम का तेल', price: '₹250/500ml', link: 'https://www.amazon.in/s?k=neem+oil+agriculture' },
    ]
  },
  {
    name: 'Early Blight',
    nameHi: 'अगेती झुलसा',
    confidenceRange: [78, 91],
    cropTypes: ['potato', 'tomato', 'vegetables'],
    description: 'Brown to black spots with concentric rings target-board appearance on older leaves. Leaves may yellow around the spots.',
    descriptionHi: 'पुरानी पत्तियों पर भूरे से काले रंग के धब्बे जिनमें छल्ले (टारगेट-बोर्ड) दिखाई देते हैं। धब्बों के आसपास पत्तियां पीली हो सकती हैं।',
    solutions: [
      { step: 'Apply Chlorothalonil or Mancozeb prophylactically during humid weather', stepHi: 'नम मौसम के दौरान एहतियात के तौर पर क्लोरोथालोनिल या मैनकोजेब का प्रयोग करें' },
      { step: 'Practice 3-4 year crop rotation away from solanaceous crops', stepHi: 'सोलैनेसियस फसलों से दूर 3-4 साल का फसल चक्र अपनाएं' },
      { step: 'Avoid watering foliage; use drip irrigation if possible', stepHi: 'पत्तियों को पानी देने से बचें; यदि संभव हो तो ड्रिप सिंचाई का उपयोग करें' },
    ],
    products: [
      { name: 'Chlorothalonil 75% WP', nameHi: 'क्लोरोथालोनिल', price: '₹550/kg', link: 'https://www.amazon.in/s?k=chlorothalonil' },
      { name: 'Copper Oxychloride 50% WP', nameHi: 'कॉपर ऑक्सीक्लोराइड (नीला थोथा)', price: '₹380/500g', link: 'https://www.amazon.in/s?k=copper+oxychloride' },
    ]
  },
  {
    name: 'Yellow Vein Mosaic Virus (YVMV)',
    nameHi: 'पीला शिरा मोज़ेक वायरस',
    confidenceRange: [90, 99],
    cropTypes: ['okra', 'bhindi'],
    description: 'Complete yellowing of leaf veins forming a prominent yellow network. In severe cases, the entire leaf turns yellow and fruit production halts.',
    descriptionHi: 'पत्ती की नसों का पूरी तरह से पीला होना जिससे एक प्रमुख पीला नेटवर्क बन जाता है। गंभीर मामलों में, फल उत्पादन रुक जाता है।',
    solutions: [
      { step: 'Uproot and burn infected plants immediately (virus cannot be cured)', stepHi: 'संक्रमित पौधों को तुरंत उखाड़ कर जला दें (वायरस का इलाज नहीं किया जा सकता)' },
      { step: 'Control the Whitefly vector using Imidacloprid or Neem Oil', stepHi: 'इमिडाक्लोप्रिड या नीम के तेल का उपयोग करके सफेद मक्खी (वेक्टर) को नियंत्रित करें' },
      { step: 'Use resistant seed varieties for the next season', stepHi: 'अगले मौसम के लिए प्रतिरोधी बीज किस्मों का उपयोग करें' },
    ],
    products: [
      { name: 'Imidacloprid 17.8% SL', nameHi: 'इमिडाक्लोप्रिड', price: '₹280/100ml', link: 'https://www.amazon.in/s?k=imidacloprid' },
      { name: 'Thiamethoxam 25% WG', nameHi: 'थियामेथोक्साम', price: '₹320/100g', link: 'https://www.amazon.in/s?k=thiamethoxam' },
      { name: 'Yellow Sticky Traps (for Whiteflies)', nameHi: 'पीले चिपचिपे जाल', price: '₹150/10pc', link: 'https://www.amazon.in/s?k=yellow+sticky+traps' },
    ]
  }
];

app.post('/api/crop-doctor/analyze', (req, res) => {
  try {
    const { cropType = 'general', imageBase64 } = req.body;
    
    // In a real implementation, this would send `imageBase64` to a TensorFlow/PyTorch model
    // Here we simulate the ML inference by randomly selecting a plausible disease based on cropType
    // or just a random one if no crop type is specified.
    
    let possibleDiseases = CROP_DISEASE_KNOWLEDGE;
    if (cropType !== 'general') {
      const filtered = CROP_DISEASE_KNOWLEDGE.filter(d => 
        d.cropTypes.some(c => cropType.toLowerCase().includes(c))
      );
      if (filtered.length > 0) {
        possibleDiseases = filtered;
      }
    }
    
    const selectedDisease = possibleDiseases[Math.floor(Math.random() * possibleDiseases.length)];
    
    // Generate a random confidence score within the disease's typical range
    const [minConf, maxConf] = selectedDisease.confidenceRange;
    const confidenceScore = Math.floor(Math.random() * (maxConf - minConf + 1)) + minConf;

    console.log(`   🩺 Crop Doctor analysis complete: ${selectedDisease.name} (${confidenceScore}% confidence)`);
    
    res.json({
      success: true,
      data: {
        diseaseName: selectedDisease.name,
        diseaseNameHi: selectedDisease.nameHi,
        confidence: confidenceScore,
        description: selectedDisease.description,
        descriptionHi: selectedDisease.descriptionHi,
        actionPlan: selectedDisease.solutions,
        recommendedProducts: selectedDisease.products,
      }
    });

  } catch (err) {
    console.error('Crop Doctor error:', err);
    res.status(500).json({ success: false, error: 'Image analysis failed' });
  }
});

// ─── Pest Alert System ────────────────────────────────────────────
// In-memory store for pest alerts
const pestAlerts = [];
const sseClients = new Set();
let alertIdCounter = 1;

// Seed some initial alerts
const SEED_ALERTS = [
  {
    pest: 'Brown Plant Hopper',
    pestHi: 'भूरा पौधा फुदका',
    crop: 'Rice',
    severity: 'high',
    description: 'Heavy infestation spotted in rice paddy fields. Leaves turning brown and drying up.',
    descriptionHi: 'धान के खेतों में भारी संक्रमण देखा गया। पत्तियाँ भूरी होकर सूख रही हैं।',
    remedy: 'Apply Imidacloprid 17.8 SL @ 3ml/10L water. Drain excess water from fields.',
    remedyHi: 'इमिडाक्लोप्रिड 17.8 SL @ 3ml/10L पानी में छिड़काव करें। खेतों से अतिरिक्त पानी निकालें।',
    farmerName: 'Ramesh Kumar',
    location: { lat: 28.7141, lng: 77.1125, district: 'North Delhi', state: 'Delhi' },
    affectedArea: '2 acres',
    photoUrl: '',
  },
  {
    pest: 'Stem Borer',
    pestHi: 'तना छेदक',
    crop: 'Rice',
    severity: 'medium',
    description: 'Dead hearts observed in tillers. Larvae found inside stems.',
    descriptionHi: 'कल्लों में डेड हार्ट दिखा। तनों के अंदर लार्वा पाया गया।',
    remedy: 'Install pheromone traps. Apply Cartap Hydrochloride granules in standing water.',
    remedyHi: 'फेरोमोन ट्रैप लगाएं। खड़े पानी में कार्टैप हाइड्रोक्लोराइड ग्रैन्यूल डालें।',
    farmerName: 'Suresh Patel',
    location: { lat: 28.6328, lng: 77.3003, district: 'East Delhi', state: 'Delhi' },
    affectedArea: '1.5 acres',
    photoUrl: '',
  },
  {
    pest: 'Leaf Folder',
    pestHi: 'पत्ती मोड़क',
    crop: 'Rice',
    severity: 'low',
    description: 'Leaves folded longitudinally. Scraping marks visible on leaf surface.',
    descriptionHi: 'पत्तियाँ लम्बाई में मुड़ी हुई हैं। पत्ती की सतह पर खुरचने के निशान।',
    remedy: 'Spray Chlorantraniliprole 18.5 SC @ 3ml/10L water. Maintain field hygiene.',
    remedyHi: 'क्लोरेंट्रानिलिप्रोल 18.5 SC @ 3ml/10L पानी में छिड़काव करें। खेत की साफ-सफाई बनाए रखें।',
    farmerName: 'Arun Singh',
    location: { lat: 28.5955, lng: 77.2040, district: 'South Delhi', state: 'Delhi' },
    affectedArea: '0.5 acres',
    photoUrl: '',
  },
  {
    pest: 'Fall Armyworm',
    pestHi: 'फॉल आर्मीवर्म',
    crop: 'Maize',
    severity: 'high',
    description: 'Severe damage to maize whorl leaves. Caterpillars feeding actively at night.',
    descriptionHi: 'मक्के की गोभ पत्तियों को गंभीर नुकसान। इल्लियाँ रात में सक्रिय रूप से खा रही हैं।',
    remedy: 'Apply Spinetoram 11.7 SC @ 4ml/10L water during early morning or late evening.',
    remedyHi: 'सुबह जल्दी या शाम को स्पिनेटोरम 11.7 SC @ 4ml/10L पानी में छिड़काव करें।',
    farmerName: 'Vijay Sharma',
    location: { lat: 28.8527, lng: 77.0930, district: 'North Delhi', state: 'Delhi' },
    affectedArea: '3 acres',
    photoUrl: '',
  },
  {
    pest: 'Aphids',
    pestHi: 'माहू (एफिड्स)',
    crop: 'Mustard',
    severity: 'medium',
    description: 'Colonies of green aphids found on mustard flower heads. Honeydew secretion visible.',
    descriptionHi: 'सरसों के फूलों पर हरे माहू के झुंड पाए गए। मधुरस स्राव दिखाई दे रहा है।',
    remedy: 'Spray Dimethoate 30 EC @ 2ml/L water. Release ladybird beetles as biocontrol.',
    remedyHi: 'डाइमेथोएट 30 EC @ 2ml/L पानी में छिड़काव करें। जैव नियंत्रण हेतु लेडीबर्ड बीटल छोड़ें।',
    farmerName: 'Priya Devi',
    location: { lat: 28.7441, lng: 77.0625, district: 'West Delhi', state: 'Delhi' },
    affectedArea: '1 acre',
    photoUrl: '',
  },
];

// Initialize seed data
function initSeedAlerts() {
  const now = Date.now();
  SEED_ALERTS.forEach((seed, i) => {
    const hoursAgo = [2, 5, 8, 1, 4][i] || 3;
    pestAlerts.push({
      id: alertIdCounter++,
      ...seed,
      createdAt: new Date(now - hoursAgo * 3600000).toISOString(),
      upvotes: Math.floor(Math.random() * 15) + 1,
      upvotedBy: [],
      confirmed: seed.severity === 'high',
      status: 'active',
    });
  });
}
initSeedAlerts();

// SSE endpoint for real-time notifications
app.get('/api/pest-alerts/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to pest alert stream' })}\n\n`);

  sseClients.add(res);
  console.log(`   📡 SSE client connected (total: ${sseClients.size})`);

  req.on('close', () => {
    sseClients.delete(res);
    console.log(`   📡 SSE client disconnected (total: ${sseClients.size})`);
  });
});

function broadcastAlert(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    client.write(data);
  }
}

// GET /api/pest-alerts - list all alerts
app.get('/api/pest-alerts', (req, res) => {
  const { state, severity, crop, status = 'active' } = req.query;
  let filtered = [...pestAlerts];

  if (state) filtered = filtered.filter(a => a.location.state === state);
  if (severity) filtered = filtered.filter(a => a.severity === severity);
  if (crop) filtered = filtered.filter(a => a.crop.toLowerCase() === crop.toLowerCase());
  if (status) filtered = filtered.filter(a => a.status === status);

  // Sort by severity (high first) then by date (newest first)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  filtered.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const stats = {
    total: filtered.length,
    high: filtered.filter(a => a.severity === 'high').length,
    medium: filtered.filter(a => a.severity === 'medium').length,
    low: filtered.filter(a => a.severity === 'low').length,
    totalFarmersAffected: filtered.reduce((sum, a) => sum + a.upvotes, 0),
  };

  res.json({ success: true, data: filtered, stats });
});

// POST /api/pest-alerts - create a new alert (report pest)
app.post('/api/pest-alerts', (req, res) => {
  const {
    pest, pestHi, crop, severity, description, descriptionHi,
    remedy, remedyHi, farmerName, location, affectedArea, photoUrl,
  } = req.body;

  if (!pest || !severity || !farmerName) {
    return res.status(400).json({ success: false, error: 'pest, severity, and farmerName are required' });
  }

  const newAlert = {
    id: alertIdCounter++,
    pest,
    pestHi: pestHi || '',
    crop: crop || 'Unknown',
    severity,
    description: description || '',
    descriptionHi: descriptionHi || '',
    remedy: remedy || '',
    remedyHi: remedyHi || '',
    farmerName,
    location: location || { lat: 28.7041, lng: 77.1025, district: 'Unknown', state: 'Delhi' },
    affectedArea: affectedArea || 'Unknown',
    photoUrl: photoUrl || '',
    createdAt: new Date().toISOString(),
    upvotes: 1,
    upvotedBy: [farmerName],
    confirmed: severity === 'high',
    status: 'active',
  };

  pestAlerts.push(newAlert);

  // Broadcast to all connected clients
  broadcastAlert({
    type: 'new_alert',
    alert: newAlert,
    message: `⚠️ New ${severity} severity pest alert: ${pest} reported by ${farmerName}`,
    messageHi: `⚠️ नया ${severity === 'high' ? 'उच्च' : severity === 'medium' ? 'मध्यम' : 'निम्न'} कीट अलर्ट: ${pestHi || pest} - ${farmerName} द्वारा रिपोर्ट`,
  });

  console.log(`   🐛 New pest alert #${newAlert.id}: ${pest} (${severity}) by ${farmerName}`);
  res.status(201).json({ success: true, data: newAlert });
});

// POST /api/pest-alerts/:id/upvote - confirm/upvote an alert
app.post('/api/pest-alerts/:id/upvote', (req, res) => {
  const alertId = parseInt(req.params.id);
  const { farmerName } = req.body;

  const alert = pestAlerts.find(a => a.id === alertId);
  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  if (alert.upvotedBy.includes(farmerName)) {
    return res.status(400).json({ success: false, error: 'Already upvoted' });
  }

  alert.upvotes++;
  alert.upvotedBy.push(farmerName);

  // Auto-escalate severity if many farmers confirm
  if (alert.upvotes >= 10 && alert.severity !== 'high') {
    const oldSeverity = alert.severity;
    alert.severity = 'high';
    alert.confirmed = true;
    broadcastAlert({
      type: 'severity_escalated',
      alert,
      message: `🔴 Alert escalated to HIGH: ${alert.pest} - confirmed by ${alert.upvotes} farmers`,
      messageHi: `🔴 अलर्ट उच्च स्तर पर: ${alert.pestHi || alert.pest} - ${alert.upvotes} किसानों द्वारा पुष्टि`,
    });
  } else if (alert.upvotes >= 5 && alert.severity === 'low') {
    alert.severity = 'medium';
    broadcastAlert({
      type: 'severity_escalated',
      alert,
      message: `🟠 Alert escalated to MEDIUM: ${alert.pest} - confirmed by ${alert.upvotes} farmers`,
      messageHi: `🟠 अलर्ट मध्यम स्तर पर: ${alert.pestHi || alert.pest} - ${alert.upvotes} किसानों द्वारा पुष्टि`,
    });
  }

  // Broadcast upvote
  broadcastAlert({
    type: 'upvote',
    alertId: alert.id,
    upvotes: alert.upvotes,
    farmerName,
  });

  res.json({ success: true, data: alert });
});

// PATCH /api/pest-alerts/:id/resolve - mark alert as resolved
app.patch('/api/pest-alerts/:id/resolve', (req, res) => {
  const alertId = parseInt(req.params.id);
  const alert = pestAlerts.find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.status = 'resolved';
  broadcastAlert({
    type: 'resolved',
    alertId: alert.id,
    message: `✅ Pest alert resolved: ${alert.pest}`,
    messageHi: `✅ कीट अलर्ट हल: ${alert.pestHi || alert.pest}`,
  });

  res.json({ success: true, data: alert });
});

// GET /api/pest-alerts/stats - get summary statistics
app.get('/api/pest-alerts/stats', (req, res) => {
  const active = pestAlerts.filter(a => a.status === 'active');
  res.json({
    success: true,
    data: {
      totalActive: active.length,
      highSeverity: active.filter(a => a.severity === 'high').length,
      mediumSeverity: active.filter(a => a.severity === 'medium').length,
      lowSeverity: active.filter(a => a.severity === 'low').length,
      totalResolved: pestAlerts.filter(a => a.status === 'resolved').length,
      totalFarmersReporting: new Set(active.map(a => a.farmerName)).size,
      mostReportedPest: (() => {
        const counts = {};
        active.forEach(a => { counts[a.pest] = (counts[a.pest] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
      })(),
    },
  });
});

// ─── Profile & Crop Sale System ───────────────────────────────────

let farmerProfile = {
  name: "Ramesh Kumar",
  farmerId: "#FM12345",
  phone: "+91 98765 43210",
  location: "Village Rampur, District Meerut, UP",
  memberSince: "Jan 2025",
  avatarUrl: null,
  settings: {
    voiceAssistant: true,
    pushNotifications: true,
    smsAlerts: true
  }
};

const cropsForSale = [
  {
    id: 'CROP-SEED-001',
    cropName: 'Premium Basmati Rice',
    cropNameHi: 'प्रीमियम बासमती चावल',
    category: 'grains',
    quantity: 500,
    price: '65',
    description: 'Aged basmati rice from the foothills of Himalayas. Long grain, aromatic, perfect for biryani and pulao. Naturally sun-dried.',
    images: ['https://images.unsplash.com/photo-1738569594445-0a9f422a7dab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwcmljZSUyMHBhZGR5fGVufDF8fHx8MTc3NTcyOTQwNXww&ixlib=rb-4.1.0&q=80&w=1080'],
    organic: true,
    farmer: 'Ramesh Kumar',
    farmerLocation: 'Meerut, UP',
    distance: '12 km',
    rating: 4.8,
    ratingCount: 24,
    reviews: [],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-002',
    cropName: 'Organic Tomatoes',
    cropNameHi: 'जैविक टमाटर',
    category: 'vegetables',
    quantity: 200,
    price: '40',
    description: 'Farm-fresh organic tomatoes, pesticide-free. Vine-ripened for maximum flavor and nutrition.',
    images: ['https://images.unsplash.com/photo-1748432171507-c1d62fe2e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b21hdG8lMjBwbGFudHMlMjB2ZWdldGFibGVzfGVufDF8fHx8MTc3NTcyOTQwNXww&ixlib=rb-4.1.0&q=80&w=1080'],
    organic: true,
    farmer: 'Suresh Patel',
    farmerLocation: 'Bulandshahr, UP',
    distance: '20 km',
    rating: 4.9,
    ratingCount: 18,
    reviews: [],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-003',
    cropName: 'Fresh Potatoes',
    cropNameHi: 'ताज़ा आलू',
    category: 'vegetables',
    quantity: 1000,
    price: '25',
    description: 'High-quality potatoes harvested this week. Clean, uniform size, suitable for retail and wholesale.',
    images: ['https://images.unsplash.com/photo-1744659751904-3b2e5c095323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwcG90YXRvZXMlMjBmYXJtfGVufDF8fHx8MTc3NTcyOTU4OHww&ixlib=rb-4.1.0&q=80&w=1080'],
    organic: false,
    farmer: 'Vijay Singh',
    farmerLocation: 'Ghaziabad, UP',
    distance: '8 km',
    rating: 4.6,
    ratingCount: 31,
    reviews: [],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-004',
    cropName: 'Red Onions',
    cropNameHi: 'लाल प्याज़',
    category: 'vegetables',
    quantity: 800,
    price: '30',
    description: 'Premium Nashik-variety red onions. Pungent flavor, long shelf life, excellent for cooking and salads.',
    images: ['https://images.unsplash.com/photo-1760627589778-228a65c8a975?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmlvbnMlMjB2ZWdldGFibGVzJTIwaGFydmVzdHxlbnwxfHx8fDE3NzU3Mjk1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080'],
    organic: true,
    farmer: 'Mohan Lal',
    farmerLocation: 'Noida, UP',
    distance: '15 km',
    rating: 4.7,
    ratingCount: 22,
    reviews: [],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-005',
    cropName: 'Organic Carrots',
    cropNameHi: 'जैविक गाजर',
    category: 'vegetables',
    quantity: 300,
    price: '45',
    description: 'Sweet, crunchy organic carrots grown using natural compost. No chemical pesticides, perfect for juicing and cooking.',
    images: ['https://images.unsplash.com/photo-1757332914679-0906a57881e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNhcnJvdHMlMjBvcmdhbmljfGVufDF8fHx8MTc3NTcyOTU4OHww&ixlib=rb-4.1.0&q=80&w=1080'],
    organic: true,
    farmer: 'Suresh Patel',
    farmerLocation: 'Bulandshahr, UP',
    distance: '20 km',
    rating: 4.9,
    ratingCount: 15,
    reviews: [],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-006',
    cropName: 'Wheat (Sharbati)',
    cropNameHi: 'गेहूं (शरबती)',
    category: 'grains',
    quantity: 2000,
    price: '28',
    description: 'Premium MP Sharbati wheat, golden color, high gluten content. Ideal for chapati and bread. Freshly harvested Rabi crop.',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    organic: false,
    farmer: 'Ajay Kumar',
    farmerLocation: 'Sonipat, HR',
    distance: '30 km',
    rating: 4.5,
    ratingCount: 40,
    reviews: [],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-007',
    cropName: 'Organic Moong Dal',
    cropNameHi: 'जैविक मूंग दाल',
    category: 'pulses',
    quantity: 150,
    price: '120',
    description: 'Certified organic whole moong dal. High protein content, easy to digest. Sourced directly from our family farm.',
    images: ['https://images.unsplash.com/photo-1612257416648-ee7a6c5b17eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    organic: true,
    farmer: 'Priya Devi',
    farmerLocation: 'Mathura, UP',
    distance: '45 km',
    rating: 4.7,
    ratingCount: 12,
    reviews: [],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'CROP-SEED-008',
    cropName: 'Fresh Green Chillies',
    cropNameHi: 'ताज़ी हरी मिर्च',
    category: 'vegetables',
    quantity: 100,
    price: '60',
    description: 'Spicy green chillies, freshly picked. Great heat level, perfect for Indian cooking. Harvested this morning.',
    images: ['https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    organic: false,
    farmer: 'Ravi Sharma',
    farmerLocation: 'Faridabad, HR',
    distance: '18 km',
    rating: 4.4,
    ratingCount: 9,
    reviews: [],
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

app.get('/api/profile', (req, res) => {
  res.json({ success: true, data: farmerProfile });
});

app.post('/api/profile', (req, res) => {
  try {
    const data = req.body;
    farmerProfile = { ...farmerProfile, ...data };
    console.log(`   👤 Profile updated: ${farmerProfile.name}`);
    res.json({ success: true, data: farmerProfile });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

app.get('/api/crops', (req, res) => {
  res.json({ success: true, data: cropsForSale });
});

app.post('/api/crops', (req, res) => {
  try {
    const { cropName, category, quantity, price, description, images, certifications, organic } = req.body;
    
    const newCrop = {
      id: `CROP-${Date.now()}`,
      cropName,
      cropNameHi: '',
      category,
      quantity,
      price,
      description,
      images: images || [],
      organic: organic || false,
      certifications: certifications || [],
      farmer: farmerProfile.name,
      farmerLocation: farmerProfile.location || 'Unknown',
      distance: `${Math.floor(Math.random() * 40) + 5} km`,
      rating: 0,
      ratingCount: 0,
      reviews: [],
      createdAt: new Date().toISOString()
    };
    
    cropsForSale.unshift(newCrop);
    console.log(`   🛒 New Crop Listed: ${cropName} by ${farmerProfile.name} (${cropsForSale.length} total)`);
    
    res.json({ success: true, data: newCrop });
  } catch (err) {
    console.error('Crop listing error:', err);
    res.status(500).json({ success: false, error: 'Failed to list crop' });
  }
});

// PUT /api/crops/:id/rate — buyer rates a crop/farmer product
app.put('/api/crops/:id/rate', (req, res) => {
  const cropId = req.params.id;
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
  }

  const crop = cropsForSale.find(c => c.id === cropId);
  if (!crop) {
    return res.status(404).json({ success: false, error: 'Crop not found' });
  }

  // Weighted average
  const oldTotal = crop.rating * crop.ratingCount;
  crop.ratingCount += 1;
  crop.rating = Math.round(((oldTotal + rating) / crop.ratingCount) * 10) / 10;

  if (review) {
    crop.reviews = crop.reviews || [];
    crop.reviews.unshift({ rating, review, date: new Date().toISOString() });
  }

  console.log(`   ⭐ Crop ${crop.cropName} rated ${rating}/5 (avg now ${crop.rating}, ${crop.ratingCount} reviews)`);
  res.json({ success: true, data: crop });
});
// ─── Authentication & OTP System ─────────────────────────────────

const otpStore = new Map();

app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }
  
  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, timestamp: Date.now() });
  
  console.log(`\n🔑 [AUTH] Generated OTP for +91 ${phone}: \x1b[36m${otp}\x1b[0m\n`);
  
  // Return the OTP in the response for demo purposes
  res.json({ success: true, message: 'OTP sent successfully', _demo_otp: otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const storedData = otpStore.get(phone);
  
  if (!storedData) {
    return res.status(400).json({ success: false, error: 'OTP expired or not requested' });
  }
  
  if (storedData.otp === otp) {
    otpStore.delete(phone); // Burn OTP after use
    console.log(`✅ [AUTH] User verified: +91 ${phone}`);
    return res.json({ success: true, token: `mock-jwt-token-${Date.now()}` });
  }
  
  res.status(400).json({ success: false, error: 'Invalid OTP' });
});

// ─── Smart Krishi Voice AI — Deep Knowledge Engine ──────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Per-session conversation memory (keyed by a session token from the client)
const conversationMemory = new Map(); // sessionId → { history: [], lastCrop: '', lastTopic: '' }
const SESSION_TTL = 30 * 60 * 1000; // 30 min

// Massive offline farming knowledge base
const FARMING_KB = {
  // ── Planting / Sowing ──
  planting: {
    wheat:    'Wheat (गेहूं) is best sown between mid-October to late November. Use HD-2967 or PBW-725 variety. Seed rate: 100 kg/hectare. Soak seeds in Bavistin (2g/kg) before sowing to prevent smut. Ideal soil temp: 20-25°C.',
    rice:     'Rice (धान) nursery should be prepared in June. Transplant 25-day-old seedlings in July. Use Pusa Basmati 1121 or IR-64 variety. Spacing: 20×15 cm. Maintain 5cm standing water for first 2 weeks.',
    maize:    'Maize (मक्का) Kharif sowing: June-July, Spring: February. Use PEHM-5 or DHM-117 hybrid. Seed rate: 20 kg/ha. Row spacing 60 cm, plant spacing 20 cm. Apply 120 kg N, 60 kg P₂O₅ per ha.',
    cotton:   'Cotton (कपास) is sown in April-May when soil temp reaches 18°C. Use Bt-Cotton hybrids. Spacing: 90×60 cm for irrigated, 60×30 cm for rainfed. Seed treatment with Imidacloprid 70WS (5g/kg).',
    sugarcane:'Sugarcane (गन्ना) planting: October (autumn) or February-March (spring). Use 3-eye setts. Trench method is best, 90 cm row spacing. Treat setts with Carbendazim. Needs heavy irrigation.',
    mustard:  'Mustard (सरसों) sowing: October 15 - November 5 in North India. Variety: Pusa Bold or RH-749. Seed rate 5 kg/ha. Row spacing 30-45 cm. First irrigation at 25-30 DAS (days after sowing).',
    potato:   'Potato (आलू) planting: early October in plains, March in hills. Use certified seed tubers (Kufri Jyoti, Kufri Pukhraj). Seed rate: 25-30 q/ha. Treat with Mancozeb before planting to prevent Late Blight.',
    tomato:   'Tomato (टमाटर) nursery: June-July (Kharif), Nov-Dec (Rabi). Transplant after 25-30 days. Pusa Ruby, Arka Rakshak are popular. Spacing: 60×45 cm. Stake plants for better fruit quality.',
    onion:    'Onion (प्याज) Rabi sowing: October nursery, transplant in December. Kharif: May-June. Use Agrifound Dark Red or Pusa Ridhi. Spacing: 15×10 cm. Stop irrigation 10 days before harvest.',
    soybean:  'Soybean (सोयाबीन) sowing: June 20 - July 10 with onset of monsoon. JS-9560 or JS-2034 variety. Seed rate: 70-80 kg/ha. Treat with Rhizobium + PSB culture. Row spacing 30-45 cm.',
    chickpea: 'Chickpea/Chana (चना) sowing: October-November. Desi type: Pusa 256, JG-11. Kabuli: KAK-2. Seed rate: 75-80 kg/ha. Treat seeds with Trichoderma viride (4g/kg). Avoid waterlogging.',
    groundnut:'Groundnut (मूंगफली) sowing: June-July (Kharif). GG-20, TG-37A varieties. Seed rate: 100-120 kg/ha. Apply Gypsum 250 kg/ha at pegging stage for better pod filling.',
    general:  'For best planting results: (1) Get your soil tested first (2) Choose certified seeds (3) Treat seeds with fungicide (4) Follow recommended spacing (5) Sow at the right moisture level. Tell me which crop you want to plant!',
  },

  // ── Harvesting ──
  harvesting: {
    wheat:    'Harvest wheat when grain moisture is 20-25% and ears turn golden yellow (around March-April). Use combine harvester for large areas. Thresh within 3-4 days. Dry grain to 12% moisture before storage.',
    rice:     'Rice is ready when 80% of panicles turn golden (around Oct-Nov for Kharif). Drain field 10-15 days before harvest. Moisture at harvest should be 20-24%. Dry to 14% for safe storage.',
    cotton:   'Pick cotton bolls in 3-4 rounds as they open (Oct-Dec). Avoid picking wet bolls. Grade the kapas by hand. First pick gives the best quality fiber. Dry in shade, not direct sun.',
    sugarcane:'Harvest sugarcane at 10-12 months when Brix reading is 18-20% (Feb-April). Cut at ground level. Remove trash. Mill within 24 hours for best sugar recovery. Average yield: 70-80 tonnes/ha.',
    general:  'General harvest tips: (1) Harvest at the right moisture level (2) Avoid delays — every day of delay after maturity reduces quality (3) Dry produce properly before storage (4) Use tarpaulin to prevent ground moisture damage.',
  },

  // ── Diseases — crop-specific ──
  diseases: {
    wheat:    '🌾 Wheat diseases: (1) **Yellow Rust** — yellow powdery stripes on leaves → Spray Propiconazole 25EC @ 1ml/L. (2) **Karnal Bunt** — black powder in grain → Use resistant varieties like HD-2967. (3) **Loose Smut** — black heads → Seed treatment with Carboxin 2g/kg.',
    rice:     '🍚 Rice diseases: (1) **Blast** — diamond-shaped spots → Spray Tricyclazole 75WP (0.6g/L). (2) **Bacterial Leaf Blight (BLB)** — yellow water-soaked streaks → Use resistant varieties, avoid excess N. (3) **Sheath Blight** — oval lesions on sheath → Spray Hexaconazole 1ml/L.',
    cotton:   '☁️ Cotton diseases: (1) **Pink Bollworm** — larvae inside bolls → Pheromone traps + Profenophos spray. (2) **Whitefly** — yellowing, sticky leaves → Neem oil spray, avoid excessive N fertilizer. (3) **Cotton Leaf Curl Virus** — curled leaves → Use resistant Bt-cotton varieties, control whitefly vector.',
    tomato:   '🍅 Tomato diseases: (1) **Early Blight** — concentric rings on leaves → Mancozeb 75WP spray. (2) **Late Blight** — water-soaked black spots → Metalaxyl + Mancozeb. (3) **Leaf Curl Virus** — upward curling of leaves → Control whitefly with Imidacloprid, use resistant varieties.',
    potato:   '🥔 Potato diseases: (1) **Late Blight** — most devastating, water-soaked lesions → Preventive Mancozeb spray every 7 days, curative Cymoxanil. (2) **Early Blight** — dark rings on older leaves → Cut haulms 10 days before harvest. (3) **Black Scurf** — dark patches on tubers → Treat seed with Boric acid 3%.',
    onion:    '🧅 Onion diseases: (1) **Purple Blotch** — purple lesions with yellow halo → Mancozeb + Carbendazim spray. (2) **Stemphylium Blight** — small yellow spots → Avoid overhead irrigation. (3) **Basal Rot** — rotting at base → Treat sets with Carbendazim before planting.',
    soybean:  '🫘 Soybean diseases: (1) **Yellow Mosaic Virus (YMV)** — yellow patches → Control whitefly vector, use resistant variety JS-335. (2) **Rust** — reddish-brown pustules → Hexaconazole spray at R3 stage. (3) **Charcoal Rot** — stems dry from base → Avoid moisture stress, deep ploughing.',
    mustard:  '🌻 Mustard diseases: (1) **Alternaria Blight** — dark spots on leaves/pods → Mancozeb spray at flowering. (2) **White Rust** — white pustules → Metalaxyl 25WP (1g/L). (3) **Aphid** — major pest → Imidacloprid 17.8SL spray when infestation starts.',
    general:  'General disease management: (1) Use certified, treated seeds (2) Follow crop rotation — don\'t grow the same crop repeatedly (3) Remove and burn infected plant debris (4) Spray preventive fungicides at critical growth stages (5) Don\'t wait — early detection saves 70% of the damage! Tell me which crop is affected.',
  },

  // ── Soil & Fertilizer ──
  soil: {
    testing:  'Get your soil tested at the nearest Krishi Vigyan Kendra (KVK) or Soil Testing Lab — it costs just ₹10-50. Collect soil from 6-8 spots in the field at 15cm depth, mix well, and send 500g sample. Results come in 7-10 days with fertilizer recommendations.',
    nitrogen: 'Nitrogen (N) deficiency shows as pale yellow/light green older leaves. Apply Urea (46% N) split in 2-3 doses: basal + at tillering + at flowering. For organic option: Vermicompost 5t/ha + Azotobacter biofertilizer.',
    phosphorus:'Phosphorus (P) deficiency: purplish discoloration of leaves, poor root growth. Apply DAP (18:46:0) or SSP (16% P₂O₅) at sowing. Rock phosphate is a slow-release organic option for acidic soils.',
    potassium:'Potassium (K) deficiency: leaf edges turn brown/scorched, weak stems. Apply MOP (Muriate of Potash, 60% K₂O) at sowing. Important for fruit quality. Don\'t apply near seed — maintain 5cm distance.',
    organic:  'Boost soil health organically: (1) FYM/Compost 5-10 T/acre (2) Vermicompost 2-3 T/acre (3) Green manure — grow Dhaincha/Sunhemp for 45 days and plough in (4) Mulching with crop residue (5) Jeevamrut/Panchagavya for microbial boost.',
    ph:       'Ideal soil pH for most crops: 6.0-7.5. For acidic soil (pH < 6): apply agricultural lime 2-4 q/acre, at least 1 month before sowing. For alkaline soil (pH > 8): apply Gypsum 4 q/acre + organic matter. Check pH every 2 years.',
    general:  'Soil health fundamentals: (1) Get tested every 2 years via Soil Health Card scheme (free!) (2) Maintain organic carbon >0.5% with compost (3) Practice crop rotation to prevent nutrient depletion (4) Avoid burning crop residue — it kills beneficial microbes (5) Use bio-fertilizers like Rhizobium, PSB, Azotobacter.',
  },

  // ── Irrigation / Water ──
  irrigation: {
    drip:     'Drip irrigation saves 40-60% water and increases yield 20-30%. Government subsidy: 55-80% under PMKSY. Cost: ₹50,000-80,000/acre. Best for: vegetables, fruits, cotton, sugarcane. Maintenance: clean filters monthly, check emitters.',
    sprinkler:'Sprinkler irrigation saves 30-40% water vs flood. Best for: wheat, groundnut, pulses. Rain gun covers 1-2 acres. Portable sprinkler kit costs ₹15,000-25,000. Avoid in high-wind areas. PMKSY subsidy: 55-75%.',
    flood:    'Flood/furrow irrigation has 40-50% water wastage. Improve with: (1) Laser land leveling — saves 25% water (2) Alternate wetting and drying for paddy (3) Raised bed planting for wheat (4) Surge irrigation in furrows.',
    schedule: 'Irrigation scheduling tips: (1) Water in early morning or late evening to reduce evaporation (2) Use tensiometer or feel method for soil moisture (3) Critical stages: crown root initiation (wheat), flowering, grain filling (4) Over-irrigation causes root rot and wastes energy.',
    rainwater:'Rainwater harvesting: (1) Farm pond 10×10×3m costs ₹50,000-1 lakh (MGNREGA support available) (2) Store monsoon runoff (3) Line with silpaulin to reduce seepage (4) Use for supplemental irrigation in dry spells. 1 inch rain on 1 acre = ~1 lakh liters!',
    general:  'Smart water management: Drip saves 50% water (55-80% govt subsidy), sprinkler saves 35%. Critical irrigation stages vary by crop — wheat needs water most at crown root and flowering stage, rice at transplanting and panicle stage. Overwatering is as harmful as underwatering!',
  },

  // ── Government Schemes ──
  schemes: {
    pmkisan:  'PM-KISAN: ₹6,000/year direct income support in 3 installments of ₹2,000 each. Eligibility: All landholding farmer families. Register at pmkisan.gov.in or CSC center with Aadhaar + land records. 17th installment: June 2026.',
    pmfby:    'PM Fasal Bima Yojana (PMFBY): Crop insurance at just 2% premium for Kharif, 1.5% for Rabi. Covers natural calamities, pests, diseases. Apply before sowing deadline at bank/CSC. Claims settled within 2 months. Covers prevented sowing too!',
    kcc:      'Kisan Credit Card (KCC): Get crop loan up to ₹3 lakh at just 4% interest (after 3% govt subsidy). Apply at any bank with land papers + ID proof. Also covers livestock, fisheries. Now linked to PM-KISAN for ease.',
    pmksy:    'PM Krishi Sinchayee Yojana (PMKSY): 55-80% subsidy on drip and sprinkler irrigation. Per Drop More Crop component. Apply through State Agriculture Dept. Small/marginal farmers get 55% subsidy, SC/ST get up to 80%.',
    kusum:    'PM-KUSUM: (1) Component A: Solar power plants on barren land (2) Component B: Standalone solar pumps up to 7.5 HP — 60% subsidy (3) Component C: Solarize existing pumps. Farmers can earn ₹50,000-1 lakh/year by selling surplus solar power!',
    enam:     'e-NAM (National Agriculture Market): Sell your produce online across 1,361 mandis in 23 states. Transparent pricing, no middlemen. Register free at enam.gov.in. Get quality assaying done at mandi. Payment directly to bank account.',
    shc:      'Soil Health Card: Free soil testing + crop-wise fertilizer recommendations. Issued every 2 years. Visit nearest KVK or Soil Testing Lab. Over 12 crore cards issued. Follow recommendations to save 15-20% on fertilizer costs!',
    general:  'Key govt schemes for farmers: (1) PM-KISAN: ₹6,000/year (2) PMFBY: Crop insurance at 1.5-2% (3) KCC: Loan at 4% (4) PM-KUSUM: 60% subsidy on solar pumps (5) e-NAM: Online mandi trading (6) Soil Health Card: Free soil testing. Ask me about any specific scheme!',
  },

  // ── Organic Farming ──
  organic: {
    jeevamrut:'Jeevamrut preparation: Mix 10 kg desi cow dung + 10 L cow urine + 2 kg jaggery + 2 kg pulse flour + handful of field soil in 200L water. Ferment 3-5 days. Apply 200L/acre via irrigation. Boosts soil microbes dramatically.',
    panchagavya:'Panchagavya: Mix 7 kg desi cow dung + 1 L cow urine + 1 L cow milk + 1 L curd + 500ml ghee + 3L sugarcane juice + 12 ripe bananas + 3L coconut water. Ferment 21 days. Spray 3% solution. Powerful plant growth promoter.',
    neem:     'Neem-based pest control: (1) Neem oil 3000ppm @ 5ml/L — controls 200+ insects (2) Neem cake 250 kg/acre — soil application controls nematodes + slow-release N (3) Neem kernel extract — ferment 1 kg crushed kernels in 10L water overnight, spray.',
    composting:'Composting methods: (1) Vermicompost: Use Eisenia fetida earthworms. 1 bed produces 3-4 tonnes/year. Ready in 45-60 days. (2) NADEP: Brick tank 3×1.5×1m. Layer crop residue + cow dung + soil. Ready in 90 days. (3) Biogas slurry: Excellent liquid fertilizer.',
    certification:'Organic certification through PGS (Participatory Guarantee System) is free for groups. For export: NPOP certification via agencies like APEDA. Conversion period: 2-3 years. Premium price: 20-50% more than conventional. Growing demand in India!',
    general:  'Organic farming basics: Replace Urea with Jeevamrut + Vermicompost. Replace pesticides with Neem oil + Dashparni Ark. Use crop rotation with legumes. Government\'s Natural Farming Mission provides ₹12,200/ha support. Organic produce sells at 20-50% premium!',
  },

  // ── Storage & Post-Harvest ──
  storage: {
    grain:    'Grain storage tips: (1) Dry to 12% moisture (bite test — should crack, not squish) (2) Use hermetic/airtight bags (Super Grain Bag, Purdue PICS bag) — controls insects without chemicals (3) Neem leaves in storage bins as natural repellent (4) Steel bins better than jute bags.',
    cold:     'Cold storage: Government provides 35% subsidy under Agriculture Infrastructure Fund for cold rooms. Ideal temp: Potato 2-4°C, Onion 0-2°C, Tomato 10-12°C, Fruits 1-5°C. Solar cold rooms available for ₹3-5 lakh for small farmers.',
    losses:   'India wastes 10-15% of food grains and 25-30% of fruits/vegetables post-harvest. Top causes: (1) Poor drying (2) Improper storage (3) No cold chain (4) Transportation damage. Proper storage alone can save ₹50,000-1 lakh per farmer per year!',
    general:  'Post-harvest management: (1) Harvest at right maturity (2) Clean and grade produce (3) Dry properly — grains to 12%, spices to 10% (4) Use scientific storage — hermetic bags, metal bins (5) Consider value addition: flour, pickles, chips for 2-5x returns.',
  },

  // ── Livestock ──
  livestock: {
    dairy:    'Dairy farming tips: (1) Feed balanced ration: 1 kg concentrate per 2.5L milk above maintenance (2) Green fodder 25-30 kg + dry fodder 5-6 kg daily (3) Mineral mixture 50g/day (4) Vaccinate: FMD, BQ, HS on schedule (5) Clean water ad-lib. Good cow gives 12-20 L/day.',
    poultry:  'Backyard poultry: Start with 50-100 Kadaknath or Vanaraja birds. Investment ₹15,000-25,000. Vaccination: Ranikhet (F1) Day 7, Lasota Day 28, R2B at 8 weeks. Feed: 120-150g/bird/day. Free-range eggs sell at ₹8-15 each. Income: ₹3,000-5,000/month.',
    goat:     'Goat farming (Bakri palan): Popular breeds — Jamunapari (milk), Barbari (meat+milk), Black Bengal (meat). Feed: grazing + 200-300g concentrate. Vaccinate PPR, Enterotoxaemia. Breeds twice a year, 2-3 kids each. Good profit in 6-8 months.',
    general:  'Integrated farming: Combine crop farming with livestock for year-round income. Cow dung → compost/biogas, goat manure → soil health, poultry litter → organic fertilizer. KCC now covers livestock loans too. Dairy + Crop farming can double farm income!',
  },

  // ── Crop rotation & intercropping ──
  rotation: {
    general:  'Best crop rotations for Indian farms: (1) Rice-Wheat (Indo-Gangetic) — add mung/dhaincha between (2) Soybean-Wheat (Central India) (3) Cotton-Wheat (Punjab) — add chickpea (4) Rice-Potato-Onion (triple cropping). Always include a legume — it fixes 50-100 kg N/ha for free!',
    intercropping:'Profitable intercropping: (1) Sugarcane + Potato/Onion/Garlic in initial months (2) Maize + Black gram (1:2 rows) (3) Cotton + Moong/Groundnut between rows (4) Pigeon pea + Soybean (1:3 rows). Intercropping increases income 30-50% and reduces pest pressure.',
  },

  // ── Seed varieties ──
  seeds: {
    wheat:    'Best wheat varieties 2026: HD-2967 (most popular, rust resistant), PBW-725 (early maturing, Punjab), DBW-222 (Bundelkhand), WH-1105 (Haryana). For late sowing (after Nov 25): HD-3086, PBW-373. Seed rate: 100 kg/ha normal, 125 kg/ha for late sowing.',
    rice:     'Best rice varieties: Pusa Basmati 1121 (export quality, long grain), Pusa-44 (high yield 80q/ha but water-heavy), PR-126 (short duration 123 days, saves water), Swarna (Eastern India). For DSR (Direct Seeded Rice): PR-126, CR Dhan 202.',
    general:  'Always use certified seeds bought from authorized dealers (IFFDC, state seed corps, IARI). Seed replacement rate should be: 33% for self-pollinated (wheat, rice), 50% for cross-pollinated (maize). Hybrid seeds: buy fresh each season. Check seed tag for germination % (should be >85%).',
  },

  // ── Weather & Seasons ──
  weather: {
    monsoon:  'Monsoon 2026 prediction: IMD forecasts normal to above-normal rainfall (96-106% of LPA). Southwest monsoon expected June 1 in Kerala. Key: (1) Prepare nurseries by May-end (2) Complete land prep before first rain (3) Store sufficient seed and fertilizer (4) Repair bunds and drainage.',
    frost:    'Frost protection for Rabi crops: (1) Light irrigation evening before expected frost (2) Smoke using damp straw at field boundaries (3) Avoid nitrogen application in frost-prone periods (4) Use plastic mulch for vegetables (5) Frost risk months: Dec-Jan in North India.',
    heatwave: 'Heatwave crop management: (1) Light, frequent irrigation (morning/evening) (2) Spray 1% KCl or Kaolin to reduce leaf temperature (3) Maintain crop residue mulch (4) Harvest mature crops early (5) Heatwave alert via Meghdoot app — install it!',
    general:  'Weather-smart farming: (1) Install Meghdoot app for 5-day forecasts (2) Follow IMD advisories on Kisan SMS Portal (3) Insure crops under PMFBY before every season (4) Build farm pond for supplemental irrigation (5) Practice mulching to reduce evaporation. Climate change means more extreme events — prepare!',
  },

  // ── MSP (Minimum Support Price) ──
  msp: {
    rabi:     'Rabi 2025-26 MSP: Wheat ₹2,275/q, Barley ₹1,850/q, Gram/Chana ₹5,440/q, Masoor ₹6,425/q, Mustard/Rapeseed ₹5,650/q, Safflower ₹5,800/q. Sell at nearest APMC mandi or through e-NAM platform.',
    kharif:   'Kharif 2026-27 MSP (announced): Paddy ₹2,450/q (+5%), Jowar ₹3,500/q, Bajra ₹2,625/q, Maize ₹2,225/q, Moong ₹8,682/q, Cotton Medium ₹7,121/q, Cotton Long ₹7,521/q, Soybean ₹4,892/q, Groundnut ₹6,377/q.',
    general:  'MSP is the government-guaranteed minimum price. Sell at APMC mandis where govt procurement happens. Register on e-NAM for online selling. For paddy/wheat: FCI does direct procurement. For pulses/oilseeds: NAFED procurement. Keep all receipts for PM-KISAN verification.',
  },

  // ── Market / Selling tips ──
  market: {
    selling:  'Smart selling tips: (1) Don\'t sell immediately at harvest — prices are lowest (2) Use warehouse receipt against storage (3) Check prices on Agmarknet/e-NAM before selling (4) Grade and clean produce — 10-15% higher price (5) Farmer Producer Organizations (FPOs) get better rates through collective bargaining.',
    valueadd: 'Value addition ideas: (1) Wheat → Atta/Suji/Maida — 40-60% more value (2) Tomato → Sauce/Ketchup — 3-5x value (3) Fruits → Jam/Pickles/Dried — 2-4x value (4) Milk → Paneer/Ghee — 2-3x value (5) Turmeric → Powder/Haldi — 3x value. Government gives 35% subsidy for processing units!',
    general:  'Check daily mandi prices on: (1) Agmarknet.gov.in (2) e-NAM app (3) Kisan Rath app for transport. Join or form an FPO for collective bargaining — get 15-20% better prices. Government also runs Price Stabilization Fund for pulses and onion.',
  },

  // ── Greetings / Conversational ──
  greeting: {
    general:  'Namaste! 🙏 I am Smart Krishi AI — your personal farming assistant. I can help you with: 🌾 Crop prices & MSP, 🌱 Planting & harvesting advice, 🐛 Disease & pest control, 🧪 Soil & fertilizer guidance, 💧 Irrigation tips, 🏛️ Government schemes, 🐄 Livestock advice, and much more! Just ask your question in any language.',
  },
};

// ── Topic detection with bilingual keywords ──
const TOPIC_PATTERNS = [
  { topic: 'greeting', keys: ['hello','hi','namaste','namaskar','help','what can you do','kya kar','नमस्ते','नमस्कार','मदद','सहायता','হ্যালো'] },
  { topic: 'planting', keys: ['plant','sow','sowing','bona','boai','when to plant','when to sow','seed rate','बोना','बुवाई','बीज','रोपाई','बोने का समय','कब बोये','কখন বুনব','ek0h'] },
  { topic: 'harvesting', keys: ['harvest','harvesting','katai','reaping','cut','when to harvest','कटाई','कब काटे','तोड़ाई','ফসল কাটা'] },
  { topic: 'diseases', keys: ['disease','blight','rust','rot','wilt','virus','mosaic','leaf curl','yellow','brown spot','pest','insect','bug','worm','caterpillar','aphid','whitefly','borer','mite','fungus','कीड़ा','रोग','बीमारी','कीट','फंगस','सड़न','झुलसा','फफूंद','পোকা','রোগ'] },
  { topic: 'soil', keys: ['soil','fertilizer','urea','dap','npk','potash','nutrient','deficiency','manure','compost','मिट्टी','खाद','उर्वरक','यूरिया','डीएपी','जैविक','পাট','মাটি','সার'] },
  { topic: 'irrigation', keys: ['water','irrigation','drip','sprinkler','flood','rain','borewell','canal','moisture','पानी','सिंचाई','ड्रिप','स्प्रिंकलर','बारिश','नमी','বৃষ্টি','জল'] },
  { topic: 'schemes', keys: ['scheme','subsidy','government','pm kisan','pmfby','kcc','kusum','enam','pmksy','soil health card','loan','credit','policy','सरकार','योजना','सब्सिडी','कर्ज़','ऋण','প্রকল্প','ভর্তুকি'] },
  { topic: 'organic', keys: ['organic','natural farming','jeevamrut','panchagavya','neem','vermicompost','bio','jaivik','प्राकृतिक','जैविक','जीवामृत','नीम','केंचुआ','পঞ্চগব্য','জৈব'] },
  { topic: 'storage', keys: ['storage','store','warehouse','godown','cold storage','post harvest','drying','losses','भंडारण','गोदाम','सूखाना','নুকসান','গুদাম'] },
  { topic: 'livestock', keys: ['cow','buffalo','goat','poultry','chicken','dairy','milk','cattle','feed','fodder','vaccine','गाय','भैंस','बकरी','मुर्गी','दूध','पशु','चारा','গরু','ছাগল','হাঁস'] },
  { topic: 'rotation', keys: ['rotation','intercrop','mixed crop','crop rotation','relay','फसल चक্র','अंतरवर्तीय','मिश্রত','ফসল পরিবর্তন'] },
  { topic: 'seeds', keys: ['seed','variety','hybrid','certified seed','best variety','बीज','किस्म','হাইব্রিড','বীজ'] },
  { topic: 'weather', keys: ['weather','forecast','monsoon','rain prediction','frost','heatwave','temperature','मौसम','बारिश','पाला','लू','তাপমাত্রা','বৃষ্টিপাত'] },
  { topic: 'msp', keys: ['msp','minimum support','support price','procurement','sarkar kharid','एमएसपी','समर্থন মূল্য','ন্যায্য দাম'] },
  { topic: 'market', keys: ['sell','selling','mandi','market','price','rate','bhav','cost','value addition','कीमत','भाव','मंडी','बेचना','দাম','বাজার','বিক্রি','قیمت'] },
];

// Crop name aliases (English + Hindi + common names)
const CROP_ALIASES = {
  wheat: ['wheat','gehu','gehun','गेहूं','গম'],
  rice: ['rice','dhan','chawal','चावल','धान','ধান','চাল'],
  maize: ['maize','corn','makka','मक्का','ভুট্টা'],
  cotton: ['cotton','kapas','rui','कपास','তুলা'],
  sugarcane: ['sugarcane','ganna','गन्ना','ইক্ষু','আখ'],
  mustard: ['mustard','sarso','sarson','सरसों','সরিষা'],
  potato: ['potato','aloo','alu','आलू','আলু'],
  tomato: ['tomato','tamatar','टमाटर','টমেটো'],
  onion: ['onion','pyaz','pyaj','प्याज','পেঁয়াজ'],
  soybean: ['soybean','soya','soyabean','सोयाबीन'],
  chickpea: ['chickpea','chana','gram','चना','ছোলা'],
  groundnut: ['groundnut','peanut','moongfali','मूंगफली','চীনাবাদাম'],
};

function detectCrop(text) {
  const lower = text.toLowerCase();
  for (const [crop, aliases] of Object.entries(CROP_ALIASES)) {
    if (aliases.some(a => lower.includes(a))) return crop;
  }
  return null;
}

function detectTopic(text) {
  const lower = text.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const pattern of TOPIC_PATTERNS) {
    const score = pattern.keys.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestMatch = pattern.topic; }
  }
  return bestMatch;
}

function getSeasonContext() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 5 && month <= 9) return { season: 'Kharif', seasonHi: 'खरीफ', hint: 'Monsoon season — focus on rice, maize, cotton, soybean, groundnut sowing.' };
  if (month >= 10 || month <= 1) return { season: 'Rabi', seasonHi: 'रबी', hint: 'Winter season — focus on wheat, mustard, chickpea, potato, onion sowing.' };
  return { season: 'Zaid/Summer', seasonHi: 'ज़ायद', hint: 'Summer season — focus on moong, watermelon, cucumber. Prepare for Kharif sowing.' };
}

function generateSmartResponse(text, sessionId, languageContext) {
  const lower = (text || '').toLowerCase();
  const topic = detectTopic(text);
  const crop = detectCrop(text);
  const seasonCtx = getSeasonContext();

  // Get or create session memory
  let session = conversationMemory.get(sessionId);
  if (!session || Date.now() - (session.lastActive || 0) > SESSION_TTL) {
    session = { history: [], lastCrop: '', lastTopic: '', lastActive: Date.now() };
  }
  session.lastActive = Date.now();

  // Use context from previous turn if current query is short/vague
  const effectiveCrop = crop || session.lastCrop;
  const effectiveTopic = topic || (lower.length < 20 ? session.lastTopic : null);

  // Update session memory
  if (crop) session.lastCrop = crop;
  if (topic) session.lastTopic = topic;
  session.history.push({ role: 'user', text, timestamp: Date.now() });
  conversationMemory.set(sessionId, session);

  let responseText = '';

  // ── Route to the right knowledge base ──
  if (effectiveTopic && FARMING_KB[effectiveTopic]) {
    const kb = FARMING_KB[effectiveTopic];
    if (effectiveCrop && kb[effectiveCrop]) {
      responseText = kb[effectiveCrop];
    } else if (kb.general) {
      responseText = kb.general;
    }
    // Add seasonal context for planting/harvesting
    if ((effectiveTopic === 'planting' || effectiveTopic === 'harvesting') && !responseText.includes(seasonCtx.season)) {
      responseText += `\n\n📅 Current season: ${seasonCtx.season} (${seasonCtx.seasonHi}) — ${seasonCtx.hint}`;
    }
  }
  // ── Price queries (special — pull live data) ──
  else if (lower.includes('price') || lower.includes('rate') || lower.includes('bhav') || lower.includes('भाव') || lower.includes('दाम') || lower.includes('কত') || lower.includes('দাম')) {
    const priceKey = Object.keys(BASELINE_PRICES).find(k => lower.includes(k.toLowerCase()) || lower.includes(BASELINE_PRICES[k].hindiName.toLowerCase()));
    if (priceKey) {
      const p = BASELINE_PRICES[priceKey];
      const live = generateLivePrices('Delhi').find(lp => lp.commodity === priceKey);
      responseText = `📊 **${priceKey} (${p.hindiName}) ${p.emoji}**\n• Current price: ₹${live?.price || p.base}/quintal\n• Today's change: ${live?.change > 0 ? '📈 +' : '📉 '}${live?.change || 0}%\n• Range: ₹${p.min} – ₹${p.max}/quintal\n• MSP (if applicable): Check government notifications.\n\n💡 Tip: Grade and clean your ${priceKey.toLowerCase()} before selling for 10-15% better price. Compare prices across mandis on e-NAM before selling!`;
    } else {
      const topCrops = generateLivePrices('Delhi').slice(0, 5).map(c => `${c.emoji} ${c.commodity}: ₹${c.price}/q (${c.change > 0 ? '+' : ''}${c.change}%)`).join('\n');
      responseText = `📊 **Today's Top Crop Prices (Delhi Mandi)**\n${topCrops}\n\n💡 Ask me about a specific crop for detailed pricing and selling tips!`;
    }
  }

  // Fallback — smart default with follow-up awareness
  if (!responseText) {
    // Check for vague follow-up references: "this", "that", "it", "tell me more", "how much", "when"
    const isFollowUp = /\b(this|that|it|these|those|more|also|and|tell me|how much|how many|when|kitna|कितना|इसमें|इसका|और|aur)\b/i.test(lower);
    
    if (isFollowUp && session.lastCrop) {
      // Try to infer topic from vague question about the remembered crop
      const cropName = session.lastCrop;
      if (lower.includes('fertilizer') || lower.includes('खाद') || lower.includes('nutrient') || lower.includes('urea') || lower.includes('how much')) {
        // Fertilizer question about remembered crop
        const cropInfo = SOIL_KNOWLEDGE.cropDatabase.find(c => c.name.toLowerCase() === cropName);
        if (cropInfo) {
          responseText = `🧪 **Fertilizer dose for ${cropInfo.name} (${cropInfo.nameHi}):**\n• Nitrogen (N): ${cropInfo.N} kg/ha — use Urea (split in 2-3 doses)\n• Phosphorus (P₂O₅): ${cropInfo.P} kg/ha — use DAP/SSP at sowing\n• Potassium (K₂O): ${cropInfo.K} kg/ha — use MOP at sowing\n\n💡 Pro tip: Always get a Soil Health Card test first — you may need less fertilizer than you think! Apply organic compost 5T/acre as base for best results.`;
        } else {
          responseText = FARMING_KB.soil?.general || FARMING_KB.greeting.general;
        }
      } else if (lower.includes('plant') || lower.includes('sow') || lower.includes('when') || lower.includes('कब')) {
        responseText = FARMING_KB.planting?.[cropName] || FARMING_KB.planting?.general || FARMING_KB.greeting.general;
      } else if (lower.includes('harvest') || lower.includes('कटाई')) {
        responseText = FARMING_KB.harvesting?.[cropName] || FARMING_KB.harvesting?.general || FARMING_KB.greeting.general;
      } else if (lower.includes('disease') || lower.includes('बीमारी') || lower.includes('रोग')) {
        responseText = FARMING_KB.diseases?.[cropName] || FARMING_KB.diseases?.general || FARMING_KB.greeting.general;
      } else {
        // Generic follow-up about the crop
        responseText = `I remember we were talking about **${cropName}**! What more would you like to know?\n\n🌱 Planting time & varieties\n🐛 Disease & pest control\n💰 Current market prices\n🧪 Fertilizer recommendations\n🌾 Harvesting tips\n\nJust ask your specific question!`;
      }
    } else if (effectiveCrop) {
      // User mentioned a crop but no clear topic
      responseText = `I can help you with **${effectiveCrop}**! What would you like to know?\n\n🌱 Planting time & varieties\n🐛 Disease & pest control\n💰 Current market prices\n🧪 Fertilizer recommendations\n🌾 Harvesting tips\n\nJust ask your specific question!`;
    } else {
      responseText = FARMING_KB.greeting.general;
    }
  }

  // Save AI response to session history
  session.history.push({ role: 'ai', text: responseText, timestamp: Date.now() });
  if (session.history.length > 20) session.history = session.history.slice(-20);
  conversationMemory.set(sessionId, session);

  return responseText;
}

app.post('/api/voice-ai', async (req, res) => {
  const { text, languageContext, sessionId: clientSessionId, conversationHistory } = req.body;
  const sessionId = clientSessionId || 'default';

  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' && process.env.OPENAI_API_KEY !== 'dummy_key';
  const hasGrok = process.env.GROK_API_KEY;
  const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_key';

  // Build conversation history for context
  const historyContext = (conversationHistory || [])
    .slice(-6)
    .map(m => `${m.type === 'user' ? 'Farmer' : 'AI'}: ${m.text}`)
    .join('\n');

  // Get live contextual data
  const seasonCtx = getSeasonContext();
  const detectedCrop = detectCrop(text);
  let priceContext = '';
  if (detectedCrop) {
    const prices = generateLivePrices('Delhi');
    const cropPrice = prices.find(p => p.commodity.toLowerCase() === detectedCrop);
    if (cropPrice) priceContext = `Current ${cropPrice.commodity} price: ₹${cropPrice.price}/quintal (${cropPrice.change > 0 ? '+' : ''}${cropPrice.change}% today).`;
  }

  const prompt = `You are "Smart Krishi AI" (स्मार्ट कृषि AI), India's most trusted agricultural assistant. You combine modern agricultural science with traditional Indian farming wisdom.

## Your Persona
- Warm, respectful, and encouraging — address the farmer as "Kisan ji" or equivalent
- Expert in Indian agriculture — crops, soil, weather, government schemes, livestock, organic farming
- You know current market prices, MSP rates, and government policies
- You give actionable, practical advice — not generic theory

## Context
- Current season: ${seasonCtx.season} (${seasonCtx.seasonHi}) — ${seasonCtx.hint}
- Current date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
${priceContext ? `- ${priceContext}` : ''}
${detectedCrop ? `- Farmer is asking about: ${detectedCrop}` : ''}

## Conversation History
${historyContext || '(New conversation)'}

## Current Question
Farmer: "${text}"

## Response Rules
1. **Language**: Reply ENTIRELY in "${languageContext || 'Hindi'}" script. If context is "हिंदी", write in Devanagari. If "বাংলা", write in Bengali script. Etc.
2. **Depth & Quality**: Provide comprehensive, highly detailed, and deeply intelligent answers. Do not limit response length. Act like a truly advanced, unbounded expert AI.
3. **Format**: Use markdown beautifully. Use **bolding** for keywords, bullet points (•) for lists, and clear step-by-step paragraphs. Use emojis thoughtfully for visual appeal.
4. **Content**: Give specific, actionable advice. Include exact numbers (chemical dosages, rates, timelines, MSP prices). Add related bonus tips to surprise and delight the farmer.
5. **Tone**: Conversational and highly respectful, like an elite agronomist talking to a fellow farmer. Use local crop/practice names.
6. If the question is NOT about farming, politely redirect: "I specialize in farming — let me help you with your crops!"

Respond now:`;

  let reply = '';
  let source = '';

  // Priority 1: OpenAI
  if (!reply && hasOpenAI) {
    try {
      const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openAI.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional farming assistant." },
          { role: "user", content: prompt }
        ],
      });
      reply = completion.choices[0].message.content;
      source = 'openai';
      console.log(`\n🤖 [VOICE AI] OpenAI response successful`);
    } catch (e) {
      console.error('OpenAI failed:', e.message);
    }
  }

  // Priority 2: Grok
  if (!reply && hasGrok) {
    try {
      const grokAI = new OpenAI({ apiKey: process.env.GROK_API_KEY, baseURL: 'https://api.x.ai/v1' });
      const completion = await grokAI.chat.completions.create({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: "You are a professional farming assistant API." },
          { role: "user", content: prompt }
        ],
      });
      reply = completion.choices[0].message.content;
      source = 'grok';
      console.log(`\n🤖 [VOICE AI] Grok response successful`);
    } catch (e) {
      console.error('Grok failed:', e.message);
    }
  }

  // Priority 3: Gemini
  if (!reply && hasGemini) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      reply = result.response.text();
      source = 'gemini';
      console.log(`\n🤖 [VOICE AI] Gemini response successful`);
    } catch (e) {
      console.error('Gemini failed:', e.message);
    }
  }

  // Final check: If none of the smart AIs succeeded, return a hard error, never predefined answers.
  if (!reply) {
    console.log(`\n🤖 [VOICE AI] All APIs failed!`);
    reply = `⚠️ I apologize, but my AI intelligence engine is currently unavailable because the provided API keys (OpenAI/Gemini) are either invalid, expired, or have exceeded their rate limits.\n\nPlease check your '.env' file and provide a valid API key to unlock my full intelligence. I will only provide accurate AI answers, not predefined fallbacks!`;
    source = 'error';
  }

  res.json({ success: true, reply, source });
});

app.listen(PORT, () => {
  console.log(`\n🌾 Smart Krishi API Server running on http://localhost:${PORT}`);
  console.log(`   Data.gov.in API: ${process.env.DATA_GOV_API_KEY ? '✅ Key configured' : '⚠️  No key - using simulation'}`);
  console.log(`   GNews API: ${process.env.GNEWS_API_KEY ? '✅ Key configured' : '⚠️  No key - using simulation'}`);
  console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Key configured' : '⚠️  No key - using simulation'}`);
  console.log(`   Endpoints:`);
  console.log(`     POST /api/auth/send-otp`);
  console.log(`     POST /api/auth/verify-otp`);
  console.log(`     POST /api/voice-ai`);
  console.log(`     GET  /api/market-prices?state=Delhi`);
  console.log(`     GET  /api/health\n`);
});
