import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Initialize Supabase client
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

const ComplianceDashboard = () => {
  const [complianceData, setComplianceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch compliance data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('compliance_records')
          .select('regulation_type, status, last_audit_date, ai_audit_result')
          .order('last_audit_date', { ascending: false })
          .limit(10);

        if (error) throw error;
        setComplianceData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching compliance data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data for chart
  const chartData = complianceData.map(record => ({
    date: new Date(record.last_audit_date).toLocaleDateString(),
    complianceScore: record.ai_audit_result?.score || 0,
    regulation: record.regulation_type,
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Government Compliance Dashboard</h1>
        
        {/* Overview Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Compliance Overview</h2>
          {loading ? (
            <p className="text-gray-600">Loading compliance data...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-800">{complianceData.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Compliant</p>
                <p className="text-2xl font-bold text-green-800">
                  {complianceData.filter(d => d.status === 'Compliant').length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Non-compliant</p>
                <p className="text-2xl font-bold text-red-800">
                  {complianceData.filter(d => d.status === 'Non-compliant').length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Compliance Score Trend</h2>
          <LineChart width={600} height={300} data={chartData} className="mx-auto">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="complianceScore" stroke="#3B82F6" name="Compliance Score" />
          </LineChart>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Compliance Records</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Audit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complianceData.map((record, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.regulation_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'Compliant' ? 'bg-green-100 text-green-800' : 
                      record.status === 'Non-compliant' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.last_audit_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.ai_audit_result?.score || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;