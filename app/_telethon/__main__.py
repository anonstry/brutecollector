from loguru import logger

from app._telethon import telegram_client
from app._telethon import downloader


async def routine():
    logger.info('Telegram client routine was started')
    await downloader.implement(telegram_client)
    logger.info('Downloader module was implemented successfully')
    try:
        await telegram_client.run_until_disconnected()
    except KeyboardInterrupt:
        logger.info('Collector service stopped successfully')


if __name__ == '__main__':
    with telegram_client:
        logger.info('Telegram client routine will start')
        telegram_client.loop.run_until_complete(routine())
