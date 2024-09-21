from dynaconf import settings
from hydrogram.client import Client

client: Client = Client(
    name=settings.TELEGRAM_APP_NAME,
    api_id=settings.TELEGRAM_API_ID,
    api_hash=settings.TELEGRAM_API_HASH,
    # plugins=dict(root="app.modules", exclude=["experimental"]),
)