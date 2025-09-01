import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const landZones = [
  {
    name: 'Urban Zone - Lüderitz Ring',
    coords: [
      [-26.649, 15.15],
      [-26.645, 15.22],
      [-26.685, 15.25],
      [-26.695, 15.18]
    ],
    tokenClass: 'Golden NFT',
    valueUSD: 5000000000,
    annualYield: '6.5%'
  },
  {
    name: 'Agri + Aqua Commons',
    coords: [
      [-26.55, 14.95],
      [-26.50, 15.00],
      [-26.52, 15.10],
      [-26.57, 15.07]
    ],
    tokenClass: 'SISD Soulbound Token',
    valueUSD: 800000000,
    annualYield: '3.1%'
  },
  {
    name: 'Industrial Wind + Data Corridor',
    coords: [
      [-26.70, 14.90],
      [-26.68, 15.00],
      [-26.72, 15.05],
      [-26.75, 14.95]
    ],
    tokenClass: 'Revenue NFT',
    valueUSD: 12000000000,
    annualYield: '9.2%'
  }
];

export default function NamibiaLandTokenizer() {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div className="w-full h-screen">
      <MapContainer center={[-26.65, 15.1]} zoom={9} scrollWheelZoom={true} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {landZones.map((zone, index) => (
          <Polygon
            key={index}
            positions={zone.coords}
            pathOptions={{ color: 'teal' }}
            eventHandlers={{ click: () => setSelectedZone(zone) }}
          />
        ))}
      </MapContainer>

      {selectedZone && (
        <div className="absolute bottom-4 left-4 bg-white text-black p-4 rounded-xl shadow-xl z-10">
          <h2 className="text-xl font-bold">{selectedZone.name}</h2>
          <p><strong>Token Class:</strong> {selectedZone.tokenClass}</p>
          <p><strong>Valuation:</strong> ${selectedZone.valueUSD.toLocaleString()}</p>
          <p><strong>Annual Yield:</strong> {selectedZone.annualYield}</p>
        </div>
      )}
    </div>
  );
}
