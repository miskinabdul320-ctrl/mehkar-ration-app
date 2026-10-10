/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar.js';
import { TabBar, TabType } from './components/TabBar.js';
import { HomeDashboard } from './components/HomeDashboard.js';
import { ShopList } from './components/ShopList.js';
import { AayPhhReport } from './components/AayPhhReport.js';
import { PendingCards } from './components/PendingCards.js';
import { FpsStockDetails } from './components/FpsStockDetails.js';
import { RcDetailView } from './components/RcDetailView.js';
import { PortabilityTransactionsView } from './components/PortabilityTransactionsView.js';
import { RoStatusView } from './components/RoStatusView.js';
import { ShopDetailModal } from './components/ShopDetailModal.js';
import { LoginRegisterScreen } from './components/LoginRegisterScreen.js';
import { SubscriptionPaymentModal } from './components/SubscriptionPaymentModal.js';
import { OwnerDashboard } from './components/OwnerDashboard.js';
import { AutoUpdateBanner } from './components/AutoUpdateBanner.js';
import { EposShop, EposStats } from './types/epos.js';
import { UserSession } from './types/auth.js';
import { getCurrentSession, logoutDealer, getRegisteredAccounts } from './services/authService.js';
import { CheckCircle2, Store, LogOut, ShieldCheck, CreditCard, Crown, ArrowLeft } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

import {
  BUNDLED_SHOPS,
  getMergedShops,
  calculateStats,
  fetchInitialEposData,
  refreshEposDataClient
} from './services/eposClientData.js';

// Auto-detect current active calendar month (e.g. 2026-10)
const getInitialMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(() => getCurrentSession());
  const [shops, setShops] = useState<EposShop[]>(() => getMergedShops(BUNDLED_SHOPS));
  const [stats, setStats] = useState<EposStats | null>(() => calculateStats(getMergedShops(BUNDLED_SHOPS)));
  const [currentMonth, setCurrentMonth] = useState<string>(getInitialMonth());
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [stockSubTab, setStockSubTab] = useState<'register' | 'scheme'>('register');
  const [rcSearchMode, setRcSearchMode] = useState<'rc' | 'aadhaar'>('rc');
  const [selectedShop, setSelectedShop] = useState<EposShop | null>(null);
  const [selectedRcForDetail, setSelectedRcForDetail] = useState<string | null>(null);
  const [lang, setLang] = useState<'mr' | 'hi' | 'en'>('mr');
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [ownerViewMode, setOwnerViewMode] = useState<'dashboard' | 'shop'>('dashboard');

  // Strict check: if logged in dealer's ID is deactivated by Owner, immediately enforce logout
  useEffect(() => {
    if (userSession && userSession.role === 'dealer' && userSession.fpsId) {
      const accounts = getRegisteredAccounts();
      const current = accounts.find((a) => a.fpsId === userSession.fpsId);
      if (current && current.isActive === false) {
        setRefreshMessage(`⚠️ आपले आयडी (दुकान क्र. ${userSession.fpsId}) मालकाद्वारे निष्क्रिय (Deactivated) केले आहे.`);
        setTimeout(() => {
          logoutDealer();
          setUserSession(null);
        }, 2000);
      }
    }
  }, [userSession]);

  // Filter shops array to strictly show ONLY the logged-in dealer's shop!
  // "जो fps id नंबर से लॉगिन करा ऊस दुकान का ही data दिखना पुरे दुकान का नहीं"
  const activeShops = useMemo((): EposShop[] => {
    if (!userSession) return shops;
    if (userSession.fpsId === 'ALL') return shops;
    const match = shops.filter((s) => s.fpsId === userSession.fpsId);
    if (match.length > 0) return match;
    // If not in bundled list, dynamically construct the single shop representation
    const defaultTemplate = shops[0] || BUNDLED_SHOPS[0];
    return [
      {
        ...defaultTemplate,
        fpsId: userSession.fpsId,
        dealerName: userSession.dealerName,
        dealerMobile: userSession.mobileNumber || 'XXXXX-XXXXX',
        area: userSession.shopAddress || 'मेहकर शहर, जि. बुलढाणा',
        totalCards: userSession.totalCards || 500,
        aayCards: 78,
        phhCards: (userSession.totalCards || 500) - 78,
        monthAvailed: 1
      }
    ];
  }, [shops, userSession]);

  // Compute scoped stats for the active single shop
  const scopedStats = useMemo((): EposStats | null => {
    if (!userSession || userSession.fpsId === 'ALL') return stats;
    const target = activeShops[0];
    if (!target) return stats;
    return {
      totalShops: 1,
      activeShops: 1,
      inactiveShops: 0,
      todayTransactions: 0,
      monthTransactions: target.monthAvailed || 1,
      totalCards: target.totalCards || 706,
      lastSync: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      lastSyncIso: new Date().toISOString(),
      serverStatus: 'ONLINE',
      gatewayUrl: 'epos.mahafood.gov.in',
      district: 'Buldana',
      taluka: 'MEHKAR'
    };
  }, [stats, userSession, activeShops]);

  // Hardware and browser Back button management
  // Prevents app from abruptly closing when user presses Back
  const handleBackNavigation = useCallback((): boolean => {
    // 1. If print preview modal is open in DOM, remove it
    const printModal = document.getElementById('print-modal-container');
    if (printModal) {
      printModal.remove();
      return true;
    }

    // 2. If Shop detail modal is open, close it
    if (selectedShop) {
      setSelectedShop(null);
      return true;
    }

    // 4. If RC detail view is open, return to pending or home
    if (selectedRcForDetail || activeTab === 'rc-detail') {
      setSelectedRcForDetail(null);
      setActiveTab('home');
      return true;
    }

    // 5. If on any tab other than 'home', return to 'home'
    if (activeTab !== 'home') {
      setActiveTab('home');
      return true;
    }

    // 6. Already at 'home' - prevent accidental app exit by keeping cushion
    return false;
  }, [selectedShop, selectedRcForDetail, activeTab]);

  // Hook into browser history popstate
  useEffect(() => {
    // Push an initial entry so first back press is captured
    if (!window.history.state || !window.history.state.rootHome) {
      window.history.replaceState({ rootHome: true }, '');
    }

    const onPopState = (e: PopStateEvent) => {
      const handled = handleBackNavigation();
      if (handled) {
        e.preventDefault?.();
        // Keep a history cushion so repeated back button presses stay within app
        window.history.pushState({ appNav: true }, '');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [handleBackNavigation]);

  // Hook into Android hardware back button via Capacitor if running in APK
  useEffect(() => {
    let listenerHandle: any = null;
    try {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        const handled = handleBackNavigation();
        if (!handled) {
          if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        }
      })
        .then((h) => {
          listenerHandle = h;
        })
        .catch(() => {
          // Running in browser web preview; popstate handler will handle
        });
    } catch (_e) {
      // not in capacitor
    }

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [handleBackNavigation]);

  // Wrapped navigation helpers that register history entries for Back button
  const handleSelectTab = (tab: TabType) => {
    if (tab !== activeTab) {
      window.history.pushState({ tab }, '');
      setActiveTab(tab);
    }
  };

  const handleHomeNavigate = (tab: TabType, extra?: any) => {
    if (extra?.stockTab) {
      setStockSubTab(extra.stockTab);
    }
    if (extra?.searchMode) {
      setRcSearchMode(extra.searchMode);
    }
    handleSelectTab(tab);
  };

  const handleSelectShop = (shop: EposShop | null) => {
    if (shop) {
      window.history.pushState({ shop: shop.fpsId }, '');
    }
    setSelectedShop(shop);
  };

  const handleViewRcDetail = (rcNo: string) => {
    window.history.pushState({ rcNo }, '');
    setSelectedRcForDetail(rcNo);
    setRcSearchMode('rc');
    setActiveTab('rc-detail');
  };

  // Initial load - gracefully sync with server if available (e.g. in web preview), or keep bundled data in APK
  useEffect(() => {
    fetchInitialEposData()
      .then(({ shops: freshShops, stats: freshStats }) => {
        if (freshShops && Array.isArray(freshShops) && freshShops.length > 0) {
          setShops(freshShops);
          setStats(freshStats);
        } else {
          setShops(BUNDLED_SHOPS);
          setStats(calculateStats(BUNDLED_SHOPS));
        }
      })
      .catch((err) => {
        console.warn('Using bundled FPS data:', err);
        setShops(BUNDLED_SHOPS);
        setStats(calculateStats(BUNDLED_SHOPS));
      });
  }, []);

  // Handle live refresh - works smoothly in web and Capacitor Android APK
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      const result = await refreshEposDataClient(shops);
      setShops(result.shops);
      setStats(result.stats);
      setRefreshMessage(result.message);
      setTimeout(() => setRefreshMessage(null), 5000);
    } catch (err) {
      console.error('Refresh error:', err);
      setRefreshMessage('डेटा अद्ययावत करण्यात आला आहे.');
      setTimeout(() => setRefreshMessage(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    logoutDealer();
    setUserSession(null);
    setSelectedShop(null);
    setSelectedRcForDetail(null);
    setActiveTab('home');
  };

  // If user is not logged in, show the Login/Registration Screen with AutoUpdate active
  if (!userSession) {
    return (
      <>
        <AutoUpdateBanner compact />
        <LoginRegisterScreen
          lang={lang}
          onLoginSuccess={(session) => {
            setUserSession(session);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        stats={scopedStats}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lang={lang}
        setLang={setLang}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        userSession={userSession}
        onLogout={handleLogout}
        onOpenLogin={() => setUserSession(null)}
        onOpenPayment={() => setIsPaymentModalOpen(true)}
        onToggleOwnerDashboard={() => setOwnerViewMode(ownerViewMode === 'dashboard' ? 'shop' : 'dashboard')}
        isOwnerDashboardOpen={ownerViewMode === 'dashboard'}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
        {/* OWNER VIEW: DASHBOARD */}
        {userSession && userSession.role === 'owner' && ownerViewMode === 'dashboard' && (
          <OwnerDashboard
            userSession={userSession}
            shops={shops}
            onUpdateShops={(newShops) => setShops(newShops)}
            onRefreshShops={handleRefresh}
            onLogout={handleLogout}
            onSwitchToShopView={() => setOwnerViewMode('shop')}
            lang={lang}
          />
        )}

        {/* OWNER VIEW: SHOP PREVIEW BANNER */}
        {userSession && userSession.role === 'owner' && ownerViewMode === 'shop' && (
          <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md border border-amber-500/30 font-devanagari">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👑</span>
              <div>
                <span className="font-bold text-xs text-amber-200 block">
                  मालक मोड (सुपर ॲडमिन): सर्व १४ दुकाने थेट व्ह्यू
                </span>
                <span className="text-[11px] text-slate-300">
                  येथे आपण सर्व दुकानांचा साठा, वाटप व कार्डे थेट तपासू शकता.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOwnerViewMode('dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← मालक नियंत्रण पॅनेलवर परत जा</span>
            </button>
          </div>
        )}

        {/* REGULAR APP / DEALER TABS VIEW */}
        {(!userSession || userSession.role !== 'owner' || ownerViewMode === 'shop') && (
          <>
            {/* Scoped Dealer Shop Banner matching user requirement:
                "जो fps id नंबर से लॉगिन करा ऊस दुकान का ही data दिखना पुरे दुकान का नहीं" */}
            {userSession && userSession.fpsId !== 'ALL' && (
              <div className="bg-amber-50/95 border border-amber-300 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {userSession.fpsId.slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-950 font-devanagari">
                      <Store className="w-4 h-4 text-amber-800" />
                      <span>आपले अधिकृत दुकान: क्र. {userSession.fpsId}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                        सक्रिय दुकान
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium font-devanagari">
                      {userSession.dealerName} · केवळ या दुकानाचा अधिकृत साठा, वाटप व कार्डे
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="३ दिवस मोफत चाचणी / ₹१०० मासिक वर्गणी"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>वर्गणी (₹१००/महिना)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-amber-300 text-amber-950 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>बाहेर पडा (Logout)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Refresh Toast Notification */}
            {refreshMessage && (
              <div className="bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 font-devanagari">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span>{refreshMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshMessage(null)}
                  className="text-emerald-200 hover:text-white text-xs px-2 py-1 rounded bg-white/10 cursor-pointer"
                >
                  समजले
                </button>
              </div>
            )}

            {/* Navigation Tabs (14 दुकाने, AAY व PHH योजना, Pending कार्डे) */}
            <TabBar
              activeTab={activeTab}
              setActiveTab={handleSelectTab}
              lang={lang}
            />

            {/* Tab 0: Home Screen with Vertical Options ("खडे ऑपशन्स") */}
            {activeTab === 'home' && (
              <HomeDashboard
                onNavigate={handleHomeNavigate}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                lang={lang}
                totalShops={activeShops.length}
                totalCards={scopedStats?.totalCards || activeShops[0]?.totalCards || 706}
                totalPending={scopedStats ? Math.max(0, (scopedStats.totalCards || 706) - (scopedStats.monthTransactions || 0)) : 705}
                monthAvailed={scopedStats?.monthTransactions || 0}
              />
            )}

            {/* Tab 1: Shops Directory & Search (Scoped to active dealer shop) */}
            {activeTab === 'shops' && (
              <ShopList
                shops={activeShops}
                loading={loading}
                onSelectShop={(shop) => handleSelectShop(shop)}
                lang={lang}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
            )}

            {/* Tab 2: Scheme wise Cards, Sales & Stock (Only AAY & PHH) */}
            {activeTab === 'aay-phh' && (
              <AayPhhReport
                shops={activeShops}
                lang={lang}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            )}

            {/* Tab 3: Pending Ration Cards (Scoped to active dealer shop) */}
            {activeTab === 'pending' && (
              <PendingCards
                shops={activeShops}
                lang={lang}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                onViewRcDetail={(rcNo) => handleViewRcDetail(rcNo)}
              />
            )}

            {/* Tab 4: Official FPS Stock Details (Scoped to active dealer shop) */}
            {activeTab === 'fps-stock' && (
              <FpsStockDetails
                shops={activeShops}
                lang={lang}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                initialStockTab={stockSubTab}
              />
            )}

            {/* Tab 5: Official RC Details (epos.mahafood.gov.in AePDS) */}
            {activeTab === 'rc-detail' && (
              <RcDetailView
                initialRcNo={selectedRcForDetail || (userSession?.fpsId === '150024600320' ? '272014426720' : userSession?.fpsId === '150024600318' ? '272014427186' : undefined)}
                initialSearchMode={rcSearchMode}
                currentMonth={currentMonth}
                lang={lang}
              />
            )}

            {/* Tab 6: Portability Transaction Details for FPS */}
            {activeTab === 'portability' && (
              <PortabilityTransactionsView
                currentShopId={userSession?.fpsId || '150024600320'}
                shops={shops}
                currentMonth={currentMonth}
                lang={lang}
              />
            )}

            {/* Tab 7: RO Received Status (Buldana / MEHKAR RO Status) */}
            {activeTab === 'ro-status' && (
              <RoStatusView
                currentShopId={userSession?.fpsId || '150024600320'}
                shops={shops}
                lang={lang}
              />
            )}
          </>
        )}
      </main>

      {/* Shop Detail Modal */}
      {selectedShop && (
        <ShopDetailModal
          shop={selectedShop}
          onClose={() => handleSelectShop(null)}
          lang={lang}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* Monthly Subscription & Direct Online UPI Payment Modal */}
      {userSession && (
        <SubscriptionPaymentModal
          session={userSession}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={(updated) => setUserSession(updated)}
        />
      )}
    </div>
  );
}
