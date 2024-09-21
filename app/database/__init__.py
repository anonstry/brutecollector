import secrets

# import mongoengine
from dynaconf import settings
from pymongo import MongoClient

mongo_client = MongoClient(settings.MONGO_CONNECTION_STRING)
mongo_database = mongo_client[settings.MONGO_DATABASE_NAME]
# mongoengine.connect("app", host=settings.MONGO_CONNECTION_STRING)


def create_token(size=16):
    return secrets.token_hex(size)