import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { labelName } from "../utils/format";

const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#818cf8", "#fb7185"];

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: 12,
  color: "#e2e8f0"
};

export const LanguagePie = ({ data }) => (
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4}>
        {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
      </Pie>
      <Tooltip contentStyle={tooltipStyle} />
    </PieChart>
  </ResponsiveContainer>
);

export const CategoryBar = ({ data }) => (
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={data}>
      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
      <XAxis dataKey="name" tickFormatter={labelName} stroke="#94a3b8" />
      <YAxis stroke="#94a3b8" />
      <Tooltip contentStyle={tooltipStyle} />
      <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#22d3ee" />
    </BarChart>
  </ResponsiveContainer>
);

export const TrendLine = ({ data }) => (
  <ResponsiveContainer width="100%" height={280}>
    <LineChart data={data}>
      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
      <XAxis dataKey="date" stroke="#94a3b8" />
      <YAxis stroke="#94a3b8" />
      <Tooltip contentStyle={tooltipStyle} />
      <Line type="monotone" dataKey="analyses" stroke="#22d3ee" strokeWidth={3} dot={false} />
      <Line type="monotone" dataKey="toxic" stroke="#f472b6" strokeWidth={3} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

