from app.jobs.handlers import (
    health_check,
    build_features
)


JOB_HANDLERS = {
    "health_check": health_check,
    "build_features": build_features
}


def get_handler(job_type):

    handler = JOB_HANDLERS.get(job_type)

    if handler is None:
        raise ValueError(
            f"No handler registered for job type: {job_type}"
        )

    return handler
