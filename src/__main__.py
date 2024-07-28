from loguru import logger

from . import conversation_metadata_getter, media_getter, telegram_client


async def routine():
    logger.info('Telegram client routine was started')
    await media_getter.implement(telegram_client)
    await conversation_metadata_getter.implement(telegram_client)
    logger.info('Telegram client getters was implemented successfully')
    try:
        await telegram_client.run_until_disconnected()
    except KeyboardInterrupt:
        logger.info('Collector service stopped successfully')


if __name__ == '__main__':
    with telegram_client:
        logger.info('Telegram client routine will start')
        telegram_client.loop.run_until_complete(routine())
