import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {

  const revenueData = [
    { month: 'Jan', revenue: 10 },
    { month: 'Feb', revenue: 12 },
    { month: 'Mar', revenue: 18 },
    { month: 'Apr', revenue: 15 },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-10">
      <h1 className="text-4xl font-bold mb-8">DAO-REIT Investor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4caf50" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yield Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li>Tomatoes: <span className="text-green-600">+3000%</span></li>
              <li>Leafy Greens: <span className="text-green-600">+3600%</span></li>
              <li>Strawberries: <span className="text-green-600">+3200%</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sustainability Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li>Water Saved: 70%</li>
              <li>Carbon Sequestered: 1,200 tons/yr</li>
              <li>Renewable Energy Usage: 95%</li>
            </ul>
          </CardContent>
        </Card>

      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>DAO Governance</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="mr-4">Vote on Proposals</Button>
            <Button variant="secondary">View Past Votes</Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
