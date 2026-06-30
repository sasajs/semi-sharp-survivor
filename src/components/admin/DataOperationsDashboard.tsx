import React, { useState } from "react";
import {
  LayoutDashboard,
  Brain,
  Users,
  MapPin,
  Fingerprint,
  Navigation,
  Calendar,
  TrendingUp,
  Activity,
  CloudSun,
  Award,
  History,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface SubSection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  details: string[];
}

export const DataOperationsDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>("dashboard");

  const subSections: SubSection[] = [
    {
      id: "dashboard",
      name: "Data Operations Dashboard",
      description: "Unified telemetry for Semi-Sharp database ingestions, schedule updates, and feed synchronization statuses.",
      icon: LayoutDashboard,
      details: [
        "Inbound Ingestion Pipeline health indicators",
        "Last synchronized timestamps for core feeds",
        "Total active reference data row counts",
        "Validation and processing queue telemetry"
      ]
    },
    {
      id: "reference",
      name: "Reference Intelligence",
      description: "Master directory linking athletic metadata, external vendor indices, and localized venue profiles.",
      icon: Brain,
      details: [
        "Global ID mapping records across SportRadar, Elias, and internal schemas",
        "Division and Conference alignment lookups",
        "Historical stadium altitude, turf coefficient, and dome status metrics"
      ]
    },
    {
      id: "teams",
      name: "Teams Master list",
      description: "Canonical definition of all NFL franchise records, color schemes, and division metadata.",
      icon: Users,
      details: [
        "Full roster franchise configuration settings",
        "Primary, secondary, and tertiary hexadecimal colors",
        "Default home venue association values"
      ]
    },
    {
      id: "venues",
      name: "Venues Configuration",
      description: "System directory of playing surfaces, seating capacities, geographical locations, and default climate conditions.",
      icon: MapPin,
      details: [
        "Stadium playing surface classification (Natural Grass, FieldTurf, etc.)",
        "Dome configuration indicators (Retractable, Fixed, Open-Air)",
        "Latitude/Longitude coordinates for real-time weather querying"
      ]
    },
    {
      id: "team-aliases",
      name: "Team Aliases",
      description: "Synonym resolution map translating diverse third-party abbreviations into canonical team IDs.",
      icon: Fingerprint,
      details: [
        "Translation map: 'OAK' vs 'LV', 'WSH' vs 'WAS', 'SD' vs 'LAC'",
        "Vendor-specific naming keys (e.g., ESPN abbreviations vs ProFootballFocus)",
        "Unresolved alias exception handling logs"
      ]
    },
    {
      id: "venue-aliases",
      name: "Venue Aliases",
      description: "Synonym mapping to automatically resolve stadium name changes and commercial re-brandings.",
      icon: Navigation,
      details: [
        "Translation map: 'Heinz Field' vs 'Acrisure Stadium'",
        "Sponsor name variation resolution filters",
        "Historic venue cross-reference indices"
      ]
    },
    {
      id: "schedule-imports",
      name: "Schedule Imports",
      description: "Ingestion and validation center for NFL weekly schedules, bye-weeks, and broadcast assignments.",
      icon: Calendar,
      details: [
        "Seasonal regular and postseason schedule loaders",
        "Game timing validation rules against local timezones",
        "Bye week calendar synchronization"
      ]
    },
    {
      id: "odds-imports",
      name: "Odds Imports",
      description: "Closing line and real-time market consensus spread, over/under, and moneyline loaders.",
      icon: TrendingUp,
      details: [
        "Consensus Vegas line scraper integration settings",
        "Closing Line Value (CLV) evaluation and calculation triggers",
        "Line movement tracker and historical volatility logs"
      ]
    },
    {
      id: "injury-imports",
      name: "Injury Imports",
      description: "Scraper controls for player status, practice participation levels, and critical starter out-of-game indicators.",
      icon: Activity,
      details: [
        "Official NFL injury report RSS and API adaptors",
        "Estimated depth chart impact levels and team-strength multipliers",
        "Practice status trend logs (DNP, LP, FP)"
      ]
    },
    {
      id: "weather-imports",
      name: "Weather Imports",
      description: "Atmospheric condition monitoring linking games to hourly forecasts, wind speeds, and temperatures.",
      icon: CloudSun,
      details: [
        "Open-source hourly weather forecasts matching geographic coordinates",
        "Wind speed warnings for field-goal and passing efficiency factors",
        "Historic gametime weather records archive"
      ]
    },
    {
      id: "power-ratings",
      name: "Power Ratings",
      description: "Adjustable model coefficients and subjective power rank layers for custom ensemble tuning.",
      icon: Award,
      details: [
        "Interactive power ranking custom adjustment sliders",
        "Vegas implied power ratings cross-references",
        "Mathematical versus custom strength offset overrides"
      ]
    },
    {
      id: "import-history",
      name: "Import History",
      description: "Secure, chronological audit log tracking every data ingestion job execution, byte size, and outcome status.",
      icon: History,
      details: [
        "Inbound data flow validation receipts",
        "Execution speed, row ingestion count, and parsing performance metrics",
        "System user audit trails tracking manual override initiations"
      ]
    },
    {
      id: "data-quality",
      name: "Data Quality Logs",
      description: "Automated verification panel tracking anomalous values, missing games, and schema mismatches.",
      icon: CheckCircle2,
      details: [
        "Outlier detection triggers for spreads and over/under totals",
        "Duplicate team/game key collision audit reports",
        "Null value occurrence scan reports"
      ]
    }
  ];

  const activeData = subSections.find((s) => s.id === activeSubTab) || subSections[0];
  const ActiveIcon = activeData.icon;

  return (
    <div className="space-y-6">
      {/* Informative Warning Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 text-xs text-slate-700 shadow-xs">
        <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold text-slate-900">Epic 2 Architectural Scaffold Active</p>
          <p className="mt-0.5 text-slate-500">
            The database tables and ingestors for reference intelligence are currently being developed.
            All visual configurations below are operational wireframes prepared to connect directly to the canonical databases in the upcoming sprint. No modifications will be made to the current live database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column Sidebar */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5 h-fit">
          <div className="px-2 pb-2 border-b border-slate-100">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Epic 2 Data Schema
            </h4>
          </div>
          <nav className="flex flex-col gap-1 pt-1.5">
            {subSections.map((item) => {
              const ItemIcon = item.icon;
              const isActive = item.id === activeSubTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-950 border-l-3 border-indigo-600 pl-2.5"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.id !== "dashboard" && (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-widest font-mono">
                      Epic 2
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Column Ingestion Monitor Screen */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            {/* Elegant Background Design */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-30 -z-1" />

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest font-mono bg-indigo-50 px-2 py-0.5 rounded-full">
                      Epic 2 Blueprint
                    </span>
                    <h3 className="text-lg font-black text-slate-950 tracking-tight mt-0.5">
                      {activeData.name}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  {activeData.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-amber-50 text-amber-800 border border-amber-200/55 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                Coming in Epic 2
              </div>
            </div>

            {/* Simulated Data Preview Grid */}
            <div className="mt-8 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                  Proposed Database Fields & Properties
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {activeData.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl p-3 flex items-start gap-2.5 transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-600 leading-relaxed">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphical Operational Wireframe Placeholder */}
              <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
                <div className="p-3.5 bg-slate-100 rounded-full text-slate-400 border border-slate-200">
                  <Database className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-900">Database Schema Standby</h5>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                    The backend schemas and real-time ingestion listeners are undergoing strict unit-testing in local sandbox repositories. Production database migrations are deferred until Epic 2 validation completes.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    disabled
                    className="opacity-50 text-xs font-bold bg-slate-200 text-slate-400 border border-slate-300 py-1.5 px-3 rounded-lg cursor-not-allowed flex items-center gap-1.5"
                  >
                    Run Draft Import
                  </button>
                  <button
                    disabled
                    className="opacity-50 text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 py-1.5 px-3 rounded-lg cursor-not-allowed flex items-center gap-1.5"
                  >
                    Verify Schema Integrity
                  </button>
                </div>
              </div>

              {/* Data Operations Live Ingestion Schema Mock for Developer Preview */}
              {activeSubTab === "dashboard" && (
                <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-x-auto shadow-inner border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-[10px] text-slate-400 uppercase tracking-widest">
                    <span>SYSTEM_ORCHESTRATOR_LOG_MOCK</span>
                    <span className="text-emerald-500 font-bold animate-pulse">● READY FOR COUPLING</span>
                  </div>
                  <div>{"{"}</div>
                  <div className="pl-4 text-slate-400">"status": "AWAITING_EPIC_2_INTEGRATION",</div>
                  <div className="pl-4 text-slate-400">"scheduler": "active_standby",</div>
                  <div className="pl-4 text-slate-400">"supported_operations": [</div>
                  <div className="pl-8 text-indigo-400">"REFERENCE_DATA_MANAGEMENT",</div>
                  <div className="pl-8 text-indigo-400">"SCHEDULE_INGESTION_V2",</div>
                  <div className="pl-8 text-indigo-400">"ODDS_MARKET_CALIBRATION_V2",</div>
                  <div className="pl-8 text-indigo-400">"INJURY_AND_WEATHER_ANALYSIS"</div>
                  <div className="pl-4 text-slate-400">],</div>
                  <div className="pl-4 text-slate-400">"total_mock_schemas_mapped": 13</div>
                  <div>{"}"}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
