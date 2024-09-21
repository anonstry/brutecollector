from pathlib import Path

from loguru import logger
from telethon.sync import events
from telethon.types import Message

from app._telethon import DOWNLOAD_DIR

download_command = r'(\.|\!)?(hmm|eita|baixando|carregando)'


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
            f"{self.media_path.name}-metadata"
        ).with_suffix(".txt")

    async def download(self):
        media_raw_path = await self.from_message.download_media(DOWNLOAD_DIR)
        self.media_path = Path(media_raw_path)
        with self.media_metadata_path.open("w") as file:
            metadata = list()  # Everything about the message
            metadata.append("Nothing yet")  # Needs to be improved
            file.writelines(metadata)

    async def reupload(self):
        await self.from_message.client.send_message(
            "me",  # Can be a specific channel later
            message=self.from_message.raw_text,
            formatting_entities=self.from_message.entities,
            file=str(self.media_path),
        )


async def collect_expirable_media(event):
    logger.info("Event triggered: Expirable media")
    media = DownloadableMedia(
        event.peer_id,
        event.message.id,
    )
    await media.load_from_message(event)
    await media.download()
    await media.reupload()


async def collect_media_from_reply(event):
    logger.info("Event triggered: Media from reply")
    media = DownloadableMedia(
        event.peer_id,
        event.message.reply_to_msg_id,
    )
    await media.load_from_message(event)
    await media.download()
    await media.reupload()


async def implement(client):
    client.add_event_handler(
        collect_expirable_media,
        events.NewMessage(
            incoming=True,
            func=lambda event: event.is_private
            and event.message.media
            and hasattr(event.message.media, "ttl_seconds")
            and event.message.media.ttl_seconds,
        ),
    )
    client.add_event_handler(
        collect_media_from_reply,
        events.NewMessage(
            outgoing=True,
            func=lambda event: event.message and event.message.text,
            # and len(event.message.text.split()) > 1
            # and len(event.message.text.split()[1].split(':') > 1),
            # Abstract idea of MessageLocation-like checkage
            pattern=download_command,
        ),
    )


