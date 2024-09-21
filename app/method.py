from hydrogram.client import Client
from hydrogram.types import (
    InputMediaAnimation,
    InputMediaAudio,
    InputMediaDocument,
    InputMediaPhoto,
    InputMediaVideo,
    Message,
)
from hydrogram.types.messages_and_media.animation import Animation
from hydrogram.types.messages_and_media.audio import Audio
from hydrogram.types.messages_and_media.document import Document
from hydrogram.types.messages_and_media.photo import Photo
from hydrogram.types.messages_and_media.video import Video


async def download_thumbnail_file_id(client, message_media) -> str:
    return await client.download_media(message_media.thumbs[0], "/tmp/")


async def download_message_media(_: Client, message: Message):
    return await message.download(in_memory=True)


async def mount_input_media(client: Client, from_message: Message, message_media):
    """
    Basicamente ele baixa a midia e envelopa ela pra ser enviada novamente
    """
    if isinstance(message_media, Audio):
        return InputMediaAudio(
            media=await download_message_media(client, from_message),
            thumb=await download_thumbnail_file_id(client, message_media),
            caption=from_message.caption,
            parse_mode=client.parse_mode,
            caption_entities=from_message.caption_entities,
            duration=message_media.duration,
            performer=message_media.performer or str(),
            title=message_media.title or str(),
        )
    elif isinstance(message_media, Photo):
        return InputMediaPhoto(
            media=await download_message_media(client, from_message),
            caption=from_message.caption,
            parse_mode=client.parse_mode,
            caption_entities=from_message.caption_entities,
            has_spoiler=from_message.has_media_spoiler,
        )
    elif isinstance(message_media, Video):
        return InputMediaVideo(
            media=await download_message_media(client, from_message),
            thumb=await download_thumbnail_file_id(client, message_media),
            caption=from_message.caption,
            parse_mode=client.parse_mode,
            caption_entities=from_message.caption_entities,
            width=message_media.width,
            height=message_media.height,
            duration=message_media.duration,
            supports_streaming=bool(message_media.supports_streaming),
            has_spoiler=from_message.has_media_spoiler,
        )
    elif isinstance(message_media, Document):
        return InputMediaDocument(
            media=await download_message_media(client, from_message),
            thumb=await download_thumbnail_file_id(client, message_media),
            caption=from_message.caption,
            parse_mode=client.parse_mode,
            caption_entities=from_message.caption_entities,
        )
    elif isinstance(message_media, Animation):
        return InputMediaAnimation(
            media=await download_message_media(client, from_message),
            thumb=await download_thumbnail_file_id(client, message_media),
            caption=from_message.caption,
            parse_mode=client.parse_mode,
            caption_entities=from_message.caption_entities,
            width=message_media.width,
            height=message_media.height,
            duration=message_media.duration,
            has_spoiler=from_message.has_media_spoiler,
        )
    else:  # Message type is unknown and can be send as document
        return None
