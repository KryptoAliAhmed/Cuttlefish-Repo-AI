import cudf
import pandas as pd
import requests
import os
import logging
import xml.etree.ElementTree as ET
from typing import Dict, Optional, List, Tuple
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder
from shapely.geometry import Polygon, Point
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI()

class UrbanDataPipeline:
    def __init__(self, output_dir: str = "data/processed"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Initialized pipeline with output directory: {self.output_dir}")

    def fetch_zoning_data(self, city: str = "Birmingham", bbox: Optional[Dict[str, float]] = None) -> str:
        if bbox is None:
            bbox = {"min_lon": -86.9, "min_lat": 33.4, "max_lon": -86.7, "max_lat": 33.6}
        url = f"https://api.openstreetmap.org/api/0.6/map?bbox={bbox['min_lon']},{bbox['min_lat']},{bbox['max_lon']},{bbox['max_lat']}"
        logger.info(f"Fetching zoning data for {city} from {url}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text

    def process_zoning_data(self, raw_data: str) -> pd.DataFrame:
        logger.info("Processing zoning data to extract geometries")
        root = ET.fromstring(raw_data)

        nodes = {}
        for node in root.findall(".//node"):
            nodes[node.get("id")] = (float(node.get("lon")), float(node.get("lat")))

        zones = []
        for way in root.findall(".//way"):
            land_use = None
            for tag in way.findall("tag"):
                if tag.get("k") == "landuse":
                    land_use = tag.get("v")
                    break

            if land_use:
                way_node_ids = [nd.get("ref") for nd in way.findall("nd")]
                way_coords = [nodes.get(node_id) for node_id in way_node_ids if nodes.get(node_id)]

                if len(way_coords) >= 3:
                    try:
                        polygon = Polygon(way_coords)
                        zones.append({
                            "way_id": way.get("id"),
                            "land_use": land_use,
                            "area_sq_degrees": polygon.area,
                            "centroid": polygon.centroid,
                        })
                    except Exception as e:
                        logger.warning(f"Could not form polygon for way {way.get('id')}: {e}")

        if not zones:
            logger.warning("No valid zoning polygons found")
            return pd.DataFrame()

        df = pd.DataFrame(zones)
        df["land_use"] = df["land_use"].str.upper()
        df["processed"] = True
        return df

    def save_data(self, df: pd.DataFrame, city: str, format: str = "parquet") -> None:
        df_to_save = df.copy()
        df_to_save['centroid'] = df_to_save['centroid'].astype(str)

        output_file = self.output_dir / f"{city.lower()}_zoning.{format}"
        if format == "parquet":
            df_to_save.to_parquet(output_file)
        elif format == "csv":
            df_to_save.to_csv(output_file, index=False)
        logger.info(f"Data saved to {output_file}")

    def run(self, city: str = "Birmingham", bbox: Optional[Dict[str, float]] = None) -> pd.DataFrame:
        raw_data = self.fetch_zoning_data(city, bbox)
        df = self.process_zoning_data(raw_data)
        if not df.empty:
            self.save_data(df, city)
        return df

class FeatureEngineer:
    def __init__(self):
        self.encoder = LabelEncoder()

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Engineering features from geometric properties")
        df = df.copy()
        df["centroid_lon"] = df["centroid"].apply(lambda p: p.x)
        df["centroid_lat"] = df["centroid"].apply(lambda p: p.y)
        df["land_use_encoded"] = self.encoder.fit_transform(df["land_use"])
        return df.drop(columns=["centroid", "way_id", "land_use"])

class LandUsePredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)

    def train(self, df: pd.DataFrame) -> None:
        features = ["centroid_lon", "centroid_lat", "area_sq_degrees"]
        target = "land_use_encoded"

        X = df[features]
        y = df[target]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        self.model.fit(X_train, y_train)
        preds = self.model.predict(X_test)

        logger.info("Model Training Report:")
        logger.info("\n" + classification_report(y_test, preds))

    def predict(self, feature_data: pd.DataFrame) -> list:
        return self.model.predict(feature_data)

class InferenceRequest(BaseModel):
    centroid_lon: float
    centroid_lat: float
    area_sq_degrees: float

@app.post("/predict")
def predict_land_use(request: InferenceRequest):
    try:
        features_df = pd.DataFrame([{
            "centroid_lon": request.centroid_lon,
            "centroid_lat": request.centroid_lat,
            "area_sq_degrees": request.area_sq_degrees
        }])
        prediction = predictor.predict(features_df)
        return {"predicted_land_use_class": int(prediction[0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def main():
    pipeline = UrbanDataPipeline()
    df = pipeline.run()

    if df.empty:
        logger.warning("Empty dataframe, skipping ML pipeline.")
        return

    fe = FeatureEngineer()
    fe.encoder.fit(df['land_use'])
    processed_df = fe.transform(df)

    global predictor
    predictor = LandUsePredictor()
    predictor.train(processed_df)

if __name__ == "__main__":
    main()
    # Run with: uvicorn filename:app --reload
