from app.jobs.handlers import (
    build_features,
    health_check,
    nflverse_schedule_refresh,
)


JOB_HANDLERS = {
    "health_check": health_check,
    "build_features": build_features,
    "nflverse_schedule_refresh": nflverse_schedule_refresh,
}


def get_handler(job_type):
    handler = JOB_HANDLERS.get(job_type)

    if handler is None:
        raise ValueError(
            f"No handler registered for job type: {job_type}"
        )

    return handler
JOB_REGISTRY['market_odds_sync'] = refresh_market_odds
