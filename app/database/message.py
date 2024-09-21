from app.database import mongo_database


class DatabaseMessage:
    mongo_collection = mongo_database["messages"]

    def __init__(
        self,
        where_telegram_chat_id,
        telegram_message_id,
        from_album_hash,
        creation_timestamp,
    ):
        self.where_telegram_chat_id = where_telegram_chat_id
        self.telegram_message_id = telegram_message_id
        self.from_album_hash = from_album_hash
        self.creation_timestamp = creation_timestamp
        self.was_downloaded = False
        self._default_query = {
            "where_telegram_chat_id": self.where_telegram_chat_id,
            "telegram_message_id": self.telegram_message_id,
            "from_album_hash": self.from_album_hash,
        }

    def exists(self):
        return bool(self.mongo_collection.find_one(self._default_query))

    def create(self, duplicate=False):
        if not duplicate and self.exists():
            return
        else:
            self.mongo_collection.insert_one(
                {
                    "where_telegram_chat_id": self.where_telegram_chat_id,
                    "telegram_message_id": self.telegram_message_id,
                    "from_album_hash": self.from_album_hash,
                    "creation_timestamp": self.creation_timestamp,
                    "was_downloaded": self.was_downloaded,
                }
            )

    def refresh(self):
        document = self.mongo_collection.find_one(self._default_query)
        self.where_telegram_chat_id = document["where_telegram_chat_id"]
        self.telegram_message_id = document["telegram_message_id"]
        self.from_album_hash = document["from_album_hash"]
        self.creation_timestamp = document["creation_timestamp"]
        self.was_downloaded = document["was_downloaded"]

    def delete(self):
        self.mongo_collection.delete_one(self._default_query)

    def set_downloaded_value(self, new_value: bool):
        self.mongo_collection.update_one(
            filter=self._default_query,
            update={
                "$set": {"was_downloaded": new_value},
            },
        )


def find_album_messages():
    """
    Retorna lista de mensagens com hashes em comum
    Para arrumar: as datas estão vindo fora de ordem
    """
    pipeline = [
        {
            "$group": {
                "_id": "$from_album_hash",
                "messages": {
                    "$push": {
                        "telegram_message_id": "$telegram_message_id",
                        "where_telegram_chat_id": "$where_telegram_chat_id",
                        "from_album_hash": "$from_album_hash",
                        "was_downloaded": "$was_downloaded",
                    }
                },
                "count": {"$sum": 1},
                "first_creation_timestamp": {"$min": "$creation_timestamp"},
            }
        },
        {
            "$match": {
                "_id": {"$ne": None}  # Exclui álbuns sem "from_album_hash"
            }
        },
        {
            "$addFields": {
                "messages": {
                    "$sortArray": {
                        "input": "$messages",
                        "sortBy": {
                            "creation_timestamp": -1
                        },  # 1 para ascendente, -1 para descendente
                    }
                }
            }
        },
        {
            "$sort": {
                "first_creation_timestamp": 1
                # "first_creation_timestamp": -1  # 1 para ascendente, -1 para descendente
            }
        },
    ]

    return DatabaseMessage.mongo_collection.aggregate(pipeline)  # albums
