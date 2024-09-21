from app.database import mongo_database


class DatabaseMessage:
    mongo_collection = mongo_database["messages"]

    def __init__(
        self,
        where_telegram_chat_id,
        telegram_message_id,
        from_album_id,
        creation_timestamp,
    ):
        self.where_telegram_chat_id = where_telegram_chat_id
        self.telegram_message_id = telegram_message_id
        self.from_album_id = from_album_id
        self.creation_timestamp = creation_timestamp
        self.was_downloaded = False

    def exists(self):
        query = {
            "where_telegram_chat_id": self.where_telegram_chat_id,
            "telegram_message_id": self.telegram_message_id,
            "from_album_id": self.from_album_id,
        }
        message_document = self.mongo_collection.find_one(query)
        return bool(message_document)

    def create(self, duplicate=False):
        if not duplicate and self.exists():
            return
        else:
            self.mongo_collection.insert_one(
                {
                    "where_telegram_chat_id": self.where_telegram_chat_id,
                    "telegram_message_id": self.telegram_message_id,
                    "from_album_id": self.from_album_id,
                    "creation_timestamp": self.creation_timestamp,
                    "was_downloaded": self.was_downloaded,
                }
            )

    def refresh(self):
        query = {
            "where_telegram_chat_id": self.where_telegram_chat_id,
            "telegram_message_id": self.telegram_message_id,
            "from_album_id": self.from_album_id,
        }
        document = self.mongo_collection.find_one(query)
        self.where_telegram_chat_id = document["where_telegram_chat_id"]
        self.telegram_message_id = document["telegram_message_id"]
        self.from_album_id = document["from_album_id"]
        self.creation_timestamp = document["creation_timestamp"]
        self.was_downloaded = document["was_downloaded"]

    def delete(self):
        query = {"identifier": self.identifier}
        self.mongo_collection.delete_one(query)


def find_album_messages():
    pipeline = [
        {
            "$group": {
                "_id": "$from_album_id",
                "messages": {
                    "$push": {
                        "telegram_message_id": "$telegram_message_id",
                        "where_telegram_chat_id": "$where_telegram_chat_id",
                        # Inclua outros campos relevantes que você precise
                    }
                },
                "count": {"$sum": 1},  # opcional, conta quantas mensagens por álbum
            }
        },
        {
            "$match": {
                "_id": {"$ne": None}  # Exclui álbuns sem "from_album_id"
            }
        },
    ]

    return DatabaseMessage.mongo_collection.aggregate(pipeline)  # albums
