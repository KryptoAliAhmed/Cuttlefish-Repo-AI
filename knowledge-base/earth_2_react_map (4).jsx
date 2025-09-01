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
    if (score >= 80) return "#16a34a"; // green
    if (score >= 60) return "#facc15"; // yellow
    return "#dc2626"; // red
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="absolute z-10 top-4 left-4 bg-gray-950 bg-opacity-90 p-4 rounded-2xl shadow-xl border border-gray-700">
        <h2 className="text-lg font-semibold mb-2">🎯 ESG Filter</h2>
        <select
          onChange={(e) => setFilterTag(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 px-3 py-2 rounded-md w-full"
        >
          <option value="ALL">🌍 All Properties</option>
          <option value="RECOMMEND_SOLAR_FARM">☀️ Solar-Ready</option>
          <option value="RECOMMEND_AI_CLUSTER">🧠 AI Cluster</option>
          <option value="RECOMMEND_MIXED_USE">🏙️ Mixed Use</option>
        </select>
        <p className="text-sm mt-3">📈 Avg. Portfolio Return: <strong>{averageReturn.toFixed(2)}%</strong></p>
        <CSVLink
          data={selectedProperties}
          filename={`earth2_portfolio_${Date.now()}.csv`}
          className="inline-block mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          📤 Export CSV
        </CSVLink>
      </div>
      <MapContainer center={[39.3, -74.7]} zoom={7} className="h-full w-full rounded-lg">
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
                <div className="text-sm text-black">
                  <p className="font-semibold text-gray-800">{prop.address}</p>
                  <p>Earth Score: <span className="font-bold">{prop.earthScore}</span></p>
                  <p>Cap Rate: {(prop.estimatedCapRate * 100).toFixed(1)}%</p>
                  <p>Tags: {prop.daoTags.join(", ")}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleVote(prop.propertyId, "upvote")}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                    >
                      👍 Approve
                    </button>
                    <button
                      onClick={() => handleVote(prop.propertyId, "downvote")}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                    >
                      👎 Reject
                    </button>
                  </div>
                  <a
                    href={prop.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 mt-1 hover:underline"
                  >
                    🔗 View Full Listing
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <div className="absolute bottom-4 right-4">
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg animate-bounce">
          🐙 Need help? Ask Cuttlefish
        </button>
      </div>
    </div>
  );
}
