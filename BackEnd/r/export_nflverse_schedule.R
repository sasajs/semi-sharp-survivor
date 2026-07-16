library(nflreadr)

args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Usage: Rscript r/export_nflverse_schedule.R <season> [output_path]")
}

season <- suppressWarnings(as.integer(args[[1]]))

if (is.na(season) || season < 1999 || season > 2100) {
  stop("Season must be a valid four-digit year.")
}

if (length(args) >= 2) {
  output_path <- args[[2]]
} else {
  output_path <- file.path(
    "..",
    "Input",
    "nflverse",
    paste0("schedule_", season, ".csv")
  )
}

output_directory <- dirname(output_path)

if (!dir.exists(output_directory)) {
  dir.create(output_directory, recursive = TRUE)
}

schedule <- nflreadr::load_schedules(seasons = season)

if (nrow(schedule) == 0) {
  stop("NFLVerse returned 0 schedule rows. Export aborted.")
}

write.csv(schedule, output_path, row.names = FALSE)

cat("season=", season, "\n", sep = "")
cat("output_path=", normalizePath(output_path), "\n", sep = "")
cat("rows=", nrow(schedule), "\n", sep = "")
