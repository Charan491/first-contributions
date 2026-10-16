REVIEW_OUTCOMES = {"eligible", "ineligible", "pending"}


def validate_worker_data(outcome):
    if outcome not in REVIEW_OUTCOMES:
        return False, "Select a valid review outcome."
    return True, "Review recorded."