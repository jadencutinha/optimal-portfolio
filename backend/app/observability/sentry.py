import logging

logger = logging.getLogger("optimal_portfolio")


def init_sentry(dsn: str | None, environment: str, traces_sample_rate: float) -> bool:
    if not dsn:
        return False
    try:
        import sentry_sdk
    except ImportError:
        logger.warning("SENTRY_DSN is set but sentry-sdk is not installed.")
        return False
    sentry_sdk.init(dsn=dsn, environment=environment, traces_sample_rate=traces_sample_rate)
    logger.info("Sentry initialized (environment=%s)", environment)
    return True


def capture_exception(exc: Exception) -> None:
    try:
        import sentry_sdk

        sentry_sdk.capture_exception(exc)
    except Exception:
        pass
