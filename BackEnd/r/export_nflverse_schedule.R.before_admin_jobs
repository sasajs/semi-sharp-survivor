library(nflreadr)

season <- 2026
output_path <- "../Input/nflverse/schedule_2026.csv"

schedule <- nflreadr::load_schedules(seasons = season)

if (nrow(schedule) == 0) {
  stop("NFLVerse returned 0 schedule rows. Export aborted.")
}

write.csv(schedule, output_path, row.names = FALSE)

cat("Exported NFLVerse schedule to:", output_path, "\n")
cat("Rows:", nrow(schedule), "\n")
