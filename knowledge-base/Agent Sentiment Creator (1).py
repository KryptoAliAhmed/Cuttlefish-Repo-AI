import os
import tweepy
from datetime import datetime
import random

# Twitter API credentials
TWITTER_API_KEY = os.getenv('TWITTER_API_KEY')
TWITTER_API_SECRET = os.getenv('TWITTER_API_SECRET')
TWITTER_ACCESS_TOKEN = os.getenv('TWITTER_ACCESS_TOKEN')
TWITTER_ACCESS_SECRET = os.getenv('TWITTER_ACCESS_SECRET')

# Authenticate with Twitter API
client = tweepy.Client(
    consumer_key=TWITTER_API_KEY,
    consumer_secret=TWITTER_API_SECRET,
    access_token=TWITTER_ACCESS_TOKEN,
    access_token_secret=TWITTER_ACCESS_SECRET
)

# Function to create strategic sentiment tweets with dynamic incentives
def post_sentiment_tweet(token_pair, pool_status, sentiment='positive'):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    incentive_rewards = random.choice(["100 USDC", "50 USDC", "exclusive NFT", "governance tokens"])

    sentiment_templates = {
        'positive': f"🚀 Exciting developments in {token_pair} liquidity pools! Yield optimization strategies performing strongly. Engage now and earn {incentive_rewards}! #DeFi #CuttlefishLabs",
        'neutral': f"📊 {token_pair} liquidity pools maintaining steady yields. Participate and qualify for {incentive_rewards}! #DeFi #CuttlefishLabs",
        'cautious': f"⚠️ Monitoring closely: Slight volatility in {token_pair} pools. Contribute your insights and earn {incentive_rewards}. #DeFi #CuttlefishLabs"
    }

    message = sentiment_templates.get(sentiment, sentiment_templates['neutral'])
    message += f" (Updated: {timestamp})"

    response = client.create_tweet(text=message)
    return response

# Example usage
if __name__ == '__main__':
    token_pair = "ETH-USDC"
    pool_status = "strong performance"

    response = post_sentiment_tweet(token_pair, pool_status, sentiment='positive')
    print("Tweet successfully posted!", response.data)