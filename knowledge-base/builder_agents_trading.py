import asyncio
from web3 import Web3
from tweepy import Client as TwitterClient
from binance.client import Client as BinanceClient

class BuilderAgent:
    def __init__(self, name, eth_node_url, binance_key, binance_secret, twitter_bearer):
        self.name = name
        self.web3 = Web3(Web3.HTTPProvider(eth_node_url))
        self.binance = BinanceClient(binance_key, binance_secret)
        self.twitter = TwitterClient(bearer_token=twitter_bearer)

    async def scan_social_media_for_alpha(self, keywords=["crypto", "AI", "altcoin"]):
        tweets = []
        for kw in keywords:
            tweets.extend(self.twitter.search_recent_tweets(query=kw, max_results=10).data)
        sentiment = sum("bullish" in tweet.text.lower() for tweet in tweets)
        return sentiment

    async def execute_trade(self, symbol="ETHUSDT", amount=0.01):
        balance = self.binance.get_asset_balance(asset="USDT")
        if float(balance["free"]) > amount * 2000:  # rough price guard
            order = self.binance.order_market_buy(symbol=symbol, quantity=amount)
            print(f"{self.name} executed trade: {order}")
        else:
            print(f"{self.name}: Not enough balance to execute trade")

    async def run(self):
        while True:
            alpha_score = await self.scan_social_media_for_alpha()
            if alpha_score > 5:
                await self.execute_trade()
            await asyncio.sleep(60)

# Example deployment
if __name__ == "__main__":
    agent = BuilderAgent(
        "AlphaCuttle1",
        eth_node_url="https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
        binance_key="YOUR_BINANCE_KEY",
        binance_secret="YOUR_BINANCE_SECRET",
        twitter_bearer="YOUR_TWITTER_BEARER"
    )
    asyncio.run(agent.run())
