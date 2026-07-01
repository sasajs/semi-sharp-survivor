import { 
  Activity, Award, Columns, TrendingUp, Settings2, Shield, Gift, FileText, History,
  Brain, Server, RefreshCw, Sliders, HelpCircle, Navigation, Play,
  Database, Fingerprint, Users, MapPin, ShieldAlert, Compass
} from "lucide-react";

export type NavigationSection = 
  | "user_working"
  | "user_future"
  | "admin_working"
  | "admin_future";

export interface FeatureConfig {
  key: string;
  label: string;
  route: string; // matches activeTab state value in App.tsx
  section: NavigationSection;
  status: "working" | "future_release" | "experimental" | "hidden";
  audience: "user" | "admin" | "developer";
  enabled: boolean;
  badge?: "Working" | "Future Release" | "Experimental" | "Backend Ready" | "Not Wired" | string;
  notes?: string;
  icon: any; // Lucide icon
  adminParams?: {
    initialTab?: "imports" | "reference" | "health" | "settings" | "diagnostics";
    initialImportTab?: "schedule" | "odds" | "weather" | "injuries" | "power_ratings";
    initialRefTab?: "teams" | "team-aliases" | "venues" | "venue-aliases";
    initialDiagTab?: string;
  };
}

// Single config value to control future release visibility
export const SHOW_FUTURE_RELEASES = true;

// Global control flag - can be overridden via localStorage/window for testing/demo
export const SHOW_EXPERIMENTAL_FEATURES = 
  (typeof window !== "undefined" && (window as any).SHOW_EXPERIMENTAL_FEATURES === true) || 
  (typeof window !== "undefined" && localStorage.getItem("SHOW_EXPERIMENTAL") === "true");

export const FEATURES: Record<string, FeatureConfig> = {
  // ==========================================
  // SECTION 1: USER DASHBOARD (WORKING)
  // ==========================================
  "dashboard": {
    key: "dashboard",
    label: "Dashboard Overview",
    route: "dashboard",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Activity,
  },
  "roadmaps": {
    key: "roadmaps",
    label: "My Roadmaps",
    route: "roadmaps",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Compass,
  },
  "recommendations": {
    key: "recommendations",
    label: "My Recommendations",
    route: "recommendations",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: TrendingUp,
  },
  "circa-rules": {
    key: "circa-rules",
    label: "Circa Survivor Rules & Leg Map",
    route: "circa-rules",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Award,
  },
  "entries": {
    key: "entries",
    label: "Portfolio Entries",
    route: "entries",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Columns,
  },
  "picks": {
    key: "picks",
    label: "Weekly Pick Matrix",
    route: "picks",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: TrendingUp,
  },
  "inventory": {
    key: "inventory",
    label: "Full 32 Team Inventory",
    route: "inventory",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Settings2,
  },
  "thanksgiving": {
    key: "thanksgiving",
    label: "Thanksgiving Shield",
    route: "thanksgiving",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Shield,
  },
  "christmas": {
    key: "christmas",
    label: "Christmas Day Preservation",
    route: "christmas",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: Gift,
  },
  "reports": {
    key: "reports",
    label: "Contest Equity Report",
    route: "reports",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: FileText,
  },
  "recommendation-audits": {
    key: "recommendation-audits",
    label: "Recommendation Audit",
    route: "recommendation-audits",
    section: "user_working",
    status: "working",
    audience: "user",
    enabled: true,
    badge: "Working",
    icon: History,
  },

  // ==========================================
  // SECTION 2: USER DASHBOARD - FUTURE RELEASES
  // ==========================================
  "recommendation-confidence": {
    key: "recommendation-confidence",
    label: "Confidence & Stability",
    route: "recommendation-confidence",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Activity,
  },
  "recommendation-consensus": {
    key: "recommendation-consensus",
    label: "Consensus Analysis",
    route: "recommendation-consensus",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Activity,
  },
  "recommendation-portfolio": {
    key: "recommendation-portfolio",
    label: "Portfolio Optimizer",
    route: "recommendation-portfolio",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Sliders,
  },
  "contest-ev": {
    key: "contest-ev",
    label: "Contest EV Optimizer",
    route: "contest-ev",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Sliders,
  },
  "ownership-calibration": {
    key: "ownership-calibration",
    label: "Ownership Calibration",
    route: "ownership-calibration",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Brain,
  },
  "market-calibration": {
    key: "market-calibration",
    label: "Market Calibration",
    route: "market-calibration",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Brain,
  },
  "model-performance": {
    key: "model-performance",
    label: "Model Performance",
    route: "model-performance",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Activity,
  },
  "rolling-validation": {
    key: "rolling-validation",
    label: "Rolling Validation",
    route: "rolling-validation",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Server,
  },
  "model-drift": {
    key: "model-drift",
    label: "Model Drift Analysis",
    route: "model-drift",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: RefreshCw,
  },
  "model-weights": {
    key: "model-weights",
    label: "Adaptive Weights",
    route: "model-weights",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Sliders,
  },
  "decision-policies": {
    key: "decision-policies",
    label: "Decision Policies",
    route: "decision-policies",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Brain,
  },
  "survivor-decisions": {
    key: "survivor-decisions",
    label: "Survivor Decisions",
    route: "survivor-decisions",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: HelpCircle,
  },
  "survivor-plans": {
    key: "survivor-plans",
    label: "Survivor Plans",
    route: "survivor-plans",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Navigation,
  },
  "championship-plans": {
    key: "championship-plans",
    label: "Championship Plans",
    route: "championship-plans",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Award,
  },
  "decision-analytics": {
    key: "decision-analytics",
    label: "Decision Analytics",
    route: "decision-analytics",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: Activity,
  },
  "weekly-learning": {
    key: "weekly-learning",
    label: "Weekly Learning Loop",
    route: "weekly-learning",
    section: "user_future",
    status: "future_release",
    audience: "user",
    enabled: true,
    badge: "Future Release",
    icon: RefreshCw,
  },

  // ==========================================
  // SECTION 3: ADMIN DASHBOARD (WORKING)
  // ==========================================
  "admin-settings": {
    key: "admin-settings",
    label: "Admin Dashboard",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: ShieldAlert,
    adminParams: {
      initialTab: "settings"
    }
  },
  "admin-data-ops": {
    key: "admin-data-ops",
    label: "Data Operations Dashboard",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: Database,
    adminParams: {
      initialTab: "health"
    }
  },
  "admin-team-aliases": {
    key: "admin-team-aliases",
    label: "Team Aliases",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: Fingerprint,
    adminParams: {
      initialTab: "reference",
      initialRefTab: "team-aliases"
    }
  },
  "admin-schedule-import": {
    key: "admin-schedule-import",
    label: "Schedule Import",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: Sliders,
    adminParams: {
      initialTab: "imports",
      initialImportTab: "schedule"
    }
  },
  "admin-import-history": {
    key: "admin-import-history",
    label: "Import History",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: History,
    adminParams: {
      initialTab: "health"
    }
  },
  "admin-data-quality": {
    key: "admin-data-quality",
    label: "Data Quality Logs",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: FileText,
    adminParams: {
      initialTab: "health"
    }
  },
  "admin-teams-master": {
    key: "admin-teams-master",
    label: "Teams Master",
    route: "admin",
    section: "admin_working",
    status: "working",
    audience: "admin",
    enabled: true,
    badge: "Working",
    icon: Users,
    adminParams: {
      initialTab: "reference",
      initialRefTab: "teams"
    }
  },

  // ==========================================
  // SECTION 4: ADMIN DASHBOARD - FUTURE RELEASES
  // ==========================================
  "admin-ref-intel": {
    key: "admin-ref-intel",
    label: "Reference Intelligence",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Not Wired",
    icon: HelpCircle,
    adminParams: {
      initialTab: "diagnostics",
      initialDiagTab: "recommendation-audits"
    }
  },
  "admin-venues": {
    key: "admin-venues",
    label: "Venues Configuration",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Backend Ready",
    icon: MapPin,
    adminParams: {
      initialTab: "reference",
      initialRefTab: "venues"
    }
  },
  "admin-venue-aliases": {
    key: "admin-venue-aliases",
    label: "Venue Aliases",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Backend Ready",
    icon: Navigation,
    adminParams: {
      initialTab: "reference",
      initialRefTab: "venue-aliases"
    }
  },
  "admin-odds-import": {
    key: "admin-odds-import",
    label: "Odds Import",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Backend Ready",
    icon: Sliders,
    adminParams: {
      initialTab: "imports",
      initialImportTab: "odds"
    }
  },
  "admin-injury-import": {
    key: "admin-injury-import",
    label: "Injury Import",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Backend Ready",
    icon: Sliders,
    adminParams: {
      initialTab: "imports",
      initialImportTab: "injuries"
    }
  },
  "admin-weather-import": {
    key: "admin-weather-import",
    label: "Weather Import",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Backend Ready",
    icon: Sliders,
    adminParams: {
      initialTab: "imports",
      initialImportTab: "weather"
    }
  },
  "admin-power-ratings": {
    key: "admin-power-ratings",
    label: "Power Ratings",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Backend Ready",
    icon: Sliders,
    adminParams: {
      initialTab: "imports",
      initialImportTab: "power_ratings"
    }
  },
  "admin-workflow-orchestration": {
    key: "admin-workflow-orchestration",
    label: "Workflow Orchestration",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Experimental",
    icon: Play,
    adminParams: {
      initialTab: "diagnostics",
      initialDiagTab: "workflows"
    }
  },
  "admin-artifacts": {
    key: "admin-artifacts",
    label: "Artifacts & Reports Diagnostics",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Experimental",
    icon: FileText,
    adminParams: {
      initialTab: "diagnostics",
      initialDiagTab: "recommendation-audits"
    }
  },
  "admin-backend": {
    key: "admin-backend",
    label: "Backend Diagnostics",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Experimental",
    icon: Server,
    adminParams: {
      initialTab: "health"
    }
  },
  "admin-pipeline": {
    key: "admin-pipeline",
    label: "Pipeline Monitoring",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Experimental",
    icon: Activity,
    adminParams: {
      initialTab: "health"
    }
  },
  "admin-model-diags": {
    key: "admin-model-diags",
    label: "Model Diagnostics",
    route: "admin",
    section: "admin_future",
    status: "future_release",
    audience: "admin",
    enabled: true,
    badge: "Experimental",
    icon: Brain,
    adminParams: {
      initialTab: "diagnostics",
      initialDiagTab: "model-performance"
    }
  }
};

/**
 * Checks if a specific feature should be displayed to the user.
 */
export function isFeatureVisible(featureId: string): boolean {
  const legacyMap: Record<string, string> = {
    "odds_import": "admin-odds-import",
    "weather_import": "admin-weather-import",
    "injury_import": "admin-injury-import",
    "power_ratings": "admin-power-ratings",
    "venues_config": "admin-venues",
    "venue_aliases": "admin-venue-aliases",
    "reports": "reports"
  };

  const key = legacyMap[featureId] || featureId;
  const feature = FEATURES[key];
  if (!feature) return false;
  if (!feature.enabled) return false;
  if (feature.status === "hidden") return false;
  
  if (feature.status === "experimental") {
    return SHOW_EXPERIMENTAL_FEATURES;
  }
  if (feature.status === "future_release") {
    return SHOW_FUTURE_RELEASES || SHOW_EXPERIMENTAL_FEATURES;
  }
  return true;
}
