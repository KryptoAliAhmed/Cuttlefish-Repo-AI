import React from 'react';
import CountUp from 'react-countup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const impactMetrics = [
  { name: 'Geothermal MW', value: 6 },
  { name: 'CO₂ Sequestered (kt)', value: 900 },
  { name: 'Marine Zones (km²)', value: 7200 },
  { name: 'Modular Homes', value: 10000 },
  { name: 'DAO Wallets', value: 60000 },
];

const AnimatedDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Global DAO Impact Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {impactMetrics.map((metric) => (
            <div key={metric.name} className="text-center">
              <div className="text-4xl font-bold">
                <CountUp end={metric.value} duration={2.5} separator="," />
              </div>
              <div className="text-sm opacity-90 mt-1">{metric.name}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 text-xl">Visual Breakdown</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={impactMetrics} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnimatedDashboard;
