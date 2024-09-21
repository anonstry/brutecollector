# Este programa passará a usar Hydrogram!

from pathlib import Path
from tempfile import gettempdir

from dynaconf import settings
from telethon import TelegramClient

DOWNLOAD_DIR = Path.home() / "Downloads"
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

telegram_client_session_file_path = str(
    Path(gettempdir()) / settings.TELEGRAM_SESSION_NAME
)
telegram_client = TelegramClient(
    telegram_client_session_file_path,
    api_id=settings.TELEGRAM_API_ID,
    api_hash=settings.TELEGRAM_API_HASH,
)

