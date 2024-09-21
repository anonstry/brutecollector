from pathlib import Path

from hydrogram import filters
from hydrogram.client import Client
from hydrogram.types import Message

from loguru import logger


@Client.on_message(filters.command("download"))
async def manual_download_media(client: Client, message: Message):
    downloadable_message = await client.get_messages(
        message.chat.id,
        message.reply_to_message_id,
    )
    file = await downloadable_message.download("/tmp/")
    logger.info("Media downloaded")
    logger.debug("Sending it to your Saved Messages...")
    await client.send_document(
        client.me.id,
        document=file,
        caption=downloadable_message.caption.html,
        force_document=False,
    )
    logger.info("Media sent to your Saved Messages successfully.")
    logger.debug("Now deleting the local downloaded media...")
    Path(file).unlink()
    logger.info("Media sent and localy deleted. Done.")