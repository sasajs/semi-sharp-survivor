#!/usr/bin/env python3
# File: ~/Projects/SemiSharp/BackEnd/scripts/tests/regression_test_full.py
from regression_test_fast import run as run_fast
from regression_test_base import *

def run():
    run_fast() # Runs all fast tests first
    test("[09] Projection Engine V2", lambda: assert_positive_count("projections.game_spreads"))
    test("[14] Strategy Current Week Highest Win", run_script("scripts/strategy/current_week_highest_win.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026_RECAL_V1", "--entry-id", "1"]))
    test("[15] Strategy Future Value", run_script("scripts/strategy/future_value.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026_RECAL_V1", "--entry-id", "1"]))
    test("[19] Strategy Monte Carlo", run_script("scripts/strategy/monte_carlo_survivor.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026_RECAL_V1"]))
    test("[20] Strategy Dynamic Programming", run_script("scripts/strategy/dynamic_programming.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026_RECAL_V1"]))
    test("[21] Strategy Bottom Six Road Fade", run_script("scripts/strategy/bottom_six_road_fade.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026_RECAL_V1"]))
    test("[22] Strategy Market Arbitrage Exit", run_script("scripts/strategy/market_arbitrage_exit.py", ["--season", "2026", "--contest-format", "CIRCA", "--rating-week", "1", "--hfa-source", "SEMISHARP_2026_RECAL_V1"]))
    test("[39] API Strategy Monte Carlo", api_get("/strategies/monte-carlo/2026/CIRCA"))
    test("[40] API Strategy Dynamic Programming", api_get("/strategies/dynamic-programming/2026/CIRCA"))
    test("[49] Compare Strategies Contract", validate_compare_contract)
    test("[50] Compare Strategies Leg Count", validate_compare_leg_count)
    test("[51] Compare Strategies Probability Horizons", validate_compare_probability_horizons)
    test("[52] Compare Strategies Current Consensus", validate_compare_current_consensus)
    test("[53] Compare Strategies Late-Leg Horizon", validate_compare_late_leg_horizon)
    test("[56] Season Management Smoke Test", run_script("scripts/tests/season_management_smoke_test.py", []))
    test("[57] Week 3 Recalculation", run_script("scripts/tests/week3_recalculation_test.py", []))
    
    finalize_report()

if __name__ == "__main__":
    run()
