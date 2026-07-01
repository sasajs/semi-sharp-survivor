-- ====================================================================
-- SEMI-SHARP V2: V064__SeedTeamAliases.sql
-- Backfill/seed team_aliases for all 32 NFL teams to guarantee data completeness.
-- ====================================================================

-- ARI (Arizona Cardinals)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('ari', 'ari', 'ari', 'common'),
('ari', 'ARI', 'ari', 'abbreviation'),
('ari', 'Arizona Cardinals', 'arizonacardinals', 'full_name'),
('ari', 'Arizona', 'arizona', 'city'),
('ari', 'Cardinals', 'cardinals', 'nickname'),
('ari', 'AZ', 'az', 'abbreviation'),
('ari', 'Ariz', 'ariz', 'historical')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- ATL (Atlanta Falcons)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('atl', 'atl', 'atl', 'common'),
('atl', 'ATL', 'atl', 'abbreviation'),
('atl', 'Atlanta Falcons', 'atlantafalcons', 'full_name'),
('atl', 'Atlanta', 'atlanta', 'city'),
('atl', 'Falcons', 'falcons', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- BAL (Baltimore Ravens)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('bal', 'bal', 'bal', 'common'),
('bal', 'BAL', 'bal', 'abbreviation'),
('bal', 'Baltimore Ravens', 'baltimoreravens', 'full_name'),
('bal', 'Baltimore', 'baltimore', 'city'),
('bal', 'Ravens', 'ravens', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- BUF (Buffalo Bills)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('buf', 'buf', 'buf', 'common'),
('buf', 'BUF', 'buf', 'abbreviation'),
('buf', 'Buffalo Bills', 'buffalobills', 'full_name'),
('buf', 'Buffalo', 'buffalo', 'city'),
('buf', 'Bills', 'bills', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- CAR (Carolina Panthers)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('car', 'car', 'car', 'common'),
('car', 'CAR', 'car', 'abbreviation'),
('car', 'Carolina Panthers', 'carolinapanthers', 'full_name'),
('car', 'Carolina', 'carolina', 'city'),
('car', 'Panthers', 'panthers', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- CHI (Chicago Bears)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('chi', 'chi', 'chi', 'common'),
('chi', 'CHI', 'chi', 'abbreviation'),
('chi', 'Chicago Bears', 'chicagobears', 'full_name'),
('chi', 'Chicago', 'chicago', 'city'),
('chi', 'Bears', 'bears', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- CIN (Cincinnati Bengals)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('cin', 'cin', 'cin', 'common'),
('cin', 'CIN', 'cin', 'abbreviation'),
('cin', 'Cincinnati Bengals', 'cincinnatibengals', 'full_name'),
('cin', 'Cincinnati', 'cincinnati', 'city'),
('cin', 'Bengals', 'bengals', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- CLE (Cleveland Browns)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('cle', 'cle', 'cle', 'common'),
('cle', 'CLE', 'cle', 'abbreviation'),
('cle', 'Cleveland Browns', 'clevelandbrowns', 'full_name'),
('cle', 'Cleveland', 'cleveland', 'city'),
('cle', 'Browns', 'browns', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- DAL (Dallas Cowboys)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('dal', 'dal', 'dal', 'common'),
('dal', 'DAL', 'dal', 'abbreviation'),
('dal', 'Dallas Cowboys', 'dallascowboys', 'full_name'),
('dal', 'Dallas', 'dallas', 'city'),
('dal', 'Cowboys', 'cowboys', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- DEN (Denver Broncos)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('den', 'den', 'den', 'common'),
('den', 'DEN', 'den', 'abbreviation'),
('den', 'Denver Broncos', 'denverbroncos', 'full_name'),
('den', 'Denver', 'denver', 'city'),
('den', 'Broncos', 'broncos', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- DET (Detroit Lions)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('det', 'det', 'det', 'common'),
('det', 'DET', 'det', 'abbreviation'),
('det', 'Detroit Lions', 'detroitlions', 'full_name'),
('det', 'Detroit', 'detroit', 'city'),
('det', 'Lions', 'lions', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- GB (Green Bay Packers)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('gb', 'gb', 'gb', 'common'),
('gb', 'GB', 'gb', 'abbreviation'),
('gb', 'Green Bay Packers', 'greenbaypackers', 'full_name'),
('gb', 'Green Bay', 'greenbay', 'city'),
('gb', 'Packers', 'packers', 'nickname'),
('gb', 'GNB', 'gnb', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- HOU (Houston Texans)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('hou', 'hou', 'hou', 'common'),
('hou', 'HOU', 'hou', 'abbreviation'),
('hou', 'Houston Texans', 'houstontexans', 'full_name'),
('hou', 'Houston', 'houston', 'city'),
('hou', 'Texans', 'texans', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- IND (Indianapolis Colts)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('ind', 'ind', 'ind', 'common'),
('ind', 'IND', 'ind', 'abbreviation'),
('ind', 'Indianapolis Colts', 'indianapoliscolts', 'full_name'),
('ind', 'Indianapolis', 'indianapolis', 'city'),
('ind', 'Colts', 'colts', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- JAX (Jacksonville Jaguars)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('jax', 'jax', 'jax', 'common'),
('jax', 'JAX', 'jax', 'abbreviation'),
('jax', 'Jacksonville Jaguars', 'jacksonvillejaguars', 'full_name'),
('jax', 'Jacksonville', 'jacksonville', 'city'),
('jax', 'Jaguars', 'jaguars', 'nickname'),
('jax', 'JAC', 'jac', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- KC (Kansas City Chiefs)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('kc', 'kc', 'kc', 'common'),
('kc', 'KC', 'kc', 'abbreviation'),
('kc', 'Kansas City Chiefs', 'kansascitychiefs', 'full_name'),
('kc', 'Kansas City', 'kansascity', 'city'),
('kc', 'Chiefs', 'chiefs', 'nickname'),
('kc', 'KAN', 'kan', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- LAC (Los Angeles Chargers)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('lac', 'lac', 'lac', 'common'),
('lac', 'LAC', 'lac', 'abbreviation'),
('lac', 'Los Angeles Chargers', 'losangeleschargers', 'full_name'),
('lac', 'Los Angeles', 'losangeles', 'city'),
('lac', 'Chargers', 'chargers', 'nickname'),
('lac', 'LA Chargers', 'lachargers', 'common'),
('lac', 'San Diego Chargers', 'sandiegochargers', 'historical'),
('lac', 'SD', 'sd', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- LAR (Los Angeles Rams)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('lar', 'lar', 'lar', 'common'),
('lar', 'LAR', 'lar', 'abbreviation'),
('lar', 'Los Angeles Rams', 'losangelesrams', 'full_name'),
('lar', 'Los Angeles', 'losangeles', 'city'),
('lar', 'Rams', 'rams', 'nickname'),
('lar', 'LA Rams', 'larams', 'common'),
('lar', 'St Louis Rams', 'stlouisrams', 'historical'),
('lar', 'STL', 'stl', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- LV (Las Vegas Raiders)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('lv', 'lv', 'lv', 'common'),
('lv', 'LV', 'lv', 'abbreviation'),
('lv', 'Las Vegas Raiders', 'lasvegasraiders', 'full_name'),
('lv', 'Las Vegas', 'lasvegas', 'city'),
('lv', 'Raiders', 'raiders', 'nickname'),
('lv', 'Vegas Raiders', 'vegasraiders', 'common'),
('lv', 'Oakland Raiders', 'oaklandraiders', 'historical'),
('lv', 'LVR', 'lvr', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- MIA (Miami Dolphins)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('mia', 'mia', 'mia', 'common'),
('mia', 'MIA', 'mia', 'abbreviation'),
('mia', 'Miami Dolphins', 'miamidolphins', 'full_name'),
('mia', 'Miami', 'miami', 'city'),
('mia', 'Dolphins', 'dolphins', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- MIN (Minnesota Vikings)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('min', 'min', 'min', 'common'),
('min', 'MIN', 'min', 'abbreviation'),
('min', 'Minnesota Vikings', 'minnesotavikings', 'full_name'),
('min', 'Minnesota', 'minnesota', 'city'),
('min', 'Vikings', 'vikings', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- NE (New England Patriots)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('ne', 'ne', 'ne', 'common'),
('ne', 'NE', 'ne', 'abbreviation'),
('ne', 'New England Patriots', 'newenglandpatriots', 'full_name'),
('ne', 'New England', 'newengland', 'city'),
('ne', 'Patriots', 'patriots', 'nickname'),
('ne', 'NWE', 'nwe', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- NO (New Orleans Saints)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('no', 'no', 'no', 'common'),
('no', 'NO', 'no', 'abbreviation'),
('no', 'New Orleans Saints', 'neworleanssaints', 'full_name'),
('no', 'New Orleans', 'neworleans', 'city'),
('no', 'Saints', 'saints', 'nickname'),
('no', 'NOR', 'nor', 'abbreviation')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- NYG (New York Giants)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('nyg', 'nyg', 'nyg', 'common'),
('nyg', 'NYG', 'nyg', 'abbreviation'),
('nyg', 'New York Giants', 'newyorkgiants', 'full_name'),
('nyg', 'New York', 'newyork', 'city'),
('nyg', 'Giants', 'giants', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- NYJ (New York Jets)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('nyj', 'nyj', 'nyj', 'common'),
('nyj', 'NYJ', 'nyj', 'abbreviation'),
('nyj', 'New York Jets', 'newyorkjets', 'full_name'),
('nyj', 'New York', 'newyork', 'city'),
('nyj', 'Jets', 'jets', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- PHI (Philadelphia Eagles)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('phi', 'phi', 'phi', 'common'),
('phi', 'PHI', 'phi', 'abbreviation'),
('phi', 'Philadelphia Eagles', 'philadelphiaeagles', 'full_name'),
('phi', 'Philadelphia', 'philadelphia', 'city'),
('phi', 'Eagles', 'eagles', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- PIT (Pittsburgh Steelers)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('pit', 'pit', 'pit', 'common'),
('pit', 'PIT', 'pit', 'abbreviation'),
('pit', 'Pittsburgh Steelers', 'pittsburghsteelers', 'full_name'),
('pit', 'Pittsburgh', 'pittsburgh', 'city'),
('pit', 'Steelers', 'steelers', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- SEA (Seattle Seahawks)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('sea', 'sea', 'sea', 'common'),
('sea', 'SEA', 'sea', 'abbreviation'),
('sea', 'Seattle Seahawks', 'seattleseahawks', 'full_name'),
('sea', 'Seattle', 'seattle', 'city'),
('sea', 'Seahawks', 'seahawks', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- SF (San Francisco 49ers)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('sf', 'sf', 'sf', 'common'),
('sf', 'SF', 'sf', 'abbreviation'),
('sf', 'San Francisco 49ers', 'sanfrancisco49ers', 'full_name'),
('sf', 'San Francisco', 'sanfrancisco', 'city'),
('sf', '49ers', '49ers', 'nickname'),
('sf', 'SFO', 'sfo', 'abbreviation'),
('sf', 'Niners', 'niners', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- TB (Tampa Bay Buccaneers)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('tb', 'tb', 'tb', 'common'),
('tb', 'TB', 'tb', 'abbreviation'),
('tb', 'Tampa Bay Buccaneers', 'tampabaybuccaneers', 'full_name'),
('tb', 'Tampa Bay', 'tampabay', 'city'),
('tb', 'Buccaneers', 'buccaneers', 'nickname'),
('tb', 'TBB', 'tbb', 'abbreviation'),
('tb', 'Bucs', 'bucs', 'nickname')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- TEN (Tennessee Titans)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('ten', 'ten', 'ten', 'common'),
('ten', 'TEN', 'ten', 'abbreviation'),
('ten', 'Tennessee Titans', 'tennesseetitans', 'full_name'),
('ten', 'Tennessee', 'tennessee', 'city'),
('ten', 'Titans', 'titans', 'nickname'),
('ten', 'Houston Oilers', 'houstonoilers', 'historical')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;

-- WAS (Washington Commanders)
INSERT INTO team_aliases (team_id, alias, normalized_alias, alias_type) VALUES
('was', 'was', 'was', 'common'),
('was', 'WAS', 'was', 'abbreviation'),
('was', 'Washington Commanders', 'washingtoncommanders', 'full_name'),
('was', 'Washington', 'washington', 'city'),
('was', 'Commanders', 'commanders', 'nickname'),
('was', 'WSH', 'wsh', 'abbreviation'),
('was', 'Washington Football Team', 'washingtonfootballteam', 'historical'),
('was', 'Football Team', 'footballteam', 'nickname'),
('was', 'Redskins', 'redskins', 'historical')
ON CONFLICT (normalized_alias, provider_name) DO NOTHING;
