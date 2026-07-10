import time

from app.jobs.queue import (
    claim_job,
    complete_job,
    fail_job
)

from app.jobs.registry import get_handler


def run():

    print("SemiSharp worker started")

    while True:

        job = claim_job()

        if job is None:
            time.sleep(5)
            continue

        job_id = job["job_id"]

        print(
            f"Processing job {job_id}: "
            f"{job['job_type']}"
        )

        try:

            handler = get_handler(
                job["job_type"]
            )

            result = handler(
                job["request_payload"]
            )

            complete_job(
                job_id,
                result
            )

            print(
                f"Completed job {job_id}"
            )

        except Exception as exc:

            print(
                f"Job {job_id} failed: {exc}"
            )

            fail_job(
                job_id,
                exc
            )


if __name__ == "__main__":
    run()
