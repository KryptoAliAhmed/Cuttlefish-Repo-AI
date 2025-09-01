import tweepy
import requests
import json
import redis
import asyncio
from telegram import Bot

class XAdapter:
    def __init__(self, bearer_token, api_key, api_secret, access_token, access_token_secret):
        self.client = tweepy.Client(bearer_token, api_key, api_secret, access_token, access_token_secret)

    async def fetch_sentiment_data(self, query):
        tweets = self.client.search_recent_tweets(query=query, max_results=10)
        combined_text = " ".join([tweet.text for tweet in tweets.data])
        sentiment_score = await self.semantic_analyze(combined_text)
        return sentiment_score

    async def semantic_analyze(self, text):
        response = requests.post("https://api.grok.com/semantic", json={"text": text})
        return response.json().get("sentiment", 0.5)

class TelegramAdapter:
    def __init__(self, bot_token, chat_id):
        self.bot = Bot(token=bot_token)
        self.chat_id = chat_id

    async def post_message(self, message):
        self.bot.send_message(chat_id=self.chat_id, text=message)

# Redis-backed Message Bus
class RedisMessageBus:
    def __init__(self, redis_url):
        self.redis = redis.Redis.from_url(redis_url)

    async def publish(self, topic, message):
        self.redis.xadd(topic, {"data": json.dumps(message)})

    async def subscribe(self, topic, callback):
        last_id = '0-0'
        while True:
            messages = self.redis.xread({topic: last_id}, block=0)
            for t, msgs in messages:
                for msg_id, msg in msgs:
                    data = json.loads(msg[b'data'].decode())
                    await callback(data)
                    last_id = msg_id

# Example Agent Usage
async def main():
    x_adapter = XAdapter("BEARER", "API_KEY", "API_SECRET", "ACCESS_TOKEN", "ACCESS_SECRET")
    telegram_adapter = TelegramAdapter("BOT_TOKEN", "CHAT_ID")
    bus = RedisMessageBus("redis://localhost:6379")

    sentiment = await x_adapter.fetch_sentiment_data("Cuttlefish Labs AI")
    await bus.publish("alpha_signals", {"sentiment": sentiment})
    await telegram_adapter.post_message(f"Sentiment detected: {sentiment}")

if __name__ == "__main__":
    asyncio.run(main())
