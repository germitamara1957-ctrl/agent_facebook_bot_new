import React, { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, ShoppingBag, Calendar, Radio, Bell, Globe, 
  CheckCircle2, ChevronRight, Menu, X, ArrowRight, Star,
  ShieldCheck, Zap, TrendingUp, Users, Check, Loader2
} from "lucide-react";

// ─── Live Plans from API ──────────────────────────────────────────────────────
interface ApiPlan {
  id: number; name: string; displayName: string; priceDzd: number;
  aiConversationsLimit: number; productsLimit: number; providersLimit: number;
  broadcastLimit: number; appointmentsEnabled: number; leadsEnabled: number;
  analyticsAdvanced: number; multiPage: number; isActive: number;
}

function buildFeaturesAr(p: ApiPlan): string[] {
  const fmt = (n: number, unit: string, unlimitedLabel: string) =>
    n === -1 ? unlimitedLabel : n === 0 ? `بدون ${unit}` : `${n.toLocaleString("ar")} ${unit}`;
  const feats = [
    fmt(p.aiConversationsLimit, "محادثة", "محادثات غير محدودة"),
    fmt(p.productsLimit, "منتج", "منتجات غير محدودة"),
  ];
  if (p.broadcastLimit !== 0) feats.push(fmt(p.broadcastLimit, "بث تسويقي", "بث غير محدود"));
  if (p.appointmentsEnabled) feats.push("حجز المواعيد");
  if (p.leadsEnabled) feats.push("إدارة العملاء المحتملين");
  if (p.analyticsAdvanced) feats.push("تحليلات متقدمة");
  if (p.multiPage) feats.push("صفحات متعددة");
  else feats.push("صفحة واحدة");
  return feats;
}

function buildFeaturesFr(p: ApiPlan): string[] {
  const fmt = (n: number, unit: string, ul: string) =>
    n === -1 ? ul : n === 0 ? `Sans ${unit}` : `${n.toLocaleString()} ${unit}`;
  const feats = [
    fmt(p.aiConversationsLimit, "messages", "Messages illimités"),
    fmt(p.productsLimit, "produits", "Produits illimités"),
  ];
  if (p.broadcastLimit !== 0) feats.push(fmt(p.broadcastLimit, "broadcasts", "Broadcasts illimités"));
  if (p.appointmentsEnabled) feats.push("Prise de RDV");
  if (p.leadsEnabled) feats.push("Gestion des leads");
  if (p.analyticsAdvanced) feats.push("Analytiques avancés");
  if (p.multiPage) feats.push("Multi-pages");
  else feats.push("1 page");
  return feats;
}

function buildFeaturesEn(p: ApiPlan): string[] {
  const fmt = (n: number, unit: string, ul: string) =>
    n === -1 ? ul : n === 0 ? `No ${unit}` : `${n.toLocaleString()} ${unit}`;
  const feats = [
    fmt(p.aiConversationsLimit, "conversations", "Unlimited conversations"),
    fmt(p.productsLimit, "products", "Unlimited products"),
  ];
  if (p.broadcastLimit !== 0) feats.push(fmt(p.broadcastLimit, "broadcasts", "Unlimited broadcasts"));
  if (p.appointmentsEnabled) feats.push("Appointment booking");
  if (p.leadsEnabled) feats.push("Leads management");
  if (p.analyticsAdvanced) feats.push("Advanced analytics");
  if (p.multiPage) feats.push("Multi-page");
  else feats.push("1 page");
  return feats;
}

function apiPlanToDisplay(p: ApiPlan, lang: "ar" | "fr" | "en") {
  const priceStr = p.priceDzd === 0
    ? (lang === "ar" ? "0 د.ج" : "0 DZD")
    : `${p.priceDzd.toLocaleString(lang === "ar" ? "ar" : "en")} ${lang === "ar" ? "د.ج" : "DZD"}`;
  const isPopular = p.name === "starter";
  const features = lang === "ar" ? buildFeaturesAr(p) : lang === "fr" ? buildFeaturesFr(p) : buildFeaturesEn(p);
  return { name: p.displayName, price: priceStr, desc: "", features, popular: isPopular, apiName: p.name };
}

const queryClient = new QueryClient();

// --- Translations ---
type Lang = "ar" | "fr" | "en";

const t = {
  ar: {
    dir: "rtl",
    nav: { features: "المميزات", pricing: "الأسعار", faq: "الأسئلة الشائعة", login: "تسجيل الدخول", cta: "ابدأ مجاناً" },
    hero: {
      badge: "الوكيل الذكي الأول للتجارة في الجزائر",
      title: "أتمتة المبيعات على ماسنجر بلمسة جزائرية",
      subtitle: "ردود فورية بالدارجة، الفرنسية والعربية. إدارة الطلبات، المواعيد، وحملات الرسائل التسويقية. أداة مصممة خصيصاً لأصحاب المتاجر والشركات في الجزائر لتنمية مبيعاتهم 24/7.",
      cta1: "ابدأ تجربتك المجانية",
      cta2: "شاهد كيف يعمل",
      stats: "يثق بنا أكثر من 500+ متجر جزائري"
    },
    features: {
      badge: "كل ما تحتاجه",
      title: "مبيعات أكثر، جهد أقل",
      items: [
        { title: "ردود ذكية بالدارجة", desc: "يفهم زبائنك ويرد عليهم بلهجتهم المحلية، الفرنسية، أو العربية الفصحى على مدار الساعة." },
        { title: "كتالوج المنتجات", desc: "عرض منتجاتك مباشرة في ماسنجر مع إدارة المخزون والصور بكل سهولة." },
        { title: "إدارة الطلبات", desc: "تأكيد، إلغاء، وتتبع توصيل الطلبات في مكان واحد دون فوضى الرسائل." },
        { title: "حجز المواعيد", desc: "جدولة مواعيد لخدماتك مع نظام فترات زمنية مخصص." },
        { title: "حملات تسويقية (Broadcast)", desc: "أرسل عروضك وتخفيضاتك لكل من تواصل معك بضغطة زر واحدة." },
        { title: "تكامل خاص بمتجرك", desc: "رابط Webhook مستقل لكل متجر لضمان الأمان والسرعة." }
      ]
    },
    howItWorks: {
      badge: "بسيطة وسريعة",
      title: "كيف تبدأ في 3 خطوات؟",
      steps: [
        { title: "اربط صفحتك", desc: "قم بتوصيل صفحة الفيسبوك الخاصة بك بضغطة زر وبدون تعقيدات تقنية." },
        { title: "أضف منتجاتك", desc: "ارفع صور منتجاتك، أسعارها، وتفاصيلها في لوحة تحكم سهلة الاستخدام." },
        { title: "دع الذكاء الاصطناعي يعمل", desc: "استرخِ بينما يقوم النظام بالرد على الزبائن، تسجيل الطلبات، وزيادة مبيعاتك." }
      ]
    },
    pricing: {
      badge: "أسعار مدروسة",
      title: "اختر الباقة المناسبة لمشروعك",
      monthly: "/شهر",
      plans: [
        { name: "المجانية", price: "0 د.ج", desc: "للبدايات وتجربة النظام", features: ["30 رسالة", "10 منتجات", "صفحة واحدة", "ردود آلية أساسية"] },
        { name: "التجريبية", price: "0 د.ج", desc: "14 يوم تجربة مجانية", features: ["100 رسالة", "10 منتجات", "صفحة واحدة", "دعم فني"] },
        { name: "الأساسية", price: "2,900 د.ج", desc: "للمتاجر النامية", features: ["300 رسالة", "50 منتج", "3 صفحات", "500 رسالة تسويقية", "دعم أولوية"], popular: true },
        { name: "الاحترافية", price: "6,900 د.ج", desc: "للمحترفين", features: ["1,000 رسالة", "منتجات غير محدودة", "6 صفحات", "رسائل تسويقية غير محدودة", "إدارة متقدمة"] },
        { name: "الوكالات", price: "14,900 د.ج", desc: "لإدارة عدة مشاريع", features: ["كل شيء غير محدود", "صفحات غير محدودة", "أولوية قصوى للدعم", "مدير حساب مخصص"] }
      ]
    },
    faq: {
      badge: "أسئلة وأجوبة",
      title: "كل ما تود معرفته",
      items: [
        { q: "هل يفهم الروبوت اللهجة الجزائرية؟", a: "نعم! النظام مبرمج خصيصاً لفهم الدارجة الجزائرية، إضافة إلى الفرنسية والعربية، ليرد على زبائنك بشكل طبيعي جداً." },
        { q: "كيف يتم الدفع؟", a: "نوفر طرق دفع محلية تناسبك مثل بريدي موب، البطاقة الذهبية، والتحويل البنكي." },
        { q: "هل أحتاج إلى خبرة تقنية؟", a: "أبداً. لوحة التحكم مصممة لتكون بسيطة وسهلة لأي شخص، ويمكنك إعداد متجرك في دقائق." },
        { q: "ماذا يحدث إذا تجاوزت عدد الرسائل في باقتي؟", a: "سيستمر النظام بالعمل، وسنقوم بتنبيهك لترقية باقتك بسلاسة دون أن تفقد أي زبون." },
        { q: "هل يمكنني إلغاء اشتراكي في أي وقت؟", a: "نعم، بدون أي التزامات طويلة الأمد، يمكنك إيقاف الاشتراك متى شئت." }
      ]
    },
    footer: {
      rights: "جميع الحقوق محفوظة لصالح Facebook Agent © 2024",
      desc: "أداتك الذكية للنمو في السوق الجزائري."
    }
  },
  fr: {
    dir: "ltr",
    nav: { features: "Fonctionnalités", pricing: "Tarifs", faq: "FAQ", login: "Connexion", cta: "Commencer" },
    hero: {
      badge: "Le 1er Agent IA pour le e-commerce en Algérie",
      title: "Automatisez vos ventes Messenger avec une touche locale",
      subtitle: "Réponses instantanées en Darja, Français et Arabe. Gestion des commandes, RDV et campagnes marketing. Conçu pour les entreprises algériennes pour booster les ventes 24/7.",
      cta1: "Essai Gratuit",
      cta2: "Voir la démo",
      stats: "Rejoint par plus de 500+ boutiques algériennes"
    },
    features: {
      badge: "Tout ce qu'il vous faut",
      title: "Plus de ventes, moins d'efforts",
      items: [
        { title: "Réponses IA en Darja", desc: "Comprend et répond à vos clients dans leur dialecte local, français ou arabe classique 24/7." },
        { title: "Catalogue de Produits", desc: "Affichez vos produits directement dans Messenger avec gestion des stocks et images." },
        { title: "Gestion des Commandes", desc: "Confirmez, annulez et suivez la livraison au même endroit, sans le chaos des messages." },
        { title: "Prise de Rendez-vous", desc: "Planifiez vos services avec un système de créneaux horaires personnalisés." },
        { title: "Campagnes Broadcast", desc: "Envoyez vos promos à tous ceux qui vous ont contacté en un seul clic." },
        { title: "Intégration Unique", desc: "Un lien Webhook dédié par boutique pour garantir sécurité et rapidité." }
      ]
    },
    howItWorks: {
      badge: "Simple et Rapide",
      title: "Comment démarrer en 3 étapes ?",
      steps: [
        { title: "Connectez votre page", desc: "Liez votre page Facebook en un clic, sans aucune compétence technique." },
        { title: "Ajoutez vos produits", desc: "Uploadez vos images, prix et détails dans un tableau de bord intuitif." },
        { title: "Laissez l'IA travailler", desc: "Détendez-vous pendant que le système répond aux clients et prend les commandes." }
      ]
    },
    pricing: {
      badge: "Tarifs Transparents",
      title: "Choisissez le plan idéal",
      monthly: "/mois",
      plans: [
        { name: "Gratuit", price: "0 DZD", desc: "Pour tester le système", features: ["30 messages", "10 produits", "1 page", "Réponses de base"] },
        { name: "Essai", price: "0 DZD", desc: "14 jours d'essai gratuit", features: ["100 messages", "10 produits", "1 page", "Support technique"] },
        { name: "Starter", price: "2 900 DZD", desc: "Pour les boutiques en croissance", features: ["300 messages", "50 produits", "3 pages", "500 broadcasts", "Support prioritaire"], popular: true },
        { name: "Pro", price: "6 900 DZD", desc: "Pour les professionnels", features: ["1 000 messages", "Produits illimités", "6 pages", "Broadcasts illimités", "Gestion avancée"] },
        { name: "Agence", price: "14 900 DZD", desc: "Pour gérer plusieurs projets", features: ["Tout illimité", "Pages illimitées", "Support VIP", "Account Manager dédié"] }
      ]
    },
    faq: {
      badge: "Questions Fréquentes",
      title: "Tout ce que vous devez savoir",
      items: [
        { q: "Le bot comprend-il le dialecte algérien (Darja) ?", a: "Oui ! Le système est spécialement programmé pour comprendre la Darja algérienne, le français et l'arabe, pour répondre naturellement." },
        { q: "Comment s'effectue le paiement ?", a: "Nous proposons des méthodes de paiement locales : BaridiMob, Carte Edahabia et virement bancaire." },
        { q: "Ai-je besoin d'expérience technique ?", a: "Pas du tout. Le tableau de bord est conçu pour être simple. Vous configurez votre boutique en quelques minutes." },
        { q: "Que se passe-t-il si je dépasse la limite de messages ?", a: "Le système continue de fonctionner, nous vous notifierons pour upgrader votre plan en douceur." },
        { q: "Puis-je annuler mon abonnement à tout moment ?", a: "Oui, sans aucun engagement à long terme. Vous pouvez arrêter quand vous le souhaitez." }
      ]
    },
    footer: {
      rights: "Tous droits réservés à Facebook Agent © 2024",
      desc: "Votre outil intelligent pour croître sur le marché algérien."
    }
  },
  en: {
    dir: "ltr",
    nav: { features: "Features", pricing: "Pricing", faq: "FAQ", login: "Login", cta: "Get Started" },
    hero: {
      badge: "The #1 AI Agent for Algerian E-commerce",
      title: "Automate Messenger Sales with a Local Touch",
      subtitle: "Instant replies in Darja, French, and Arabic. Manage orders, appointments, and broadcast campaigns. Built specifically for Algerian businesses to grow sales 24/7.",
      cta1: "Start Free Trial",
      cta2: "Watch Demo",
      stats: "Trusted by 500+ Algerian stores"
    },
    features: {
      badge: "Everything you need",
      title: "More sales, less effort",
      items: [
        { title: "Smart Darja Replies", desc: "Understands and replies to your customers in their local dialect, French, or Arabic 24/7." },
        { title: "Product Catalog", desc: "Display your products directly in Messenger with inventory and image management." },
        { title: "Order Management", desc: "Confirm, cancel, and track deliveries in one place without the messaging chaos." },
        { title: "Appointment Booking", desc: "Schedule appointments for your services with custom time slots." },
        { title: "Broadcast Campaigns", desc: "Send promotions to everyone who ever messaged you with a single click." },
        { title: "Dedicated Integration", desc: "A unique Webhook slug per store ensuring maximum speed and security." }
      ]
    },
    howItWorks: {
      badge: "Fast & Simple",
      title: "How to start in 3 steps?",
      steps: [
        { title: "Connect Page", desc: "Link your Facebook page with one click, no technical skills required." },
        { title: "Add Products", desc: "Upload your product images, prices, and details in a simple dashboard." },
        { title: "Let AI Work", desc: "Relax while the system replies to customers and secures orders for you." }
      ]
    },
    pricing: {
      badge: "Fair Pricing",
      title: "Choose the right plan",
      monthly: "/month",
      plans: [
        { name: "Free", price: "0 DZD", desc: "To test the waters", features: ["30 messages", "10 products", "1 page", "Basic replies"] },
        { name: "Trial", price: "0 DZD", desc: "14 days free trial", features: ["100 messages", "10 products", "1 page", "Tech support"] },
        { name: "Starter", price: "2,900 DZD", desc: "For growing stores", features: ["300 messages", "50 products", "3 pages", "500 broadcasts", "Priority support"], popular: true },
        { name: "Pro", price: "6,900 DZD", desc: "For professionals", features: ["1,000 messages", "Unlimited products", "6 pages", "Unlimited broadcasts", "Advanced management"] },
        { name: "Agency", price: "14,900 DZD", desc: "Manage multiple brands", features: ["Everything unlimited", "Unlimited pages", "VIP support", "Dedicated Account Manager"] }
      ]
    },
    faq: {
      badge: "FAQ",
      title: "Everything you need to know",
      items: [
        { q: "Does the bot understand Algerian Darja?", a: "Yes! The system is specially programmed to understand Algerian Darja, French, and Arabic, replying naturally." },
        { q: "How do I pay?", a: "We provide local payment methods like BaridiMob, Edahabia card, and bank transfers." },
        { q: "Do I need technical skills?", a: "Not at all. The dashboard is designed to be simple, letting you set up your store in minutes." },
        { q: "What if I exceed my message limit?", a: "The system keeps working. We will notify you to upgrade your plan smoothly so you don't lose any customers." },
        { q: "Can I cancel my subscription?", a: "Yes, there are no long-term commitments. You can cancel anytime." }
      ]
    },
    footer: {
      rights: "All rights reserved to Facebook Agent © 2024",
      desc: "Your smart tool for growing in the Algerian market."
    }
  }
};

function Home() {
  const [lang, setLang] = useState<Lang>("ar");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiPlans, setApiPlans] = useState<ApiPlan[] | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/subscription/plans")
      .then((r) => r.ok ? r.json() as Promise<ApiPlan[]> : Promise.reject())
      .then((data) => setApiPlans(data))
      .catch(() => setApiPlans(null))
      .finally(() => setPlansLoading(false));
  }, []);

  const content = t[lang];
  const isRtl = content.dir === "rtl";

  useEffect(() => {
    document.documentElement.dir = content.dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={content.dir}>
      {/* Background Blobs */}
      <div className="blob-1" />
      <div className="blob-2" />

      {/* Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-card py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <span>FB Agent</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <button onClick={() => scrollTo('features')} className="text-muted-foreground hover:text-foreground transition-colors">{content.nav.features}</button>
            <button onClick={() => scrollTo('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">{content.nav.pricing}</button>
            <button onClick={() => scrollTo('faq')} className="text-muted-foreground hover:text-foreground transition-colors">{content.nav.faq}</button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center bg-secondary rounded-full p-1 border border-border">
              {(["ar", "fr", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${lang === l ? 'bg-background shadow-sm font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a href="/dashboard/login" className="text-sm font-semibold hover:text-primary transition-colors">{content.nav.login}</a>
            <a href="/dashboard/register" className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all">
              {content.nav.cta}
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-card absolute top-full left-0 w-full border-t border-border/50"
            >
              <div className="flex flex-col p-6 gap-4">
                <button onClick={() => scrollTo('features')} className="text-lg font-medium text-left">{content.nav.features}</button>
                <button onClick={() => scrollTo('pricing')} className="text-lg font-medium text-left">{content.nav.pricing}</button>
                <button onClick={() => scrollTo('faq')} className="text-lg font-medium text-left">{content.nav.faq}</button>
                
                <div className="h-px w-full bg-border my-2" />
                
                <div className="flex gap-2">
                  {(["ar", "fr", "en"] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setMobileMenuOpen(false); }}
                      className={`flex-1 py-2 text-sm rounded-lg transition-all border ${lang === l ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border'}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <a href="/dashboard/login" className="w-full py-3 font-semibold bg-secondary rounded-lg text-center block">{content.nav.login}</a>
                <a href="/dashboard/register" className="w-full py-3 font-bold bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/30 text-center block">{content.nav.cta}</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {content.hero.badge}
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              {content.hero.title.split(' ').map((word, i, arr) => (
                i >= arr.length - 2 ? <span key={i} className="text-gradient"> {word}</span> : ` ${word}`
              ))}
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              {content.hero.subtitle}
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="/dashboard/register" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
                {content.hero.cta1}
                <ArrowRight className={`w-5 h-5 transition-transform group-hover:${isRtl ? '-translate-x-1' : 'translate-x-1'} ${isRtl ? 'rotate-180' : ''}`} />
              </a>
              <button onClick={() => scrollTo('features')} className="bg-secondary text-secondary-foreground border border-border px-8 py-4 rounded-full font-bold text-lg hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
                {content.hero.cta2}
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex text-amber-400">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <span>{content.hero.stats}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="container mx-auto mt-20 max-w-5xl"
        >
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl shadow-primary/10">
            <div className="rounded-xl overflow-hidden bg-background border border-border flex flex-col md:flex-row aspect-video md:aspect-[21/9]">
              {/* Sidebar */}
              <div className={`hidden md:flex flex-col w-64 border-${isRtl ? 'l' : 'r'} border-border bg-secondary/30 p-4 gap-4`}>
                <div className="h-8 w-32 bg-primary/20 rounded-md mb-4" />
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-full bg-background rounded-md border border-border/50" />)}
              </div>
              {/* Main Content */}
              <div className="flex-1 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="h-8 w-48 bg-secondary rounded-md" />
                  <div className="h-10 w-10 bg-primary/10 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-24 rounded-xl bg-gradient-to-br from-secondary to-background border border-border p-4 flex flex-col justify-between">
                      <div className="h-4 w-16 bg-muted rounded" />
                      <div className="h-8 w-24 bg-primary/20 rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 rounded-xl bg-secondary/20 border border-border" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">{content.features.badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold">{content.features.title}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: ShoppingBag, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10" },
              { icon: Radio, color: "text-rose-500", bg: "bg-rose-500/10" },
              { icon: Zap, color: "text-primary", bg: "bg-primary/10" }
            ].map((style, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-card border border-border p-8 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`w-14 h-14 rounded-xl ${style.bg} ${style.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <style.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{content.features.items[i].title}</h3>
                <p className="text-muted-foreground leading-relaxed">{content.features.items[i].desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">{content.howItWorks.badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold">{content.howItWorks.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r ${isRtl ? 'from-primary/0 via-primary/50 to-primary/0' : 'from-primary/0 via-primary/50 to-primary/0'} z-0`} />
            
            {content.howItWorks.steps.map((step, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                key={i} 
                className="relative z-10 flex flex-col items-center text-center glass-card p-8 rounded-3xl"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/30">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">{content.pricing.badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold">{content.pricing.title}</h2>
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (() => {
            const displayPlans = apiPlans && apiPlans.length > 0
              ? apiPlans.filter((p) => p.isActive === 1).map((p) => apiPlanToDisplay(p, lang))
              : content.pricing.plans.filter((_, i) => [0, 2, 3, 4].includes(i));

            const popularLabel = lang === "ar" ? "الأكثر طلباً" : lang === "fr" ? "Le plus populaire" : "Most popular";
            const freeLabel    = lang === "ar" ? "مجاني" : "0 DZD";

            return (
              <div className={`grid gap-6 items-stretch ${displayPlans.length <= 3 ? "md:grid-cols-2 lg:grid-cols-3" : displayPlans.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3 xl:grid-cols-5"}`}>
                {displayPlans.map((plan, i) => {
                  const isPopular = plan.popular;
                  const isFree = plan.price === "0 د.ج" || plan.price === "0 DZD";
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      key={"apiName" in plan ? (plan as { apiName: string }).apiName : i}
                      className={`relative bg-card rounded-3xl border flex flex-col h-full transition-all hover:-translate-y-1 ${isPopular ? 'border-primary shadow-2xl shadow-primary/20' : 'border-border shadow-lg hover:shadow-xl'}`}
                      style={isPopular ? { zIndex: 10 } : {}}
                    >
                      {isPopular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                          {popularLabel}
                        </div>
                      )}
                      <div className="p-6 md:p-8 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-muted-foreground mb-3">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-3xl md:text-4xl font-extrabold text-foreground">
                            {isFree ? (lang === "ar" ? "مجاني" : "Free") : plan.price}
                          </span>
                          {!isFree && <span className="text-muted-foreground text-sm">{content.pricing.monthly}</span>}
                        </div>
                        {"desc" in plan && plan.desc && (
                          <p className="text-xs text-muted-foreground mb-5">{plan.desc as string}</p>
                        )}
                        
                        <div className="flex-1 flex flex-col gap-3 mb-6">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="text-primary shrink-0 mt-0.5" size={16} />
                              <span className="text-sm font-medium leading-snug">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <a 
                          href="/dashboard/register" 
                          className={`w-full py-3 rounded-xl font-bold transition-all text-center block text-sm ${isPopular ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-border'}`}
                        >
                          {content.nav.cta}
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">{content.faq.badge}</span>
            <h2 className="text-3xl md:text-5xl font-bold">{content.faq.title}</h2>
          </div>

          <div className="flex flex-col gap-4">
            {content.faq.items.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} isRtl={isRtl} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">{content.hero.title}</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">{content.hero.subtitle}</p>
          <a href="/dashboard/register" className="bg-background text-primary px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform inline-block">
            {content.nav.cta}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl text-foreground mb-4">
            <MessageSquare className="text-primary" />
            <span>FB Agent</span>
          </div>
          <p className="mb-8">{content.footer.desc}</p>
          <div className="h-px w-full bg-border max-w-xs mx-auto mb-8" />
          <p className="text-sm">{content.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer, isRtl }: { question: string, answer: string, isRtl: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-2xl overflow-hidden transition-all bg-card hover:border-primary/50">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full p-6 text-left flex justify-between items-center bg-transparent"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <span className="font-bold text-lg">{question}</span>
        <ChevronRight className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : isRtl ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-border/50 mt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;