import React, { useState, useEffect } from 'react';
import { Course, Package, SiteSettings } from './types';
import { getPublicSettings, getPublicCourses, getPublicPackages, getAdminToken } from './api/client';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CourseGallery } from './components/CourseGallery';
import { CourseModal } from './components/CourseModal';
import { PricingSection } from './components/PricingSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { RecoveryModal } from './components/RecoveryModal';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal & View States
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [checkoutInitialCourse, setCheckoutInitialCourse] = useState<Course | null>(null);
  const [checkoutInitialPackage, setCheckoutInitialPackage] = useState<Package | null>(null);

  const [trackingOpen, setTrackingOpen] = useState<boolean>(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const [recoveryOpen, setRecoveryOpen] = useState<boolean>(false);
  const [adminPinOpen, setAdminPinOpen] = useState<boolean>(false);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  const loadPublicData = async () => {
    try {
      const [st, crs, pkgs] = await Promise.all([
        getPublicSettings(),
        getPublicCourses(),
        getPublicPackages(),
      ]);
      setSettings(st);
      setCourses(crs);
      setPackages(pkgs);
    } catch (err) {
      console.error('Failed loading public data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicData();

    // Check for tracking token in URL query (?token=...)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setTrackingToken(tokenFromUrl);
      setTrackingOpen(true);
    }

    // Check existing admin session
    if (getAdminToken()) {
      setIsAdminView(true);
    }
  }, []);

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenCourseModal = (course: Course) => {
    setSelectedCourseForModal(course);
  };

  const handleQuickBuy = (course: Course) => {
    setCheckoutInitialCourse(course);
    setCheckoutInitialPackage(packages[0] || null);
    setCheckoutOpen(true);
  };

  const handleCourseModalProceedToCheckout = (course: Course, packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId) || packages[0];
    setSelectedCourseForModal(null);
    setCheckoutInitialCourse(course);
    setCheckoutInitialPackage(pkg);
    setCheckoutOpen(true);
  };

  const handleSelectPackageForCheckout = (pkg: Package) => {
    setCheckoutInitialCourse(courses[0] || null);
    setCheckoutInitialPackage(pkg);
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (_orderId: string, token: string) => {
    setCheckoutOpen(false);
    setTrackingToken(token);
    setTrackingOpen(true);
    // Update browser URL query safely without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('token', token);
    window.history.pushState({}, '', url.toString());
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide">TechVantage BD লোড হচ্ছে...</p>
      </div>
    );
  }

  // If in Admin Dashboard Mode
  if (isAdminView) {
    return (
      <AdminDashboard
        onExit={() => setIsAdminView(false)}
        onRefreshPublicData={loadPublicData}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 pb-16 md:pb-0">
      {/* 1. Header & Navigation */}
      <Navbar
        settings={settings}
        onNavigate={handleNavigate}
        onOpenRecovery={() => setRecoveryOpen(true)}
        onOpenCheckout={() => {
          setCheckoutInitialCourse(courses[0] || null);
          setCheckoutInitialPackage(packages[0] || null);
          setCheckoutOpen(true);
        }}
      />

      {/* 2. Hero Section */}
      {settings.sectionVisibility?.hero !== false && (
        <Hero
          settings={settings}
          onExploreCourses={() => handleNavigate('courses')}
          onExplorePricing={() => handleNavigate('pricing')}
        />
      )}

      {/* 3. Course Gallery Section */}
      {settings.sectionVisibility?.courses !== false && (
        <CourseGallery
          courses={courses}
          settings={settings}
          onSelectCourse={handleOpenCourseModal}
          onQuickBuy={handleQuickBuy}
        />
      )}

      {/* 4. Packages & Pricing Section */}
      {settings.sectionVisibility?.pricing !== false && (
        <PricingSection
          packages={packages}
          onSelectPackageForCheckout={handleSelectPackageForCheckout}
        />
      )}

      {/* 5. Student Testimonials */}
      {settings.sectionVisibility?.testimonials !== false && (
        <TestimonialsSection settings={settings} />
      )}

      {/* 6. FAQ Section */}
      {settings.sectionVisibility?.faq !== false && (
        <FaqSection settings={settings} />
      )}

      {/* 7. Footer (Discreet admin entry strictly on copyright symbol ©) */}
      {settings.sectionVisibility?.footer !== false && (
        <Footer
          settings={settings}
          onTriggerAdminPinModal={() => setAdminPinOpen(true)}
          onNavigate={handleNavigate}
          onOpenRecovery={() => setRecoveryOpen(true)}
        />
      )}

      {/* Fixed Mobile Bottom Navigation (Only on mobile md:hidden, 2 items: হোম & Your Link) */}
      <MobileBottomNav
        currentView={recoveryOpen || trackingOpen ? 'your_link' : 'home'}
        onGoHome={() => handleNavigate('home')}
        onOpenYourLink={() => setRecoveryOpen(true)}
      />

      {/* MODALS */}

      {/* Course Details Modal */}
      {selectedCourseForModal && (
        <CourseModal
          course={selectedCourseForModal}
          packages={packages}
          onClose={() => setSelectedCourseForModal(null)}
          onProceedToCheckout={handleCourseModalProceedToCheckout}
        />
      )}

      {/* Guest Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          initialCourse={checkoutInitialCourse}
          initialPackage={checkoutInitialPackage}
          courses={courses}
          packages={packages}
          settings={settings}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Order Tracking Modal */}
      {trackingOpen && (
        <OrderTrackingModal
          initialToken={trackingToken}
          onClose={() => setTrackingOpen(false)}
        />
      )}

      {/* Phone-based Order Recovery Modal */}
      {recoveryOpen && (
        <RecoveryModal
          onClose={() => setRecoveryOpen(false)}
          onOpenOrderTracking={(token) => {
            setRecoveryOpen(false);
            setTrackingToken(token);
            setTrackingOpen(true);
          }}
        />
      )}

      {/* Hidden Administrator PIN Modal (Triggered ONLY by clicking © in footer) */}
      {adminPinOpen && (
        <AdminPinModal
          onClose={() => setAdminPinOpen(false)}
          onSuccess={() => {
            setAdminPinOpen(false);
            setIsAdminView(true);
          }}
        />
      )}
    </div>
  );
}
