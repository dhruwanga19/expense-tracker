import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ForecastData {
  name: string;
  actual: number;
  forecast: number;
}

interface ForecastGraphProps {
  data: ForecastData[];
}

const ForecastGraph: React.FC<ForecastGraphProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#8884d8"
          strokeWidth={3}
          name="Actual Expenses"
          dot={{ r: 5 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#82ca9d"
          strokeWidth={3}
          name="Forecasted Expenses"
          dot={{ r: 5 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ForecastGraph;
