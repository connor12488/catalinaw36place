from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


CONNECTION_ENV_NAMES = (
    "POSTGRES_URL",
    "DATABASE_URL",
    "POSTGRES_URL_NON_POOLING",
)

ALLOWED_URI_QUERY_PARAMS = {
    "application_name",
    "connect_timeout",
    "gssencmode",
    "keepalives",
    "keepalives_count",
    "keepalives_idle",
    "keepalives_interval",
    "options",
    "sslcert",
    "sslcompression",
    "sslcrl",
    "sslkey",
    "sslmode",
    "sslrootcert",
    "target_session_attrs",
}


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


def get_connection_url() -> str:
    for env_name in CONNECTION_ENV_NAMES:
        value = os.getenv(env_name)
        if value:
            return sanitize_connection_url(value)

    names = ", ".join(CONNECTION_ENV_NAMES)
    raise RuntimeError(f"Missing Postgres connection string. Set one of: {names}")


def sanitize_connection_url(connection_url: str) -> str:
    parsed = urlsplit(connection_url)

    if not parsed.query:
        return connection_url

    kept_params = []
    removed_params = []

    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        if key in ALLOWED_URI_QUERY_PARAMS:
            kept_params.append((key, value))
        else:
            removed_params.append(key)

    if removed_params:
        removed = ", ".join(sorted(set(removed_params)))
        print(f"Ignoring unsupported Postgres URI query parameter(s): {removed}")

    return urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        urlencode(kept_params),
        parsed.fragment,
    ))

