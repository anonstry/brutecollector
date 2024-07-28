# Este programa passará a usar Hydrogram!

from pathlib import Path
from tempfile import gettempdir

from dynaconf import settings
from telethon import TelegramClient
from telethon.types import Message


telegram_client_session_file_path = str(Path(gettempdir()) / settings.TELEGRAM_SESSION_NAME)
telegram_client = TelegramClient(
    telegram_client_session_file_path,
    api_id=settings.TELEGRAM_API_ID,
    api_hash=settings.TELEGRAM_API_HASH,
)


class DownloadableMedia:
    def __init__(
        self,
        from_chat_id: int,
        from_message_id: int,
    ):
        self.from_chat_id: int = from_chat_id
        self.from_message_id: int = from_message_id
        self.media_path: Path = None
        self.from_message: Message = None

    async def load_from_message(self, event):
        self.from_message = await event.client.get_messages(
            entity=await event.get_input_chat(),
            ids=self.from_message_id,
        )

    @property
    def media_metadata_path(self) -> Path:
        "Dynamically generated"
        return self.media_path.with_name(
            f'{self.media_path.name}-metadata'
        ).with_suffix('.txt')

    async def download(self):
        media_raw_path = await self.from_message.download_media(gettempdir())
        self.media_path = Path(media_raw_path)
        with self.media_metadata_path.open('w') as file:
            metadata = list()   # Everything about the message
            metadata.append('Nothing yet')   # Needs to be improved
            file.writelines(metadata)

    async def reupload(self):
        await self.from_message.client.send_message(
            'me',  # Can be a specific channel later
            message=self.from_message.raw_text,
            formatting_entities=self.from_message.entities,
            file=str(self.media_path),
        )


from dynaconf import settings
from hydrogram import Client

from git.repo import Repo


from pathlib import Path

DOWNLOAD_DIR = Path.home() / "Downloads"
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

client: Client = Client(
    name=settings.TELEGRAM_APP_NAME,
    api_id=settings.TELEGRAM_API_ID,
    api_hash=settings.TELEGRAM_API_HASH,
    bot_token=settings.TELEGRAM_BOT_TOKEN,
    plugins=dict(root="src.modules", exclude=["experimental"]),
)

git_repository = Repo(search_parent_directories=True)
# git_repository_remote_link = git_repository.remotes[0].config_reader.get("url")
latest_git_repository_tag = sorted(
    git_repository.tags, key=lambda tag: tag.commit.committed_datetime
)[-1].name
latest_git_repository_commit_shorted = git_repository.git.rev_parse(
    git_repository.head.commit.hexsha, short=True
)
