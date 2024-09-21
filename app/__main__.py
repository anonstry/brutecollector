from hydrogram import idle
from loguru import logger

from app import client

from time import sleep
from hydrogram.client import Client
from hydrogram.types import Message
from itertools import count
from app import method
from dynaconf import settings
from app.database.message import DatabaseMessage, find_album_messages


async def process_messages(client: Client):
    """
    Função pra registrar todas as mensagens de um chat
    """
    chat_id = settings.TARGET_CHAT_ID # Por enquanto fixo
    messages = client.get_chat_history(chat_id)
    total_messages = await client.search_messages_count(chat_id)
    counter = count()

    async for message in messages:
        message: Message
        position = next(counter)
        if message.service or not message.media:
            continue

        database_message = DatabaseMessage(
            where_telegram_chat_id=message.chat.id,
            telegram_message_id=message.id,
            from_album_id=(message.media_group_id or message.id),
        )
        database_message.create()
        database_message.refresh()

        print(position, total_messages)


async def download_media_group(documents):
    first_message = await client.get_messages(
        documents[0]["where_telegram_chat_id"],
        documents[0]["telegram_message_id"],
    )
    
    media_group = []
    for document in documents:
        message = await client.get_messages(
            document["where_telegram_chat_id"],
            document["telegram_message_id"],
        )
        media = getattr(message, message.media.value)
        media_group.append(await method.mount_input_media(client, message, media))

    if not media_group[0].caption:
        media_group[0].caption = ""

    for media in media_group[1:]:
        media.caption = ""  # Empty caption for other messages

    print(f"First album message caption: {first_message.caption}")
    return media_group


async def handle_albums():
    albums = find_album_messages()
    for album in albums:
        print(album["count"])
        media_group = await download_media_group(album["messages"])
        
        if album["count"] > 10:
            logger.critical("An album with more than 10 messages was found!")
        
        await client.send_media_group(settings.DST_CHAT_ID, media=media_group)


async def routine(client):
    await client.start()
    logger.info("Bot Telegram client started")
    # await teste(client)
    await handle_albums()
    # await idle()
    # await client.stop()
    logger.info("Bot Telegram client stopped")


client.run(routine(client))
