import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-cluster";
import { CSVLink } from "react-csv";

export default function Earth2Map() {
  const [properties, setProperties] = useState([]);
  const [filterTag, setFilterTag] = useState("ALL");
  const [selectedProperties, setSelectedProperties] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/properties")
      .then((res) => res.json())
      .then((data) => setProperties(data));
  }, []);

  const handleVote = (id, vote) => {
    alert(`Voted '${vote}' on property ${id}`);
  };

  const handleSelectProperty = (property) => {
    setSelectedProperties((prev) => {
      const exists = prev.find((p) => p.propertyId === property.propertyId);
      return exists ? prev.filter((p) => p.propertyId !== property.propertyId) : [...prev, property];
    });
  };

  const filteredProperties =
    filterTag === "ALL"
      ? properties
      : properties.filter((p) => p.daoTags.includes(filterTag));

  const averageReturn =
    selectedProperties.length > 0
      ? (selectedProperties.reduce((sum, p) => sum + p.estimatedCapRate, 0) / selectedProperties.length) * 100
      : 0;

  const getESGColor = (score) => {
    if (score >= 80) return "green";
    if (score >= 60) return "orange";
    return "red";
  };

  return (
    <div className="h-screen w-full">
      <div className="absolute z-10 bg-white p-2 m-2 rounded shadow-md">
        <label className="mr-2">Filter:</label>
        <select
          onChange={(e) => setFilterTag(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="ALL">All</option>
          <option value="RECOMMEND_SOLAR_FARM">Solar-Ready</option>
          <option value="RECOMMEND_AI_CLUSTER">AI Cluster</option>
          <option value="RECOMMEND_MIXED_USE">Mixed Use</option>
        </select>
        <p className="mt-2 text-sm">Selected Portfolio Avg. Return: {averageReturn.toFixed(2)}%</p>
        <CSVLink
          data={selectedProperties}
          filename={`earth2_portfolio_${Date.now()}.csv`}
          className="bg-blue-500 text-white px-2 py-1 mt-2 rounded inline-block"
        >
          Export CSV
        </CSVLink>
      </div>
      <MapContainer center={[37.7749, -122.4194]} zoom={4} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MarkerClusterGroup>
          {filteredProperties.map((prop) => (
            <CircleMarker
              key={prop.propertyId}
              center={[prop.latitude, prop.longitude]}
              pathOptions={{ color: getESGColor(prop.earthScore), fillOpacity: 0.6 }}
              radius={8}
              eventHandlers={{ click: () => handleSelectProperty(prop) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{prop.address}</p>
                  <p>Earth Score: {prop.earthScore}</p>
                  <p>Cap Rate: {(prop.estimatedCapRate * 100).toFixed(1)}%</p>
                  <p>Tags: {prop.daoTags.join(", ")}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleVote(prop.propertyId, "upvote")}
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Vote 👍
                    </button>
                    <button
                      onClick={() => handleVote(prop.propertyId, "downvote")}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Vote 👎
                    </button>
                  </div>
                  <a
                    href={prop.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 mt-1"
                  >
                    View Listing
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
