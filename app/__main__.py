from hashlib import sha256
from itertools import count

from dynaconf import settings

# from hydrogram import idle
from hydrogram.client import Client
from hydrogram.types import Message
from hydrogram.errors import MediaEmpty
from loguru import logger

from app import client, method
from app.database.message import DatabaseMessage, find_album_messages


def encode(value):
    return sha256(str(value).encode()).hexdigest()


async def process_messages(client: Client):
    """
    Função pra registrar todas as mensagens de um chat
    """
    messages: list[Message] = client.get_chat_history(settings.SRC_CHAT_ID)
    total_messages = await client.search_messages_count(settings.SRC_CHAT_ID)
    counter = count()
    async for message in messages:
        position = next(counter)
        if message.service:
            continue
        elif (
            not message.video
            or not message.audio
            or not message.photo
            or not message.document
            or not message.voice_note
        ):
            continue
        database_message = DatabaseMessage(
            where_telegram_chat_id=message.chat.id,
            telegram_message_id=message.id,
            from_album_hash=encode(message.media_group_id or message.id),
            creation_timestamp=int(message.date.timestamp()),
        )
        database_message.create()
        database_message.refresh()
        print(position, total_messages)


async def download_media_group(messages_documents):
    first_message = await client.get_messages(
        messages_documents[0]["where_telegram_chat_id"],
        messages_documents[0]["telegram_message_id"],
    )
    if all(document["was_downloaded"] for document in messages_documents):
        return  # All mmessages from album already downloaded
    input_media_list = []
    for document in messages_documents:
        message = await client.get_messages(
            document["where_telegram_chat_id"],
            document["telegram_message_id"],
        )
        media = getattr(message, message.media.value)
        input_media = await method.mount_input_media(client, message, media)
        input_media.caption = str()  # Remove the caption
        input_media_list.append(input_media)
        print("Done")
    input_media_list[0].caption = first_message.caption or str()
    print(f"First album message caption: {first_message.caption}")
    return input_media_list


async def handle_albums():
    for album in find_album_messages():
        if album["count"] > 10:
            logger.critical("An album with more than 10 messages was found!")
        first_message = await client.get_messages(
            album["messages"][0]["where_telegram_chat_id"],
            album["messages"][0]["telegram_message_id"],
        )

        input_media_group = await download_media_group(album["messages"])
        
        try:
            new_messages = await client.send_media_group(
                settings.DST_CHAT_ID,
                media=input_media_group,
            )
            await client.send_message(
                settings.DST_CHAT_ID,
                first_message.link,
                reply_to_message_id=new_messages[-1].id,
            )
            # for document in album: # Set all "was_downloaded" to True
            #     database_message = DatabaseMessage(
            #         where_telegram_chat_id=document["where_telegram_id"],
            #         telegram_message_id=document["telegram_message_id"],
            #         from_album_hash=document["from_album_hash"],
            #     )
            #     database_message.reload()
            #     database_message.set_downloaded_value(True)

        except MediaEmpty:
            await client.send_message(
                settings.DST_CHAT_ID,
                f"Message media media empty: {first_message.link}",
                reply_to_message_id=new_messages[-1].id,
            )

async def routine(client):
    await client.start()
    logger.info("Bot Telegram client started")
    # await process_messages(client)
    await handle_albums()
    # await idle()
    # await client.stop()
    logger.info("Bot Telegram client stopped")


client.run(routine(client))
