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


# async def parse_location(event):
#     command = event.text.split()
#     link = URL(command[1])
#     if 'c' in link.parts:   # so it's from a private chat
#         chat_entity = int(f'-100{link.parts[2]}')
#     else:
#         chat_entity = f'@{link.parts[1]}'
#     message_id = link.parts[-1]
#     location = f'{chat_entity}:{message_id}'
#     await event.edit(f'`{location}`')
#     await event.reply(str(link))
