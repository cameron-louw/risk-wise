'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CiaImpact } from '@/types';

interface CiaImpactChartProps {
  residual: CiaImpact;
  inherent?: CiaImpact;
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
        <div className="bg-background border border-border p-2 rounded-md shadow-md text-sm">
          <p className="font-bold">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} style={{ color: p.color }}>
              {`${p.name}: ${p.payload.ratings[p.dataKey]}`}
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

export function CiaImpactChart({ residual, inherent }: CiaImpactChartProps) {
  const chartData = [
    { 
      name: 'Confidentiality', 
      residual: ratingValueMap[residual.confidentiality.rating] || 0,
      inherent: inherent ? ratingValueMap[inherent.confidentiality.rating] || 0 : 0,
      ratings: { residual: residual.confidentiality.rating, inherent: inherent?.confidentiality.rating || 'N/A' },
    },
    { 
      name: 'Integrity', 
      residual: ratingValueMap[residual.integrity.rating] || 0,
      inherent: inherent ? ratingValueMap[inherent.integrity.rating] || 0 : 0,
      ratings: { residual: residual.integrity.rating, inherent: inherent?.integrity.rating || 'N/A' },
    },
    { 
      name: 'Availability', 
      residual: ratingValueMap[residual.availability.rating] || 0,
      inherent: inherent ? ratingValueMap[inherent.availability.rating] || 0 : 0,
      ratings: { residual: residual.availability.rating, inherent: inherent?.availability.rating || 'N/A' },
    },
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
                <Legend />
                {inherent && <Bar dataKey="inherent" name="Inherent" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />}
                <Bar dataKey="residual" name="Residual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
