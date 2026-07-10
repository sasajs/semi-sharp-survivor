library(nflreadr)

output_path <- "../Input/nflverse/teams.csv"

teams <- nflreadr::load_teams()

if (nrow(teams) == 0) {
  stop("NFLVerse returned 0 teams. Export aborted. Existing CSV was not overwritten.")
}

if (!"team_abbr" %in% names(teams)) {
  stop("NFLVerse teams data does not contain team_abbr. Export aborted.")
}

write.csv(teams, output_path, row.names = FALSE)

cat("Exported NFLVerse teams to:", output_path, "\n")
cat("Rows:", nrow(teams), "\n")
