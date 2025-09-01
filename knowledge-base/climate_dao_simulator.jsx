import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const greenZones = [
  {
    name: 'Fog Harvest Zone - Swakopmund Dunes',
    coords: [
      [-22.7, 14.5],
      [-22.72, 14.6],
      [-22.75, 14.58],
      [-22.73, 14.48]
    ],
    vegetation: 'European Beach Grass + Coastal Pines',
    fogCaptureRate: '2.3M liters/year',
    ROI: '17.2% annual (via ag yield + water credits)'
  },
  {
    name: 'Regen Dune Belt - Lüderitz Corridor',
    coords: [
      [-26.6, 15.1],
      [-26.62, 15.15],
      [-26.65, 15.12],
      [-26.63, 15.07]
    ],
    vegetation: 'Acacia fog-nets + dune bioswales',
    fogCaptureRate: '1.6M liters/year',
    ROI: '12.8% annual (reforestation + carbon credit)' 
  }
];

export default function ClimateDAOSimulator() {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div className="w-full h-screen">
      <MapContainer center={[-24.5, 14.8]} zoom={6} scrollWheelZoom={true} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {greenZones.map((zone, index) => (
          <Polygon
            key={index}
            positions={zone.coords}
            pathOptions={{ color: 'green' }}
            eventHandlers={{ click: () => setSelectedZone(zone) }}
          />
        ))}
      </MapContainer>

      {selectedZone && (
        <div className="absolute bottom-4 left-4 bg-white text-black p-4 rounded-xl shadow-xl z-10">
          <h2 className="text-xl font-bold">{selectedZone.name}</h2>
          <p><strong>Vegetation Plan:</strong> {selectedZone.vegetation}</p>
          <p><strong>Fog Capture Rate:</strong> {selectedZone.fogCaptureRate}</p>
          <p><strong>Annual ROI:</strong> {selectedZone.ROI}</p>
        </div>
      )}
    </div>
  );
}
