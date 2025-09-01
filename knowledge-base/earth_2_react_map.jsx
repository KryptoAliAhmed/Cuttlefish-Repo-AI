import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Earth2Map() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/properties")
      .then((res) => res.json())
      .then((data) => setProperties(data));
  }, []);

  return (
    <div className="h-screen w-full">
      <MapContainer center={[37.7749, -122.4194]} zoom={4} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {properties.map((prop) => (
          <Marker
            key={prop.propertyId}
            position={[prop.latitude, prop.longitude]}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{prop.address}</p>
                <p>Earth Score: {prop.earthScore}</p>
                <p>Cap Rate: {(prop.estimatedCapRate * 100).toFixed(1)}%</p>
                <a href={prop.listingUrl} target="_blank" rel="noopener noreferrer">
                  View Listing
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
