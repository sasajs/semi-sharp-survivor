-- Migration V030: Entry Metadata and Explainability Refinement
-- Safe to run repeatedly (Idempotent)

-- Update UWOSH-1 Metadata and Profile
UPDATE entry_metadata 
SET owner_name = 'Steve', 
    entry_description = 'Steve personal entry #1', 
    primary_goal = 'Maximize championship expected value',
    active_flag = TRUE
WHERE entry_id = 'UWOSH-1';

UPDATE entry_strategy_profiles
SET strategy_type = 'CHAMPIONSHIP_EV',
    risk_tolerance = 'HIGH'
WHERE entry_id = 'UWOSH-1';

-- Update UWOSH-2 Metadata and Profile
UPDATE entry_metadata 
SET owner_name = 'Steve', 
    entry_description = 'Steve personal entry #2', 
    primary_goal = 'Diversify from UWOSH-1 and maximize combined portfolio EV',
    active_flag = TRUE
WHERE entry_id = 'UWOSH-2';

UPDATE entry_strategy_profiles
SET strategy_type = 'PORTFOLIO_EV',
    risk_tolerance = 'MEDIUM',
    diversification_group = 'Steve Portfolio'
WHERE entry_id = 'UWOSH-2';

-- Update UWOSH-3 Metadata and Profile
UPDATE entry_metadata 
SET owner_name = 'Cameron', 
    entry_description = 'Cameron personal entry', 
    primary_goal = 'Survive past mid-season and preserve marketplace resale value',
    active_flag = TRUE
WHERE entry_id = 'UWOSH-3';

UPDATE entry_strategy_profiles
SET strategy_type = 'MARKETPLACE_SURVIVAL',
    risk_tolerance = 'LOW'
WHERE entry_id = 'UWOSH-3';

-- Update UWOSH-4 Metadata and Profile
UPDATE entry_metadata 
SET owner_name = 'UW Oshkosh IS Group', 
    entry_description = 'Group entry for 9 people including Steve, Cameron, and 7 UW Oshkosh IS department participants', 
    primary_goal = 'Maximize group survival probability and reduce volatility',
    active_flag = TRUE
WHERE entry_id = 'UWOSH-4';

UPDATE entry_strategy_profiles
SET strategy_type = 'GROUP_SURVIVAL',
    risk_tolerance = 'VERY_LOW'
WHERE entry_id = 'UWOSH-4';
