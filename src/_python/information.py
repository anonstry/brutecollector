from hydrogram import filters
from hydrogram.client import Client
from hydrogram.types import Message

# from yarl import URL


@Client.on_message(filters.outgoing & filters.command("message", "?"))
async def message_identifier(client: Client, message: Message):
    await message.edit(message.id)


@Client.on_message(filters.outgoing & filters.command("chat", "?"))
async def chat_identifier(client: Client, message: Message):
    await message.edit(message.chat.id)


@Client.on_message(filters.outgoing & filters.command("location", "?"))
async def location_identifier(client: Client, message: Message):
    await message.edit(f"{message.chat.id}:{message.reply_to_message_id}")