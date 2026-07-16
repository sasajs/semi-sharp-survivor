def health_check(payload):

    return {
        "status": "ok",
        "message": payload.get(
            "message",
            "SemiSharp worker healthy"
        )
    }


def build_features(payload):

    season = payload.get("season")
    week = payload.get("week")

    if season is None or week is None:
        raise ValueError(
            "build_features requires season and week"
        )

    return {
        "status": "ok",
        "job": "build_features",
        "season": season,
        "week": week,
        "message": "Feature build placeholder complete"
    }
