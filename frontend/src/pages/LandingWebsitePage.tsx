import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { fetchSettings } from '../services/api';
import { Setting } from '../types';
import {
  WashingMachine,
  Sparkles,
  Truck,
  Clock,
  ShieldCheck,
  PhoneCall,
  MapPin,
  Mail,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Search,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShoppingBag,
  Shirt,
  DollarSign,
  Send,
  X,
  ExternalLink,
  Award,
  Layers,
  Percent,
} from 'lucide-react';

export const LandingWebsitePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [setting, setSetting] = useState<Setting | undefined>(undefined);

  // Modals & Dynamic UI states
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackOrderInput, setTrackOrderInput] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Pickup Form State
  const [pickupForm, setPickupForm] = useState({
    name: '',
    phone: '',
    address: '',
    service: 'Wash & Fold',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '10:00 AM - 01:00 PM',
    notes: '',
  });

  // Price Estimator State
  const [calcService, setCalcService] = useState<'kg' | 'dry' | 'iron' | 'shoe'>('kg');
  const [calcKg, setCalcKg] = useState<number>(3);
  const [calcItemsCount, setCalcItemsCount] = useState<number>(5);

  useEffect(() => {
    fetchSettings().then((res) => {
      if (res.success) setSetting(res.setting);
    });
  }, []);

  const shopName = setting?.shopName || 'IntelligentLaundry';
  const logoUrl = setting?.logoUrl && !setting.logoUrl.includes('unsplash.com') ? setting.logoUrl : '/logo.jpg';
  const phone = setting?.phone || '+91 98765 43210';
  const email = setting?.email || 'contact@intelligentlaundry.com';
  const address = setting?.address || '123 Sparkle Avenue, Suite 4B, Commercial Hub';

  // Handle Pickup Booking Form Submit
  const handlePickupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupForm.name || !pickupForm.phone || !pickupForm.address) {
      showToast('Please fill in your name, phone number, and address.', 'error');
      return;
    }

    const waMsg = `Hello *${shopName}*, I would like to book a Doorstep Pickup! 🧺\n\n👤 *Customer Name*: ${pickupForm.name}\n📞 *Mobile*: ${pickupForm.phone}\n📍 *Address*: ${pickupForm.address}\n🧺 *Service*: ${pickupForm.service}\n📅 *Preferred Date*: ${pickupForm.date}\n⏰ *Time Slot*: ${pickupForm.timeSlot}\n📝 *Notes*: ${pickupForm.notes || 'N/A'}`;
    const cleanPhone = phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

    showToast('✅ Pickup request initiated! Redirecting to WhatsApp...', 'success');
    setShowPickupModal(false);
    window.open(waUrl, '_blank');
  };

  // Handle Quick Track Order
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderInput.trim()) {
      showToast('Please enter your order number', 'error');
      return;
    }
    const cleanNumber = trackOrderInput.trim();
    navigate(`/receipt/${encodeURIComponent(cleanNumber)}?r=${encodeURIComponent(cleanNumber)}`);
  };

  // Price Estimator Math
  const calculateEstimatedPrice = () => {
    if (calcService === 'kg') return calcKg * 60; // ₹60/Kg
    if (calcService === 'dry') return calcItemsCount * 180; // ₹180 avg dry clean
    if (calcService === 'iron') return calcItemsCount * 25; // ₹25 avg steam press
    if (calcService === 'shoe') return calcItemsCount * 250; // ₹250 shoe restoration
    return 0;
  };

  const servicesList = [
    {
      title: 'Wash & Fold / Wash & Iron',
      category: 'Regular Laundry',
      price: 'From ₹60 / Kg',
      image: '/hero_laundry.jpg',
      badge: 'Most Popular',
      desc: 'Complete wash cycle with fabric softeners, anti-bacterial rinse, and neat folding or crisp steam ironing.',
      features: ['Hypo-allergenic Detergents', 'Color Separation', 'Hygienic Washing', 'Fresh Fragrance'],
    },
    {
      title: 'Professional Dry Cleaning',
      category: 'Garment Care',
      price: 'From ₹120 / Piece',
      image: '/dry_cleaning_care.jpg',
      badge: 'Expert Care',
      desc: 'Eco-friendly chemical-free dry cleaning for suits, blazers, designer sarees, silk, and delicate ethnic wear.',
      features: ['Gentle Organic Solvents', 'Stain Removal Specialist', 'Fabric Lifespan Protection', 'Garment Bag Delivery'],
    },
    {
      title: 'Luxury Shoe & Sneaker Care',
      category: 'Specialty Cleaning',
      price: 'From ₹249 / Pair',
      image: '/shoe_laundry.jpg',
      badge: 'Restoration',
      desc: 'Deep hand-scrub cleaning, sole de-yellowing, suede brush care, and anti-bacterial odor elimination.',
      features: ['Deep Sole & Upper Scrub', 'Suede & Leather Polish', 'Deodorizing Treatment', 'Original Shape Retention'],
    },
    {
      title: 'Express Doorstep Delivery',
      category: '24-Hour Express',
      price: 'Same Day Pickup',
      image: '/pickup_delivery.jpg',
      badge: '24h Express',
      desc: 'Superfast turnaround for urgent travel plans, events, or last-minute meetings. Pickup to delivery in 24h.',
      features: ['Free Pickup Over ₹300', 'Live GPS Driver Alert', 'Convenient Time Slots', 'Doorstep Receipt'],
    },
  ];

  const faqs = [
    {
      q: 'How does doorstep pickup and delivery work?',
      a: 'Simply click "Book Doorstep Pickup", choose your preferred date and time slot, and our pickup executive will arrive at your address with eco-friendly laundry bags. After processing, we deliver crisp clothes back to your door.',
    },
    {
      q: 'How are my clothes separated and washed?',
      a: 'We strictly follow garment tag care instructions. Dark colors, whites, delicates, and heavy fabrics are separated into distinct loads. We never mix garments from different customers.',
    },
    {
      q: 'What is the turnaround time for laundry and dry cleaning?',
      a: 'Standard wash & fold orders take 24 to 48 hours. Professional dry cleaning takes 48 hours. Express 24-hour delivery is also available for urgent requests.',
    },
    {
      q: 'How can I track my live order status?',
      a: 'You receive instant WhatsApp receipt links for every order! You can also type your order number in the "Track Order" button on our website to see real-time updates.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoUrl} alt={shopName} className="h-10 w-auto object-contain rounded-xl border border-slate-800 shadow-md" />
            <div>
              <span className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                {shopName} <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              </span>
              <p className="text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">Smart & Eco Garment Care</p>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-extrabold text-slate-300">
            <a href="#services" className="hover:text-brand-400 transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-brand-400 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-brand-400 transition-colors">Estimator</a>
            <a href="#why-us" className="hover:text-brand-400 transition-colors">Why Us</a>
            <a href="#faq" className="hover:text-brand-400 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTrackModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              <Search className="w-3.5 h-3.5 text-brand-400" />
              <span>Track Order</span>
            </button>

            <button
              onClick={() => setShowPickupModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-brand-600/30 active:scale-95 transition-all flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Book Pickup</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              title="Staff / Admin POS Access"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <WashingMachine className="w-4.5 h-4.5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-brand-600/20 via-cyan-600/20 to-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/80 border border-brand-800/60 text-brand-300 text-xs font-extrabold shadow-inner">
              <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
              <span>#1 Rated Eco-Friendly Laundry & Dry Cleaning</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              Spotless Care for Your <span className="bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Garments & Shoes.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              Say goodbye to laundry day hassle. Professional wash & fold, dry cleaning, steam pressing, and sneaker restoration with free doorstep pickup and 24-hour express delivery.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => setShowPickupModal(true)}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-cyan-600 to-brand-500 hover:from-brand-500 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-brand-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <Truck className="w-5 h-5" />
                <span>Schedule Doorstep Pickup</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowTrackModal(true)}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4.5 h-4.5 text-brand-400" />
                <span>Track Receipt Status</span>
              </button>
            </div>

            {/* Feature Metrics */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-xl mx-auto lg:mx-0">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">10,000+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Garments Care</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-brand-400">99.8%</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On-Time Pickup</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center lg:justify-start gap-1">
                  4.9 <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Rating</p>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl shadow-brand-950/50 group">
              <img
                src="/hero_laundry.jpg"
                alt="Intelligent Laundry Care"
                className="w-full h-[380px] sm:h-[460px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              {/* Floating Feature Glass Pill */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">100% Fabric Safety Protection</h4>
                  <p className="text-[11px] text-slate-400">German eco-detergents & gentle low-heat drying cycles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SERVICES SHOWCASE SECTION */}
      {/* ========================================================================= */}
      <section id="services" className="py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-xs font-bold">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Our Specialised Services</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Premium Garment Care Solutions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              From everyday wash & fold to luxury dry cleaning and sneaker care, we deliver pristine cleanliness every time.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesList.map((serv, idx) => (
              <div
                key={idx}
                className="glass-card rounded-3xl overflow-hidden border border-slate-800/80 hover:border-brand-500/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={serv.image}
                      alt={serv.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-600/90 text-white font-extrabold text-[10px] backdrop-blur-md shadow-md">
                      {serv.badge}
                    </span>
                    <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-slate-900/90 text-brand-300 font-black text-xs border border-slate-800 backdrop-blur-md">
                      {serv.price}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-400">{serv.category}</p>
                    <h3 className="text-base font-black text-white group-hover:text-brand-300 transition-colors">{serv.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{serv.desc}</p>

                    <div className="pt-2 space-y-1.5 border-t border-slate-800/60">
                      {serv.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => {
                      setPickupForm({ ...pickupForm, service: serv.title });
                      setShowPickupModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 border border-slate-800 hover:border-brand-500 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span>Book This Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (4 EASY STEPS) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800/60 text-emerald-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simple 4-Step Process</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              How Doorstep Laundry Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clean clothes delivered to your doorstep in 4 simple stress-free steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Schedule Pickup',
                desc: 'Book your convenient pickup date and time slot online or via WhatsApp.',
                icon: Calendar,
                color: 'from-brand-600 to-cyan-600',
              },
              {
                step: '02',
                title: 'Doorstep Collection',
                desc: 'Our driver collects your clothes at your home or office in eco-friendly bags.',
                icon: Truck,
                color: 'from-cyan-600 to-emerald-600',
              },
              {
                step: '03',
                title: 'Expert Care',
                desc: 'Washed, dry cleaned, or steam pressed with strict tag care and tag tracking.',
                icon: WashingMachine,
                color: 'from-emerald-600 to-amber-600',
              },
              {
                step: '04',
                title: 'Fresh Delivery',
                desc: 'Delivered back crisp, neatly folded, or on hangers right to your door.',
                icon: CheckCircle2,
                color: 'from-amber-600 to-brand-600',
              },
            ].map((st, idx) => {
              const IconComp = st.icon;
              return (
                <div key={idx} className="glass-card p-6 rounded-3xl border border-slate-800/80 relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${st.color} flex items-center justify-center text-white shadow-lg`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-800 tracking-wider">{st.step}</span>
                  </div>

                  <h3 className="text-base font-black text-white">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE PRICE ESTIMATOR */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950 border border-brand-800/60 text-brand-300 text-xs font-bold">
              <DollarSign className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant Price Estimator</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Transparent & Affordable Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Calculate your estimated laundry cost in real-time before booking.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800/80 space-y-6">
            {/* Service selector tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
              {[
                { id: 'kg', label: 'Wash & Fold (Kg)' },
                { id: 'dry', label: 'Dry Cleaning' },
                { id: 'iron', label: 'Steam Pressing' },
                { id: 'shoe', label: 'Shoe Laundry' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCalcService(tab.id as any)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    calcService === tab.id
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Slider / Controls */}
            {calcService === 'kg' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>Weight (Kg):</span>
                  <span className="text-base text-brand-400 font-black">{calcKg} Kg</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={calcKg}
                  onChange={(e) => setCalcKg(parseInt(e.target.value))}
                  className="w-full accent-brand-500 bg-slate-800 rounded-lg h-2"
                />
                <p className="text-[11px] text-slate-500">Rate: ₹60 / Kg (Includes washing, detergent, softening & neat folding)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>Number of Garments / Pairs:</span>
                  <span className="text-base text-brand-400 font-black">{calcItemsCount} Items</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={calcItemsCount}
                  onChange={(e) => setCalcItemsCount(parseInt(e.target.value))}
                  className="w-full accent-brand-500 bg-slate-800 rounded-lg h-2"
                />
                <p className="text-[11px] text-slate-500">
                  {calcService === 'dry' && 'Average Rate: ₹180 / Piece (Organic dry cleaning & hanger packaging)'}
                  {calcService === 'iron' && 'Average Rate: ₹25 / Piece (Crisp steam pressing)'}
                  {calcService === 'shoe' && 'Average Rate: ₹250 / Pair (Deep scrub & shoe whitening)'}
                </p>
              </div>
            )}

            {/* Total Estimated Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs text-slate-400">Estimated Total Cost</p>
                <p className="text-3xl font-black text-white">₹{calculateEstimatedPrice()}</p>
                <p className="text-[10px] text-emerald-400 font-semibold">✨ Free Pickup & Delivery included for orders above ₹300</p>
              </div>

              <button
                onClick={() => setShowPickupModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Book Pickup Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. WHY CHOOSE US */}
      {/* ========================================================================= */}
      <section id="why-us" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-800/60 text-amber-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Why IntelligentLaundry</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              The Smarter Choice for Your Clothes
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: '100% Eco-Friendly Solvents',
                desc: 'German non-toxic detergents safe for baby clothes, sensitive skin, and fine silk fabrics.',
                icon: ShieldCheck,
              },
              {
                title: 'Live WhatsApp Digital Receipts',
                desc: 'Receive instant WhatsApp receipts and direct links to track live order processing status.',
                icon: MessageSquare,
              },
              {
                title: 'Separate Washing Cycles',
                desc: 'Your clothes are washed individually in separate sanitized machines. Zero mixing with others.',
                icon: WashingMachine,
              },
              {
                title: 'Steam Pressing & Hanger Care',
                desc: 'Wrinkle-free high pressure steam pressing that preserves fabric life and vibrant colors.',
                icon: Shirt,
              },
              {
                title: 'Shoe & Sneaker Restoration',
                desc: 'Specialized footwear spa restoring upper leather, suede, and sole original brightness.',
                icon: Sparkles,
              },
              {
                title: 'Punctual Doorstep Pickup',
                desc: 'Our driver arrives right on your selected time slot. No waiting around or shop visits.',
                icon: Clock,
              },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="glass-card p-6 rounded-3xl border border-slate-800/80 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ ACCORDION SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Have questions before booking? We have got you covered.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="glass-card rounded-2xl border border-slate-800 overflow-hidden cursor-pointer transition-all"
                >
                  <div className="p-4 sm:p-5 flex justify-between items-center text-xs sm:text-sm font-extrabold text-white">
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid md:grid-cols-4 gap-8 text-xs">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt={shopName} className="h-9 w-auto rounded-lg border border-slate-800" />
              <span className="text-base font-black text-white">{shopName}</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Premium laundry, dry cleaning, and shoe restoration services delivered to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">Quick Navigation</h4>
            <p><a href="#services" className="hover:text-brand-400">Our Services</a></p>
            <p><a href="#pricing" className="hover:text-brand-400">Price Estimator</a></p>
            <p><a href="#how-it-works" className="hover:text-brand-400">How It Works</a></p>
            <p><button onClick={() => setShowTrackModal(true)} className="hover:text-brand-400">Track Order</button></p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">Store Contact</h4>
            <p className="flex items-center gap-2"><PhoneCall className="w-3.5 h-3.5 text-brand-400" /> {phone}</p>
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-brand-400" /> {email}</p>
            <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" /> {address}</p>
          </div>

          {/* Timings & Admin */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase text-[11px] tracking-wider">Working Hours</h4>
            <p className="text-slate-300">Monday - Sunday: 08:00 AM - 09:00 PM</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <WashingMachine className="w-4 h-4 text-brand-400" />
              <span>Admin / Staff POS Login</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 mt-8 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-600">
          <p>© {new Date().getFullYear()} {shopName}. All rights reserved.</p>
          <p>Powered by IntelligentLaundry Operating System</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. BOOK PICKUP MODAL */}
      {/* ========================================================================= */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-400" /> Book Doorstep Pickup
              </h3>
              <button
                onClick={() => setShowPickupModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePickupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={pickupForm.name}
                  onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={pickupForm.phone}
                  onChange={(e) => setPickupForm({ ...pickupForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Service Needed</label>
                <select
                  value={pickupForm.service}
                  onChange={(e) => setPickupForm({ ...pickupForm, service: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-brand-500"
                >
                  <option value="Wash & Fold">Wash & Fold (By Weight)</option>
                  <option value="Wash & Iron">Wash & Steam Iron</option>
                  <option value="Dry Cleaning">Professional Dry Cleaning</option>
                  <option value="Shoe Laundry">Shoe & Sneaker Restoration</option>
                  <option value="Household Care">Curtains / Blankets Care</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Pickup Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Apartment, Flat No., Street, Landmark"
                  value={pickupForm.address}
                  onChange={(e) => setPickupForm({ ...pickupForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={pickupForm.date}
                    onChange={(e) => setPickupForm({ ...pickupForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Time Slot</label>
                  <select
                    value={pickupForm.timeSlot}
                    onChange={(e) => setPickupForm({ ...pickupForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-brand-500"
                  >
                    <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM</option>
                    <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM</option>
                    <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Confirm Pickup via WhatsApp</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. TRACK ORDER MODAL */}
      {/* ========================================================================= */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-400" /> Track Receipt Status
              </h3>
              <button
                onClick={() => setShowTrackModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <p className="text-xs text-slate-400">Enter your Order Number (e.g. ORD-417/26 or 417):</p>
              <input
                type="text"
                required
                placeholder="e.g. ORD-417/26"
                value={trackOrderInput}
                onChange={(e) => setTrackOrderInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>View Digital Receipt</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
