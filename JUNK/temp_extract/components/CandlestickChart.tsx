"use client";

import React from "react";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell } from "recharts";

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sunspots?: number; // Optional sunspot data for MRK
}

interface CandlestickChartProps {
  data: CandlestickData[];
  height?: number;
  showSunspots?: boolean; // Whether to show sunspot data
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, height = 300, showSunspots = false }) => {
  // Transform data for recharts
  const chartData = data.map((candle) => ({
    time: new Date(candle.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    // For the body of the candle (open to close)
    body: [
      Math.min(candle.open, candle.close),
      Math.max(candle.open, candle.close)
    ],
    // For the wick (low to high)
    wick: [candle.low, candle.high],
    volume: candle.volume,
    open: candle.open,
    close: candle.close,
    high: candle.high,
    low: candle.low,
    sunspots: candle.sunspots,
    fill: candle.close >= candle.open ? '#00ff88' : '#ff4444',
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs">
          <p className="text-gray-400">{data.time}</p>
          <p className="text-gray-300">Open: ${data.open.toFixed(2)}</p>
          <p className="text-gray-300">High: ${data.high.toFixed(2)}</p>
          <p className="text-gray-300">Low: ${data.low.toFixed(2)}</p>
          <p className="text-gray-300">Close: ${data.close.toFixed(2)}</p>
          <p className="text-yellow-400">Vol: {data.volume}</p>
          {data.sunspots !== undefined && (
            <>
              <div className="border-t border-gray-700 mt-1 pt-1">
                <p className="text-orange-400">☀️ Sunspots: {data.sunspots}</p>
                <p className="text-xs text-gray-500">
                  {data.sunspots < 50 ? "Low solar activity" : 
                   data.sunspots < 100 ? "Moderate activity" : 
                   data.sunspots < 150 ? "High activity" : "Very high activity"}
                </p>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom shape for candlestick
  const CandlestickBar = (props: any) => {
    const { x, y, width, height, fill, payload } = props;
    const wickX = x + width / 2;
    
    return (
      <g>
        {/* Wick line */}
        <line
          x1={wickX}
          y1={y}
          x2={wickX}
          y2={y + height}
          stroke={fill}
          strokeWidth={1}
        />
        {/* Body rectangle */}
        <rect
          x={x + width * 0.2}
          y={y + (payload.wick[1] - payload.body[1]) / (payload.wick[1] - payload.wick[0]) * height}
          width={width * 0.6}
          height={(payload.body[1] - payload.body[0]) / (payload.wick[1] - payload.wick[0]) * height}
          fill={fill}
          stroke={fill}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="time" 
          stroke="#666"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke="#666"
          tick={{ fontSize: 10 }}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Render candlesticks */}
        <Bar dataKey="wick" shape={CandlestickBar}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default CandlestickChart;