import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Shirt,
  Scissors,
  Layers,
  Award,
  Phone,
  Flame,
  Droplets,
  Sun,
  Crown,
  Feather,
} from 'lucide-react';

export const LandingWebsitePage: React.FC = () => {
  const navigate = useNavigate();
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    fetchSettings().then((res) => {
      if (res.success) setSetting(res.setting);
    });
  }, []);

  const shopName = 'IntelligentLaundry';
  const logoUrl = setting?.logoUrl && !setting.logoUrl.includes('unsplash.com') ? setting.logoUrl : '/logo.jpg';
  const phone = setting?.phone || '+91 98765 43210';
  const cleanPhone = phone.replace(/\D/g, '');
  const email = setting?.email || 'contact@intelligentlaundry.com';
  const address = setting?.address || '123 Sparkle Avenue, Suite 4B, Commercial Hub';

  // All 11 Services
  const services11 = [
    {
      id: 'wash-fold',
      title: 'Wash and Fold',
      category: 'Daily Laundry',
      icon: WashingMachine,
      image: '/hero_laundry.jpg',
      badge: 'Popular',
      desc: 'Hygienic machine wash with organic softeners, color-segregation, anti-bacterial rinse, and neat precision folding.',
      features: ['Separated Customer Loads', 'Hypoallergenic Detergents', 'Anti-Bacterial Treatment', 'Neat Folded Packaging'],
    },
    {
      id: 'wash-iron',
      title: 'Wash and Iron',
      category: 'Daily Care',
      icon: Droplets,
      image: '/hero_laundry.jpg',
      badge: 'Complete Care',
      desc: 'Thorough fabric wash followed by high-pressure steam pressing to keep your daily wear fresh and wrinkle-free.',
      features: ['Sanitized Water Wash', 'Steam Press Finish', 'Hanger or Fold Option', 'Fabric Softening'],
    },
    {
      id: 'steam-iron',
      title: 'Steam Ironing',
      category: 'Pressing',
      icon: Flame,
      image: '/dry_cleaning_care.jpg',
      badge: 'Crisp Finish',
      desc: 'Wrinkle-free steam pressing using temperature-controlled ironers that protect delicate fibers and colors.',
      features: ['Zero Burn Risk', 'Crisp Crease Alignment', 'Suit & Formal Care', 'On-Hanger Packaging'],
    },
    {
      id: 'dry-cleaning',
      title: 'Dry Cleaning',
      category: 'Premium Care',
      icon: Sparkles,
      image: '/dry_cleaning_care.jpg',
      badge: 'Expert Dry Clean',
      desc: 'Gentle chemical-free dry cleaning for suits, blazers, silk sarees, heavy lehengas, and designer garments.',
      features: ['Non-Toxic Solvents', 'Stain Removal Treatment', 'Color Vibrancy Protection', 'Garment Bag Delivery'],
    },
    {
      id: 'shoe-laundry',
      title: 'Shoe Laundry',
      category: 'Footwear Care',
      icon: Crown,
      image: '/shoe_laundry.jpg',
      badge: 'Restoration',
      desc: 'Deep hand-scrubbing, sole whitening, suede & leather polishing, and anti-bacterial deodorizing for footwear.',
      features: ['Sneaker & Leather Care', 'Sole Whitening Treatment', 'Deodorization & Polish', 'Shape Preservation'],
    },
    {
      id: 'starching',
      title: 'Starching',
      category: 'Stiffening',
      icon: Sun,
      badge: 'Traditional',
      desc: 'Crisp stiff starching for cotton shirts, dhotis, uniform trousers, and sarees to maintain a formal posture.',
      features: ['Natural Rice/Maize Starch', 'Custom Stiffness Levels', 'Uniform Finishing', 'Smooth Texture'],
    },
    {
      id: 'bleaching-stain',
      title: 'Bleaching & Stain Removal',
      category: 'Spot Treatment',
      icon: ShieldCheck,
      badge: 'Spot Treatment',
      desc: 'Specialized enzyme stain treatment for oil, ink, wine, and grease stains along with white fabric brightening.',
      features: ['Targeted Enzyme Spotting', 'Safe White Brightening', 'Zero Color Bleeding', 'Gentle Pre-Soak'],
    },
    {
      id: 'curtains-household',
      title: 'Curtains & Household Care',
      category: 'Home Fabrics',
      icon: Layers,
      image: '/pickup_delivery.jpg',
      badge: 'Heavy Fabric',
      desc: 'Deep steam washing and sanitization for heavy window curtains, bedsheets, blankets, duvets, and sofa covers.',
      features: ['Dust Mite Removal', 'Heavy Load Washing', 'High-Temp Steam Dry', 'Fresh Home Aroma'],
    },
    {
      id: 'darning-alterations',
      title: 'Darning & Garment Alterations',
      category: 'Mending',
      icon: Scissors,
      badge: 'Garment Care',
      desc: 'Professional invisible darning, seam stitching, button replacement, zip repairs, and size fitting alterations.',
      features: ['Invisible Darning', 'Zip & Button Repairs', 'Precision Fitting', 'Tear Reinforcement'],
    },
    {
      id: 'leather-jacket',
      title: 'Leather & Jacket Care',
      category: 'Specialty Wear',
      icon: Feather,
      badge: 'Luxury Care',
      desc: 'Nourishing leather conditioner treatment, mold removal, and restoration for leather jackets, coats & bags.',
      features: ['Moisture Conditioning', 'Color Restoration', 'Fungus & Mold Scrub', 'Supple Finish'],
    },
    {
      id: 'express-delivery',
      title: 'Express 24-Hour Delivery',
      category: 'Priority Service',
      icon: Zap,
      image: '/pickup_delivery.jpg',
      badge: '24h Express',
      desc: 'Same-day urgent priority turnaround for business travelers, events, weddings, and emergency laundry needs.',
      features: ['24h Rapid Turnaround', 'Priority Machine Slot', 'Direct Doorstep Pickup', 'Express Delivery'],
    },
  ];

  const faqs = [
    {
      q: 'How do I book a laundry service?',
      a: 'Simply call us directly on ' + phone + '! You can also tap any "Call Now" button on this website to talk to our store team immediately.',
    },
    {
      q: 'Do you provide doorstep pickup and delivery?',
      a: 'Yes! We offer doorstep pickup and delivery across the city. Call our phone number to schedule your convenient time slot.',
    },
    {
      q: 'Are your detergents safe for baby clothes and sensitive skin?',
      a: 'Absolutely. We use 100% hypo-allergenic, eco-friendly German detergents that are tough on stains but gentle on skin.',
    },
    {
      q: 'What is the turnaround time for laundry and dry cleaning?',
      a: 'Standard wash & fold takes 24 to 48 hours. Dry cleaning takes 48 hours. We also provide Express 24-Hour Delivery for urgent needs.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src={logoUrl} alt={shopName} className="h-9 sm:h-10 w-auto object-contain rounded-xl border border-slate-800 shadow-md" />
            <div>
              <span className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                {shopName} <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              </span>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 -mt-0.5 tracking-wider uppercase">Smart & Eco Laundry</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-extrabold text-slate-300">
            <a href="#services" className="hover:text-brand-400 transition-colors">Our 11 Services</a>
            <a href="#why-us" className="hover:text-brand-400 transition-colors">Why Choose Us</a>
            <a href="#faq" className="hover:text-brand-400 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-brand-400 transition-colors">Contact</a>
          </nav>

          {/* Call CTAs & POS Link */}
          <div className="flex items-center gap-2.5">
            <a
              href={`tel:${cleanPhone}`}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-brand-600/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
              <span>Call Now</span>
            </a>

            <button
              onClick={() => navigate('/dashboard')}
              title="Staff / Admin POS Access"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <WashingMachine className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-8 sm:pt-14 pb-16 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[350px] bg-gradient-to-r from-brand-600/25 via-cyan-600/25 to-emerald-600/25 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-950/90 border border-brand-800/70 text-brand-300 text-[11px] sm:text-xs font-extrabold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" />
              <span>Premium Eco-Friendly Garment Care</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Professional Garment Care by <span className="bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">{shopName}</span>
            </h1>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              Experience world-class garment cleaning, organic dry cleaning, steam pressing, shoe restoration, and heavy household fabric care. 11 dedicated services for every fabric type.
            </p>

            {/* Call Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <a
                href={`tel:${cleanPhone}`}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-brand-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5"
              >
                <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Call Directly to Book: {phone}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Inquiry</span>
              </a>
            </div>

            {/* Highlights Bar */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <p className="text-lg sm:text-2xl font-black text-white">11+</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expert Services</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-black text-brand-400">100%</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fabric Safety</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-black text-amber-400 flex items-center justify-center lg:justify-start gap-1">
                  4.9 <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Rating</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl shadow-brand-950/50 group">
              <img
                src="/hero_laundry.jpg"
                alt="IntelligentLaundry Store"
                className="w-full h-[280px] sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{shopName} Care Standard</h4>
                  <p className="text-[10px] text-slate-400">Eco-friendly solvents & individualized sanitization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. OUR 11 SERVICES SHOWCASE */}
      {/* ========================================================================= */}
      <section id="services" className="py-14 sm:py-18 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          {/* Header */}
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-xs font-bold">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Service Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Our 11 Specialized Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Explore our complete range of garment care solutions crafted for every apparel and fabric need.
            </p>
          </div>

          {/* 11 Services Grid (Mobile Optimized) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services11.map((serv, idx) => {
              const IconComponent = serv.icon;
              return (
                <div
                  key={serv.id}
                  className="glass-card p-5 rounded-3xl border border-slate-800/80 hover:border-brand-500/50 transition-all group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600/20 to-cyan-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 text-brand-300 font-extrabold text-[10px] border border-slate-800">
                        Service #{idx + 1}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-400">{serv.category}</p>
                      <h3 className="text-base font-black text-white group-hover:text-brand-300 transition-colors">{serv.title}</h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{serv.desc}</p>

                    {/* Features list */}
                    <div className="pt-2 space-y-1 border-t border-slate-800/60">
                      {serv.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Call Button */}
                  <a
                    href={`tel:${cleanPhone}`}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 border border-slate-800 hover:border-brand-500 text-xs font-extrabold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-brand-400 group-hover:text-white" />
                    <span>Call Store for Details</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. WHY CHOOSE INTELLIGENTLAUNDRY */}
      {/* ========================================================================= */}
      <section id="why-us" className="py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 border border-amber-800/60 text-amber-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Why {shopName} is the Best Choice
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                title: '100% Eco-Friendly Detergents',
                desc: 'Non-toxic, hypoallergenic German detergents safe for baby clothes and sensitive skin.',
                icon: ShieldCheck,
              },
              {
                title: 'Separate Customer Washing',
                desc: 'Your clothes are washed in individual sanitized machines with zero mixing.',
                icon: WashingMachine,
              },
              {
                title: 'Organic Dry Cleaning',
                desc: 'Gentle dry cleaning preserving delicate embroidery, silk, sarees & suit fabrics.',
                icon: Sparkles,
              },
              {
                title: 'High-Pressure Steam Pressing',
                desc: 'Wrinkle-free steam pressing that keeps formal wear sharp without fabric burn risks.',
                icon: Flame,
              },
              {
                title: 'Footwear & Sneaker Restoration',
                desc: 'Deep hand-scrub footwear laundry restoring upper leather, suede, and sole brightness.',
                icon: Crown,
              },
              {
                title: 'Punctual Store Service & Support',
                desc: 'Friendly staff and prompt response for all your clothing and alteration queries.',
                icon: Clock,
              },
            ].map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-800/80 space-y-3">
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
      {/* 5. FAQ ACCORDION SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="py-14 sm:py-18 bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Common questions about {shopName} services.</p>
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
      {/* 6. CALL STORE BANNER & FOOTER */}
      {/* ========================================================================= */}
      <section id="contact" className="py-14 bg-gradient-to-r from-brand-950 via-slate-950 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-3xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 mx-auto">
            <PhoneCall className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">Have Garments to Clean?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Call <span className="font-extrabold text-white">{shopName}</span> directly to arrange service or ask any garment care questions!
          </p>
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-black text-sm sm:text-base shadow-xl shadow-brand-600/30 active:scale-95 transition-all"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Us Now: {phone}</span>
          </a>
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid md:grid-cols-3 gap-8 text-xs">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt={shopName} className="h-9 w-auto rounded-lg border border-slate-800" />
              <span className="text-base font-black text-white">{shopName}</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Smart & Eco Garment Cleaning, Dry Cleaning, Steam Pressing & Footwear Restoration.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-white uppercase text-[11px] tracking-wider mb-2">Store Contact</h4>
            <p className="flex items-center gap-2"><PhoneCall className="w-3.5 h-3.5 text-brand-400" /> {phone}</p>
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-brand-400" /> {email}</p>
            <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" /> {address}</p>
          </div>

          {/* Timings & Admin POS */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase text-[11px] tracking-wider">Working Hours</h4>
            <p className="text-slate-300">Monday - Sunday: 08:00 AM - 09:00 PM</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2"
            >
              <WashingMachine className="w-4 h-4 text-brand-400" />
              <span>Admin / Staff POS Login</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 mt-8 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-600">
          <p>© {new Date().getFullYear()} {shopName}. All rights reserved.</p>
          <p>Powered by IntelligentLaundry Operating System</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 7. FLOATING MOBILE CALL BUTTON (STICKY BOTTOM-RIGHT) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <a
          href={`tel:${cleanPhone}`}
          className="w-13 h-13 rounded-full bg-gradient-to-r from-emerald-500 to-brand-600 text-white shadow-2xl flex items-center justify-center border-2 border-slate-900 active:scale-90 transition-transform shadow-emerald-950/50"
        >
          <PhoneCall className="w-6 h-6 animate-pulse" />
        </a>
      </div>
    </div>
  );
};
