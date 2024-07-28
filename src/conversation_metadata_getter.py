from telethon.sync import events


async def message_identifier(event):
    string = str(event.message.reply_to.reply_to_msg_id)
    await event.edit(string)


async def chat_identifier(event):
    string = str(event.chat_id)
    await event.edit(string)


async def location_identifier(event):
    string = f'{event.chat_id}:{event.message.reply_to.reply_to_msg_id}'
    await event.edit(string)


async def implement(client):
    client.add_event_handler(
        chat_identifier,
        events.NewMessage(outgoing=True, pattern='\?chat'),
    )
    client.add_event_handler(
        message_identifier,
        events.NewMessage(
            outgoing=True,
            func=lambda event: event.message.reply_to,
            pattern='\?message',
        ),
    )
    client.add_event_handler(
        location_identifier,
        events.NewMessage(
            outgoing=True,
            func=lambda event: event.message.reply_to,
            pattern='\?location',
        ),
    )


# from yarl import URL
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
#
# Convert a message link to a MessageLocation-like
# telegram_client.add_event_handler(
#     parse_location,
#     events.NewMessage(outgoing=True, pattern='!parse'),
# )
