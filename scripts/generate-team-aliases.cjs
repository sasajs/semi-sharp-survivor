const fs = require("fs");
const path = require("path");

const teams = [
  ["ari","Arizona Cardinals","Arizona","Cardinals","ARI"],
  ["atl","Atlanta Falcons","Atlanta","Falcons","ATL"],
  ["bal","Baltimore Ravens","Baltimore","Ravens","BAL"],
  ["buf","Buffalo Bills","Buffalo","Bills","BUF"],
  ["car","Carolina Panthers","Carolina","Panthers","CAR"],
  ["chi","Chicago Bears","Chicago","Bears","CHI"],
  ["cin","Cincinnati Bengals","Cincinnati","Bengals","CIN"],
  ["cle","Cleveland Browns","Cleveland","Browns","CLE"],
  ["dal","Dallas Cowboys","Dallas","Cowboys","DAL"],
  ["den","Denver Broncos","Denver","Broncos","DEN"],
  ["det","Detroit Lions","Detroit","Lions","DET"],
  ["gb","Green Bay Packers","Green Bay","Packers","GB"],
  ["hou","Houston Texans","Houston","Texans","HOU"],
  ["ind","Indianapolis Colts","Indianapolis","Colts","IND"],
  ["jax","Jacksonville Jaguars","Jacksonville","Jaguars","JAX"],
  ["kc","Kansas City Chiefs","Kansas City","Chiefs","KC"],
  ["lv","Las Vegas Raiders","Las Vegas","Raiders","LV"],
  ["lac","Los Angeles Chargers","Los Angeles","Chargers","LAC"],
  ["lar","Los Angeles Rams","Los Angeles","Rams","LAR"],
  ["mia","Miami Dolphins","Miami","Dolphins","MIA"],
  ["min","Minnesota Vikings","Minnesota","Vikings","MIN"],
  ["ne","New England Patriots","New England","Patriots","NE"],
  ["no","New Orleans Saints","New Orleans","Saints","NO"],
  ["nyg","New York Giants","New York","Giants","NYG"],
  ["nyj","New York Jets","New York","Jets","NYJ"],
  ["phi","Philadelphia Eagles","Philadelphia","Eagles","PHI"],
  ["pit","Pittsburgh Steelers","Pittsburgh","Steelers","PIT"],
  ["sea","Seattle Seahawks","Seattle","Seahawks","SEA"],
  ["sf","San Francisco 49ers","San Francisco","49ers","SF"],
  ["tb","Tampa Bay Buccaneers","Tampa Bay","Buccaneers","TB"],
  ["ten","Tennessee Titans","Tennessee","Titans","TEN"],
  ["was","Washington Commanders","Washington","Commanders","WAS"],
];

const extra = {
  ari: ["AZ","Arizona Cards","Cards","Phoenix Cardinals","St. Louis Cardinals"],
  bal: ["Balt Ravens","Bmore Ravens"],
  buf: ["Buff Bills"],
  gb: ["GNB","Greenbay Packers"],
  hou: ["HST","Houston"],
  jax: ["JAC","Jags","Jacksonville Jags"],
  kc: ["K.C.","K C","KC Chiefs","K.C. Chiefs","Kansas City C","Chiefs Kingdom"],
  lac: ["LA Chargers","L.A. Chargers","San Diego Chargers","SD","SD Chargers"],
  lar: ["LA Rams","L.A. Rams","St. Louis Rams","STL","STL Rams"],
  lv: ["Las Vegas","LV Raiders","Oakland Raiders","OAK","Los Angeles Raiders"],
  ne: ["NWE","New Eng","New England"],
  no: ["NOS","NOLA","NOLA Saints"],
  nyg: ["NY Giants","New York G","Giants NY"],
  nyj: ["NY Jets","New York J","Jets NY"],
  sf: ["S.F.","San Fran","Niners","49rs","Forty Niners"],
  tb: ["Tampa","Bucs","TB Bucs","Tampa Bucs"],
  ten: ["Tenn","Houston Oilers","Oilers"],
  was: ["WSH","Washington Football Team","WFT","Washington Redskins","Skins"],
};

function normalize(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[.'’`,\-_/]/g, "")
    .replace(/\s+/g, "");
}

function csv(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const rows = [["team_id","alias","normalized_alias","provider_name","alias_type","priority","active","notes"]];
const seen = new Set();

function add(teamId, alias, providerName, aliasType, priority, notes = "") {
  if (!alias) return;
  const normalized = normalize(alias);
  const key = `${teamId}|${providerName}|${normalized}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push([teamId, alias, normalized, providerName, aliasType, priority, "true", notes]);
}

for (const [id, full, city, nick, abbr] of teams) {
  const base = [
    [id, "canonical_id", 100],
    [abbr, "abbreviation", 100],
    [abbr.toLowerCase(), "abbreviation", 100],
    [abbr.toUpperCase(), "abbreviation", 100],
    [full, "official_name", 100],
    [full.toLowerCase(), "official_name", 90],
    [full.toUpperCase(), "official_name", 90],
    [city, "city", 90],
    [city.toLowerCase(), "city", 80],
    [city.toUpperCase(), "city", 80],
    [nick, "nickname", 90],
    [nick.toLowerCase(), "nickname", 80],
    [nick.toUpperCase(), "nickname", 80],
    [`${abbr} ${nick}`, "common_variant", 85],
    [`${abbr.toLowerCase()} ${nick.toLowerCase()}`, "common_variant", 75],
    [`${city} ${nick}`, "common_variant", 85],
    [full.replace(/\s/g, ""), "normalized_variant", 75],
    [full.replace(/\s/g, "_"), "normalized_variant", 75],
    [full.replace(/\s/g, "-"), "normalized_variant", 75],
    [`${city.replace(/\s/g, "")}${nick}`, "normalized_variant", 70],
    [`${city}_${nick}`, "normalized_variant", 70],
    [`${city}-${nick}`, "normalized_variant", 70],
    [`${nick} Football`, "common_variant", 60],
    [`${city} Football`, "common_variant", 60],
    [`${full} Football`, "common_variant", 55],
  ];

  if (abbr.length === 2) {
    base.push([abbr.split("").join("."), "punctuation_variant", 70]);
    base.push([abbr.split("").join(" "), "spacing_variant", 70]);
  }

  for (const [alias, type, priority] of base) {
    add(id, alias, "internal", type, priority);
  }

  for (const alias of extra[id] || []) {
    add(id, alias, "internal", "common_or_historical_variant", 70);
  }

  for (const provider of ["nflverse","espn","pfr","covers","odds_api","draftkings","fanduel","circa"]) {
    add(id, abbr, provider, "provider_abbreviation", 85, `${provider} abbreviation`);
    add(id, full, provider, "provider_full_name", 80, `${provider} full name`);
    add(id, city, provider, "provider_city", 65, `${provider} city`);
    add(id, nick, provider, "provider_nickname", 65, `${provider} nickname`);
  }
}

fs.mkdirSync(path.join("data", "reference"), { recursive: true });
const outPath = path.join("data", "reference", "team_aliases.csv");
fs.writeFileSync(outPath, rows.map(r => r.map(csv).join(",")).join("\n") + "\n");
console.log(`Wrote ${outPath} with ${rows.length - 1} aliases`);
