"use client";

import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";

function euros(cents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function MonthlyChart({
  incomeCents,
  expenseCents,
}: {
  incomeCents: number;
  expenseCents: number;
}) {
  const data = [
    { name: "A recibir", value: incomeCents / 100, color: "#2d8a70" },
    { name: "A pagar", value: expenseCents / 100, color: "#d56b4c" },
  ];

  return (
    <div className="chart-wrap" aria-label="A recibir y a pagar este mes">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 8, left: 4 }}
        responsive
        style={{ width: "100%", height: 210 }}
        accessibilityLayer
      >
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={82}
          tick={{ fill: "#50635e", fontSize: 12, fontWeight: 700 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(23, 60, 53, 0.04)" }}
          formatter={(value) => [euros(Math.round(Number(value) * 100)), ""]}
          contentStyle={{
            border: "1px solid #e3e1d9",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(27, 44, 40, .1)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="value" radius={[0, 9, 9, 0]} barSize={34}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
      <div className="chart-values">
        <div>
          <span className="legend-dot income-dot" />
          <span>A recibir este mes</span>
          <strong>{euros(incomeCents)}</strong>
        </div>
        <div>
          <span className="legend-dot expense-dot" />
          <span>A pagar este mes</span>
          <strong>{euros(expenseCents)}</strong>
        </div>
      </div>
    </div>
  );
}
