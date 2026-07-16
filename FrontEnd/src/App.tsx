/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ApiHealth } from './components/ApiHealth';
import { ActiveSessionDetails } from './components/ActiveSessionDetails';
import { WeeklyMatchups } from './components/WeeklyMatchups';
import { Projections } from './components/Projections';
import { RiskAnalysis } from './components/RiskAnalysis';
import { MarketEdge } from './components/MarketEdge';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { SurvivorStrategies } from './components/SurvivorStrategies';
import { RecommendationWorkspace } from './components/RecommendationWorkspace';
import { SeasonManagement } from './components/SeasonManagement';
import { WeeklyGameAnalysis } from './components/WeeklyGameAnalysis';
import { ScholarsGuideLogo } from './components/ScholarsGuideLogo';
import { WhySemiSharp } from './components/WhySemiSharp';
import { TeamHealth } from './components/TeamHealth';
import { AdminConsole } from './components/AdminConsole';
import { Card, Button, Input, Alert, LoadingSpinner } from './components/ui';
import { SemiSharpApi, ApiError } from './api';
import { SemiSharpContext } from './types';
import { 
  Lock, 
  User, 
  Terminal, 
  CheckCircle2, 
  Play, 
  Database, 
  LayoutDashboard, 
  Info,
  Calendar,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  Award,
  Brain,
  ClipboardList,
  Heart,
  Activity
} from 'lucide-react';

function LoginScreen() {
  const { login, error, isLoading, clearError, backendUrl } = useAuth();
  const [username, setUsername] = useState('SAS');
  const [password, setPassword] = useState('SAS');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    
    if (!username.trim() || !password.trim()) {
      setLocalError('Please fill out both username and password.');
      return;
    }

    try {
      await login(username.trim(), password.trim());
    } catch (err) {
      // AuthContext handles setting global auth error
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ScholarsGuideLogo variant="full" className="mb-4" />
        </div>
        <h2 className="mt-2 text-center text-2xl font-black text-slate-900 tracking-tight">
          Analytical Portal Sign-In
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 font-medium font-mono uppercase tracking-widest">
          v3.0 | LIVE API
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10 border border-slate-200/80 shadow-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <Input
              label="Username"
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. SAS"
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {(localError || error) && (
              <Alert 
                type="error" 
                message={localError || error || ''} 
              />
            )}

            <Button
              type="submit"
              className="w-full text-center py-2.5"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </Card>
        
        {/* Environment configuration helper */}
        <p className="mt-4 text-center text-xs text-slate-400">
          Connecting to API server: <span className="font-mono">{backendUrl}</span>
        </p>
      </div>
    </div>
  );
}

function EntrySelectionScreen({ onConfirm }: { onConfirm: () => void }) {
  const { user, selectedEntry, selectEntry, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <ScholarsGuideLogo variant="full" className="mb-4" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Select Survivor Entry
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          Logged in as <span className="font-semibold text-slate-800">{user.display_name}</span> ({user.role})
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <Card className="py-6 px-6 border border-slate-200/80 shadow-md space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Available Entries ({user.entries.length})</span>
            
            {user.entries.length === 0 ? (
              <Alert 
                type="warning" 
                message="No survivor entries are connected to your account. Please contact an administrator." 
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {user.entries.map((entry) => {
                  const isSelected = selectedEntry?.entry_id === entry.entry_id;
                  return (
                    <button
                      key={entry.entry_id}
                      type="button"
                      onClick={() => selectEntry(entry)}
                      className={`
                        w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer
                        ${isSelected 
                          ? 'border-slate-950 bg-slate-50/50 ring-2 ring-slate-950/5 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'}
                      `}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {entry.entry_label} {entry.format_name ? `— ${entry.format_name}` : ''}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {entry.entry_id}</span>
                        </div>
                        <p className="text-xs text-slate-500">Sweat Name: {entry.survivor_sweat_name}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${entry.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {entry.is_active ? 'Active' : 'Out'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={logout}
              className="flex-1"
            >
              Sign Out
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!selectedEntry}
              className="flex-1"
            >
              Confirm & Proceed
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface AnalyticalSummariesProps {
  onNavigate: (tab: string) => void;
}

function AnalyticalSummaries({ onNavigate }: AnalyticalSummariesProps) {
  const summaries = [
    {
      id: 'matchups',
      name: 'Weekly NFL Matchups',
      desc: "Retrieve real-time NFL matchups, stadium conditions, and custom travel rating indexes. All calculations are handled in FastAPI servers.",
      icon: Calendar,
      tag: 'Schedule'
    },
    {
      id: 'projections',
      name: 'Model Projections',
      desc: "Analyze predicted scores, margin of victory, and PFF power differentials parsed directly from the back-end mathematical engine.",
      icon: Sparkles,
      tag: 'Projections'
    },
    {
      id: 'risk',
      name: 'Risk & Uncertainty Monitor',
      desc: "Identify game hazard levels, weather warnings, and injury penalties using server-side probability indexes.",
      icon: AlertOctagon,
      tag: 'Risk'
    },
    {
      id: 'market',
      name: 'Consensus Market Edge',
      desc: "Compare Las Vegas consensus lines beside SemiSharp models to isolate value and discrepancies immediately.",
      icon: Database,
      tag: 'Market'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider font-mono">
          Key Analytical Summaries
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="p-5 bg-white border border-slate-100 hover:border-slate-300 transition-all flex flex-col justify-between gap-4 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-mono">
                    {item.tag}
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                    LIVE PIPELINE
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-50 text-slate-700 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <button
                onClick={() => onNavigate(item.id)}
                className="text-xs font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer self-start group-hover:translate-x-1 transition-transform"
              >
                Access Live Module <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, selectedEntry, user, backendUrl, logout } = useAuth();
  const [entryConfirmed, setEntryConfirmed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [context, setContext] = useState<SemiSharpContext | null>(null);
  const [contextLoading, setContextLoading] = useState<boolean>(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [isTeamHealthLive, setIsTeamHealthLive] = useState<boolean>(false);

  const fetchContext = async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const ctx = await SemiSharpApi.getContext();
      setContext(ctx);
    } catch (err) {
      setContextError(err instanceof ApiError ? err.message : 'Failed to query application context from server.');
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsTeamHealthLive(false);
      fetchContext();
    } else {
      setEntryConfirmed(false);
    }
  }, [isAuthenticated, backendUrl]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const requiresEntrySelection = user?.role === 'USER';

  if (requiresEntrySelection && !entryConfirmed) {
    return <EntrySelectionScreen onConfirm={() => setEntryConfirmed(true)} />;
  }

  // Helper template for structural screens
  const renderScreenHeader = (
    title: string, 
    subtitle: string, 
    icon: React.ReactNode, 
    status?: 'LIVE' | 'IN_DEVELOPMENT' | 'PLACEHOLDER'
  ) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200/80">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs mt-0.5">
          {icon}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950 tracking-tight leading-none">{title}</h2>
            {status === 'LIVE' && (
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                🟢 LIVE
              </span>
            )}
            {status === 'IN_DEVELOPMENT' && (
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                🟡 IN DEVELOPMENT
              </span>
            )}
            {status === 'PLACEHOLDER' && (
              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                ⚪ Coming Soon
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">{subtitle}</p>
        </div>
      </div>
      {context && (
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 shadow-3xs self-start md:self-auto font-mono text-xs text-slate-600">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>v3.0</span>
          <span className="text-slate-300">|</span>
          <span className="uppercase font-bold text-emerald-600">LIVE API</span>
        </div>
      )}
    </div>
  );

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      context={context}
      onRefreshContext={fetchContext}
      isTeamHealthLive={isTeamHealthLive}
    >
      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <ExecutiveDashboard 
          context={context}
          onNavigate={setActiveTab}
          onRefreshContext={fetchContext}
        />
      )}

      {/* 2. WEEKLY MATCHUPS VIEW */}
      {activeTab === 'matchups' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Weekly NFL Matchups', 
            'Display weekly games, stadiums, and location data retrieved from the schedule engine.', 
            <Calendar className="w-5 h-5" />,
            'LIVE'
          )}

          {context ? (
            <WeeklyMatchups season={context.season} week={context.current_week ?? context.week} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* 3. PROJECTIONS VIEW */}
      {activeTab === 'projections' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Projections Dashboard', 
            'Detailed model predictions, PFF power ratings, and historical score projection metrics.', 
            <Sparkles className="w-5 h-5" />,
            'LIVE'
          )}

          {context ? (
            <Projections season={context.season} week={context.current_week ?? context.week} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* 4. RISK VIEW */}
      {activeTab === 'risk' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Risk & Uncertainty Analysis', 
            'Interactive evaluation of team safety ratings, weather conditions, injury reports, and traveling factors.', 
            <AlertOctagon className="w-5 h-5" />,
            'LIVE'
          )}

          {context ? (
            <RiskAnalysis season={context.season} week={context.current_week ?? context.week} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* 5. MARKET EDGE VIEW */}
      {activeTab === 'market' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Consensus Market Edge', 
            'Identify value by comparing SemiSharp spread projections directly against consensus sportsbook lines.', 
            <Database className="w-5 h-5" />,
            'LIVE'
          )}

          {context ? (
            <MarketEdge season={context.season} week={context.current_week ?? context.week} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* WEEKLY GAME ANALYSIS VIEW */}
      {activeTab === 'game_analysis' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Weekly Game Analysis', 
            'Review every current-week matchup in one unified analytical workspace.', 
            <ClipboardList className="w-5 h-5" />,
            'IN_DEVELOPMENT'
          )}

          {context ? (
            <WeeklyGameAnalysis season={context.season} week={context.current_week ?? context.week} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* 6. STRATEGIES VIEW */}
      {activeTab === 'strategies' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Strategy Lab', 
            'Explore one survivor strategy at a time and inspect how it evaluates your selected entry.', 
            <Award className="w-5 h-5" />,
            'LIVE'
          )}

          {context ? (
            <SurvivorStrategies season={context.season} week={context.current_week ?? context.week} onNavigate={setActiveTab} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* RECOMMENDATION WORKSPACE VIEW */}
      {activeTab === 'recommendation_workspace' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Recommendation Workspace', 
            'Review backend-generated survivor recommendations before recording an official pick.', 
            <Brain className="w-5 h-5" />,
            'IN_DEVELOPMENT'
          )}

          {context ? (
            <RecommendationWorkspace season={context.season} week={context.current_week ?? context.week} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* Season Management View */}
      {activeTab === 'season_management' && (
        <SeasonManagement />
      )}

      {/* Why SemiSharp View */}
      {activeTab === 'why_semisharp' && (
        <WhySemiSharp />
      )}

      {/* Team Health View */}
      {activeTab === 'placeholder_thealth' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Team Health', 
            'Team-level health scores from Sports Injury Central used alongside core model predictions.', 
            <Heart className="w-5 h-5" />,
            'IN_DEVELOPMENT'
          )}

          {context ? (
            <TeamHealth 
              season={context.season} 
              week={context.current_week ?? context.week} 
              onLoaded={setIsTeamHealthLive} 
            />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* Admin Console View */}
      {activeTab === 'placeholder_sstatus' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            'Administration Console', 
            'Run approved backend data operations and monitor background job execution.', 
            <Activity className="w-5 h-5" />,
            'IN_DEVELOPMENT'
          )}

          {context ? (
            <AdminConsole season={context.season} />
          ) : (
            <Card className="p-12 text-center space-y-4">
              <LoadingSpinner size="md" message="Waiting for active session context parameters..." />
            </Card>
          )}
        </div>
      )}

      {/* 7. ROADMAP PLACEHOLDERS */}
      {activeTab.startsWith('placeholder_') && activeTab !== 'placeholder_thealth' && activeTab !== 'placeholder_sstatus' && (
        <div className="space-y-6 animate-fade-in">
          {renderScreenHeader(
            activeTab === 'placeholder_mcarlo' ? 'Monte Carlo Simulations' :
            activeTab === 'placeholder_dprog' ? 'Dynamic Programming Optimizer' :
            activeTab === 'placeholder_fval' ? 'Future Value Calculations' :
            activeTab === 'placeholder_hanalysis' ? 'Historical Analysis Database' :
            activeTab === 'placeholder_wreports' ? 'Weekly Analytics Reports' :
            activeTab === 'placeholder_ssummary' ? 'Season Performance Summary' :
            activeTab === 'placeholder_sstatus' ? 'System Telemetry & Status' :
            activeTab === 'placeholder_usermgt' ? 'User Administration' :
            activeTab === 'placeholder_config' ? 'Advanced Configurations' : 'Planned Module',
            'This premium module is scheduled for future deployment integration.',
            <Lock className="w-5 h-5" />,
            'PLACEHOLDER'
          )}

          <Card className="p-16 text-center space-y-4 max-w-2xl mx-auto bg-white border border-slate-100 shadow-sm">
            <Lock className="w-12 h-12 mx-auto text-slate-300 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">Presentation Placeholder</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              This analytics node is scheduled for upcoming releases. All mathematical engines, projection logic, and prediction features reside exclusively at the server-level prior to client presentation.
            </p>
          </Card>
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
