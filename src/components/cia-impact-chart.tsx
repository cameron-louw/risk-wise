'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import type { RiskAssessment } from '@/types';

interface CiaImpactChartProps {
  data: RiskAssessment['ciaImpact'];
}

const ratingValueMap: { [key: string]: number } = {
  'Low': 1,
  'Medium': 2,
  'High': 3,
  'Critical': 4,
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="font-bold">{label}</p>
          <p className="text-sm">{`Rating: ${payload[0].payload.rating}`}</p>
        </div>
      );
    }
  
    return null;
  };

export function CiaImpactChart({ data }: CiaImpactChartProps) {
  const chartData = [
    { name: 'Confidentiality', value: ratingValueMap[data.confidentiality.rating] || 0, rating: data.confidentiality.rating, fill: 'hsl(var(--chart-1))' },
    { name: 'Integrity', value: ratingValueMap[data.integrity.rating] || 0, rating: data.integrity.rating, fill: 'hsl(var(--chart-2))' },
    { name: 'Availability', value: ratingValueMap[data.availability.rating] || 0, rating: data.availability.rating, fill: 'hsl(var(--chart-3))' },
  ];

  return (
    <div className="w-full h-64">
        <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis
                    stroke="hsl(var(--foreground))"
                    domain={[0, 4]}
                    ticks={[1, 2, 3, 4]}
                    tickFormatter={(value) => ['Low', 'Medium', 'High', 'Critical'][value - 1]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
