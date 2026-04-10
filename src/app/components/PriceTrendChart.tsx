import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

interface PriceTrendChartProps {
  history: { date: string; price: number }[];
  trend: 'up' | 'down';
  height?: number;
}

export default function PriceTrendChart({ history, trend, height = 60 }: PriceTrendChartProps) {
  if (!history || history.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const color = trend === 'up' ? '#16a34a' : '#dc2626';
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={history} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Price']}
            labelFormatter={(label: string) => {
              const date = new Date(label);
              return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              fill: 'white',
              stroke: color,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
