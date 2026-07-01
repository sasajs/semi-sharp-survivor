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

const historical = {
  was: ["Washington Redskins","Washington Football Team","WFT"],
  lv: ["Oakland Raiders","Los Angeles Raiders","OAK"],
  lac: ["San Diego Chargers","SD Chargers","SD"],
  lar: ["St. Louis Rams","STL Rams","STL"],
  ari: ["Phoenix Cardinals","St. Louis Cardinals"],
  ten: ["Houston Oilers","Oilers"],
};

function normalize(s) {
  return s.toLowerCase().trim().replace(/[\.\,'’\-_]/g, "").replace(/\s+/g, "");
}

function csvEscape(s) {
  const str = String(s ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const rows = [["team_id","alias","normalized_alias","provider_name","alias_type","priority","active","notes"]];
const seen = new Set();

function add(teamId, alias, provider, type, priority, notes="") {
  if (!alias) return;
  const norm = normalize(alias);
  const key = `${teamId}|${provider}|${norm}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push([teamId, alias, norm, provider, type, priority, "true", notes]);
}

for (const [id, full, city, nick, abbr] of teams) {
  const variants = [
    [id, "internal", "canonical_id", 100],
    [abbr, "internal", "abbreviation", 100],
    [abbr.toLowerCase(), "internal", "abbreviation", 100],
    [full, "internal", "official_name", 100],
    [full.toUpperCase(), "internal", "official_name", 90],
    [full.toLowerCase(), "internal", "official_name", 90],
    [city, "internal", "city", 90],
    [city.toUpperCase(), "internal", "city", 80],
    [city.toLowerCase(), "internal", "city", 80],
    [nick, "internal", "nickname", 90],
    [nick.toUpperCase(), "internal", "nickname", 80],
    [nick.toLowerCase(), "internal", "nickname", 80],
    [`${abbr} ${nick}`, "internal", "common_variant", 85],
    [`${city} ${nick}`, "internal", "common_variant", 85],
    [full.replace(/\s/g, ""), "internal", "normalized_variant", 75],
    [full.replace(/\s/g, "_"), "internal", "normalized_variant", 75],
    [full.replace(/\s/g, "-"), "internal", "normalized_variant", 75],
    [`${nick} Football`, "internal", "common_variant", 60],
    [`${city} Football`, "internal", "common_variant", 60],
  ];

  if (abbr.length === 2) {
    variants.push([abbr.split("").join("."), "internal", "punctuation_variant", 70]);
    variants.push([abbr.split("").join(" "), "internal", "spacing_variant", 70]);
  }

  if (id === "lac") variants.push(["LA Chargers","internal","common_variant",90],["Los Angeles LAC","internal","provider_variant",60]);
  if (id === "lar") variants.push(["LA Rams","internal","common_variant",90],["Los Angeles LAR","internal","provider_variant",60]);
  if (id === "gb") variants.push(["Greenbay Packers","internal","common_variant",70],["GNB","provider","provider_variant",70]);
  if (id === "jax") variants.push(["JAC","provider","provider_variant",70]);
  if (id === "no") variants.push(["NOS","provider","provider_variant",70],["NOLA Saints","internal","common_variant",75]);
  if (id === "sf") variants.push(["S.F.","internal","punctuation_variant",70],["San Fran","internal","common_variant",70],["Niners","internal","nickname",70]);
  if (id === "tb") variants.push(["Tampa","internal","city",70],["Bucs","internal","nickname",80]);
  if (id === "ne") variants.push(["New Eng","internal","common_variant",70],["NWE","provider","provider_variant",70]);
  if (id === "was") variants.push(["WSH","provider","provider_variant",85],["Washington Football","internal","common_variant",60]);

  for (const [alias, provider, type, priority] of variants) add(id, alias, provider, type, priority);

  for (const provider of ["nflverse","espn","pfr","covers","odds_api","draftkings","fanduel"]) {
    add(id, abbr, provider, "provider_variant", 85, `${provider} abbreviation`);
    add(id, full, provider, "provider_variant", 80, `${provider} full name`);
  }

  for (const alias of historical[id] || []) {
    add(id, alias, "internal", "historical", 50, "Historical or legacy team name");
  }
}

const out = rows.map(r => r.map(csvEscape).join(",")).join("\n") + "\n";
const outPath = path.join("data", "reference", "team_aliases.csv");
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath} with ${rows.length - 1} aliases`);
