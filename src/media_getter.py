from loguru import logger
from telethon.sync import events

from brutecollector import DownloadableMedia, personal_commands


async def collect_expirable_media(event):
    logger.info('Event triggered: Expirable media')
    media = DownloadableMedia(
        event.peer_id,
        event.message.id,
    )
    await media.load_from_message(event)
    await media.download()
    await media.reupload()


async def collect_media_from_reply(event):
    logger.info('Event triggered: Media from reply')
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
            and hasattr(event.message.media, 'ttl_seconds')
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
            # A abstract idea of MessageLocation-like checkage
            pattern=personal_commands.collect_media_from_reply,
        ),
    )
