# 🛠️ Earth 2.0 Redfin Scraper + MongoDB Ingestion Pipeline

from bs4 import BeautifulSoup
from pymongo import MongoClient
import requests
from datetime import datetime
import re
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["earth2"]
collection = db["investment_properties"]

# FastAPI setup
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model
class Property(BaseModel):
    propertyId: str
    address: str
    city: str
    state: str
    zipcode: str
    latitude: float
    longitude: float
    listingSource: str
    listingUrl: str
    dateScraped: datetime
    daysOnMarket: int
    lotSizeAcres: float
    price: float
    pricePerAcre: float
    propertyType: str
    zoning: str
    sunlightIndex: float
    fiberProximityMeters: float
    estimatedRentMonthly: float
    estimatedCapRate: float
    estimatedCashOnCash: float
    earthScore: int
    daoTags: List[str]
    agentName: str
    agentPhone: str
    mlsSource: str
    imageUrls: List[str]

# API endpoint to fetch all properties
@app.get("/properties", response_model=List[Property])
def get_properties():
    results = collection.find()
    return [Property(**{**doc, "_id": str(doc["_id"])}) for doc in results]

# Simple Redfin scrape function (mocked)
def scrape_redfin_listing(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract mocked fields
    lot_size_match = re.search(r'(\d+(\.\d+)?) acres', response.text)
    price_per_acre_match = re.search(r'\$(\d{1,3}(,\d{3})*)(\.\d{2})? per Acre', response.text)
    days_on_market_match = re.search(r'(\d{1,4}) days on Redfin', response.text, re.IGNORECASE)

    return {
        "propertyId": url.split('/')[-1],
        "address": "East Bank of Demerara, Georgetown, GUY",
        "city": "Georgetown",
        "state": "GUY",
        "zipcode": "00000",
        "latitude": 6.8013,
        "longitude": -58.1636,
        "listingSource": "Redfin",
        "listingUrl": url,
        "dateScraped": datetime.utcnow(),
        "daysOnMarket": int(days_on_market_match.group(1)) if days_on_market_match else 0,
        "lotSizeAcres": float(lot_size_match.group(1)) if lot_size_match else 0,
        "price": 749346,
        "pricePerAcre": float(price_per_acre_match.group(1).replace(',', '')) if price_per_acre_match else 0,
        "propertyType": "Vacant Land",
        "zoning": "AG-RES",
        "sunlightIndex": 0.83,
        "fiberProximityMeters": 620,
        "estimatedRentMonthly": 0,
        "estimatedCapRate": 0.10,
        "estimatedCashOnCash": 0.12,
        "earthScore": 87,
        "daoTags": ["RECOMMEND_SOLAR_FARM"],
        "agentName": "Walauddin Hoosein",
        "agentPhone": "718-465-6600",
        "mlsSource": "OneKey MLS",
        "imageUrls": [
            "https://ssl.cdn-redfin.com/photo/1/bigphoto1.jpg"
        ]
    }

# Scrape + Save to MongoDB
def ingest_property(url):
    doc = scrape_redfin_listing(url)
    if collection.find_one({"propertyId": doc["propertyId"]}) is None:
        collection.insert_one(doc)
        print(f"Saved {doc['propertyId']} to DB.")
    else:
        print("Property already exists in DB.")

# Example
if __name__ == '__main__':
    test_url = "https://www.redfin.com/NY/New-York/Unknown-Unknown/home/191569619"
    ingest_property(test_url)
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Start API server
