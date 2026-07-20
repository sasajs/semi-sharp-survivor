/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from './ui';
import { SemiSharpApi } from '../api';
import { SemiSharpContext } from '../types';
import { ScholarsGuideLogo } from './ScholarsGuideLogo';
import { 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Database, 
  Activity, 
  Calendar, 
  TrendingUp, 
  AlertOctagon, 
  Compass, 
  Award,
  Brain,
  Sliders,
  CheckCircle,
  XCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Binary,
  DollarSign,
  Heart,
  History,
  FileText,
  BarChart3,
  Users,
  LayoutDashboard,
  Radio,
  ClipboardList,
  Info
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  context: SemiSharpContext | null;
  onRefreshContext: () => void;
  isTeamHealthLive?: boolean;
  isPowerRankingsLive?: boolean;
  isHomeFieldAdvantageLive?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  context,
  onRefreshContext,
  isTeamHealthLive = false,
  isPowerRankingsLive = false,
  isHomeFieldAdvantageLive = false
}) => {
  const { user, selectedEntry, selectEntry, logout, backendUrl, updateBackendUrl, customHeaders, updateCustomHeaders } = useAuth();
  
  // Connection state
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  
  // Settings panel open state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [tempBackendUrl, setTempBackendUrl] = useState<string>(backendUrl);
  const [tempToken, setTempToken] = useState<string>(customHeaders['X-SemiSharp-Auth-Token'] || '');
  
  // Mobile navigation open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Collapsible sidebar state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('semi_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      try {
        localStorage.setItem('semi_sidebar_collapsed', String(!prev));
      } catch (err) {
        console.error(err);
      }
      return !prev;
    });
  };

  // Poll health on mount and backendUrl change
  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      setCheckingHealth(true);
      try {
        const health = await SemiSharpApi.checkHealth();
        if (active) setIsHealthy(health.status === 'ok' || (health as any).status === 'healthy');
      } catch (err) {
        if (active) setIsHealthy(false);
      } finally {
        if (active) setCheckingHealth(false);
      }
    };

    checkHealth();
    return () => { active = false; };
  }, [backendUrl]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBackendUrl(tempBackendUrl);
    if (tempToken) {
      updateCustomHeaders({ 'X-SemiSharp-Auth-Token': tempToken });
    } else {
      updateCustomHeaders({});
    }
    setShowSettings(false);
    onRefreshContext();
  };

  // Structured left navigation sections
  const navSections = [
    {
      title: 'General',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: Compass, status: 'LIVE' },
        { id: 'season_management', name: 'My Survivor Season', icon: Calendar, status: 'LIVE' },
      ]
    },
    {
      title: 'Analysis',
      items: [
        { id: 'game_analysis', name: 'Weekly Game Analysis', icon: ClipboardList, status: 'LIVE' },
      ]
    },
    {
      title: 'Strategies',
      items: [
        { id: 'strategies', name: 'Strategy Lab', icon: Award, status: 'LIVE' },
        { id: 'recommendation_workspace', name: 'Recommendation Workspace', icon: Brain, status: 'LIVE' },
      ]
    },
    {
      title: 'Data',
      items: [
        { id: 'placeholder_thealth', name: 'Team Health', icon: Heart, status: 'LIVE' },
        { id: 'power_rankings', name: 'Power Rankings', icon: TrendingUp, status: 'LIVE' },
        { id: 'home_field_advantage', name: 'Home Field Advantage', icon: Sliders, status: 'LIVE' },
        { id: 'placeholder_hanalysis', name: 'Historical Analysis', icon: History, status: 'PLACEHOLDER' },
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'placeholder_wreports', name: 'Weekly Reports', icon: FileText, status: 'PLACEHOLDER' },
        { id: 'placeholder_ssummary', name: 'Season Summary', icon: BarChart3, status: 'PLACEHOLDER' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'placeholder_sstatus', name: 'Administration Console', icon: Activity, status: 'LIVE' },
        { id: 'admin_user_management', name: 'User Management', icon: Users, status: 'LIVE' },
        { id: 'placeholder_config', name: 'Configuration', icon: Settings, status: 'PLACEHOLDER' },
      ]
    },
    {
      title: 'ABOUT',
      items: [
        { id: 'why_semisharp', name: 'Why SemiSharp', icon: Info, status: 'LIVE' },
      ]
    }
  ];

  const getStatusBadge = (status: string, compact = false) => {
    if (compact) {
      switch (status) {
        case 'LIVE':
        case 'IN_DEVELOPMENT':
          return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="LIVE" />;
        case 'PLACEHOLDER':
        default:
          return <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" title="Coming Soon" />;
      }
    }

    switch (status) {
      case 'LIVE':
      case 'IN_DEVELOPMENT':
        return (
          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-1 py-0.5 rounded-sm uppercase tracking-wider scale-90 shrink-0">
            LIVE
          </span>
        );
      case 'PLACEHOLDER':
      default:
        return (
          <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.5 rounded-sm uppercase tracking-wider scale-90 shrink-0 whitespace-nowrap">
            Coming Soon
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {/* 1. TOP HEADER (Operational status and controls only) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/85 shadow-2xs backdrop-blur-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center">
            
            {/* Brand / Logo */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 md:hidden text-slate-500 hover:text-slate-900"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <ScholarsGuideLogo variant="compact" />
              
              {/* Health Badge */}
              <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100/80">
                <span className={`w-2 h-2 rounded-full ${isHealthy === true ? 'bg-emerald-500 animate-pulse' : isHealthy === false ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                  {checkingHealth ? 'Checking...' : isHealthy ? 'API Connection OK' : 'API Connection Failed'}
                </span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
              {/* Season & Week Display */}
              {context && (
                <div className="hidden lg:flex flex-col text-right pr-3 border-r border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Active Contest</span>
                  <span className="text-xs font-bold text-slate-800">
                    {context.season} Season • Week {context.current_week ?? context.week}
                  </span>
                </div>
              )}

              {/* Selected Entry Dropdown (if logged in) */}
              {user && user.entries && user.entries.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-xs text-slate-500 font-bold">Active Entry:</span>
                  <select
                    value={selectedEntry?.entry_id || ''}
                    onChange={(e) => {
                      const found = user.entries.find(entry => String(entry.entry_id) === e.target.value);
                      selectEntry(found || null);
                    }}
                    className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'><path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/></svg>")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1rem',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {user.entries.map((entry) => (
                      <option key={entry.entry_id} value={entry.entry_id}>
                        {entry.entry_label} — {entry.format_name || 'No Format'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Settings Action */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="API Environment Setup"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout Action */}
              {user && (
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* 2. PERSISTENT LEFT SIDEBAR & MAIN BODY ROW */}
      <div className="flex-1 flex flex-row relative min-h-0 overflow-hidden">
        
        {/* Left Side Navigation Menu (Desktop) */}
        <aside 
          className={`
            hidden md:flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out shrink-0 select-none
            ${isCollapsed ? 'w-16' : 'w-64'}
          `}
        >
          {/* Scrollable menu content */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                {/* Section title (hidden when collapsed) */}
                {!isCollapsed ? (
                  <h4 className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {section.title}
                  </h4>
                ) : (
                  <div className="border-t border-slate-100 my-2 pt-1" />
                )}

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`
                          w-full px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer group
                          ${active 
                            ? 'bg-slate-950 text-white shadow-xs' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}
                        `}
                        title={isCollapsed ? `${item.name} (${item.status})` : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </div>
                        {!isCollapsed && getStatusBadge(item.status)}
                        {isCollapsed && getStatusBadge(item.status, true)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center p-3 text-slate-400 hover:text-slate-900 border-t border-slate-100 hover:bg-slate-50 transition-colors w-full cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Collapse Menu</span>
              </div>
            )}
          </button>
        </aside>

        {/* Mobile slide-out overlay drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer panel */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-slate-200/80 shadow-xl focus:outline-none animate-slide-in duration-200">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
                <ScholarsGuideLogo variant="compact" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Drawer content */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1.5">
                    <h4 className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {section.title}
                    </h4>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`
                              w-full px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors
                              ${active 
                                ? 'bg-slate-950 text-white shadow-xs' 
                                : 'text-slate-600 hover:bg-slate-50'}
                            `}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                              <span>{item.name}</span>
                            </div>
                            {getStatusBadge(item.status)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right main body viewport wrapper */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Main viewport */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Connection Failure Panel */}
          {isHealthy === false && (
            <div className="bg-rose-600 text-white py-3 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 shrink-0">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Cannot reach the FastAPI backend service at <strong>{backendUrl}</strong>. Click settings in the top-right to adjust.</span>
            </div>
          )}

          {/* Footer Branding */}
          <footer className="bg-white border-t border-slate-200/60 py-8 text-center text-xs text-slate-400 font-medium shrink-0 space-y-2">
            <div className="max-w-md mx-auto flex flex-col items-center gap-1">
              <ScholarsGuideLogo variant="full" className="scale-75 opacity-90 mb-1" />
              <p className="font-bold text-slate-500">© 2026 Schilhabel Group, LLC</p>
              <p className="font-semibold text-slate-400">The Scholar's Guide to Sports Analytics</p>
              <p className="text-[10px] text-slate-400/80 tracking-wide font-sans">
                Powered by SemiSharp™ • AI-Enhanced Decision Intelligence
              </p>
            </div>
          </footer>
        </div>

      </div>

      {/* API Configuration Drawer overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background Backdrop */}
            <div 
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/60 transition-opacity backdrop-blur-xs" 
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl border-l border-slate-200">
                  
                  {/* Header */}
                  <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-slate-400" />
                      <h2 className="text-md font-bold tracking-tight" id="slide-over-title">
                        API Environment Settings
                      </h2>
                    </div>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body Form */}
                  <form onSubmit={handleSaveSettings} className="flex-1 px-6 py-6 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                        <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-slate-500" /> Connection Status
                        </h3>
                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                          The client connects to a FastAPI back-end to display data without computing predictions.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className={isHealthy ? 'text-emerald-700' : 'text-rose-700'}>
                            {isHealthy ? 'API Connection Successful' : 'Disconnected from Backend'}
                          </span>
                        </div>
                      </div>

                      {/* Inputs */}
                      <Input
                        label="Backend Service URL"
                        id="backend_url_input"
                        value={tempBackendUrl}
                        onChange={(e) => setTempBackendUrl(e.target.value)}
                        placeholder="https://api.steveschilhabel.com"
                        className="font-mono text-xs"
                        required
                      />

                      <Input
                        label="X-SemiSharp-Auth-Token (Header Value)"
                        id="auth_token_input"
                        value={tempToken}
                        onChange={(e) => setTempToken(e.target.value)}
                        placeholder="Authentication header token..."
                        className="font-mono text-xs"
                      />

                      <div className="text-xs text-slate-400 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg font-mono">
                        <div className="font-bold text-slate-600 mb-1">Active Headers:</div>
                        <div>Content-Type: application/json</div>
                        {tempToken && <div>X-SemiSharp-Auth-Token: {tempToken.substring(0, 10)}...</div>}
                      </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setShowSettings(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                      >
                        Save Settings
                      </Button>
                    </div>

                  </form>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
