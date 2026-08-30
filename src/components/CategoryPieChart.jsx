import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export default function CategoryPieChart({ dados }) {
  if (dados.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius={48} outerRadius={80} paddingAngle={2}>
          {dados.map((d, i) => (
            <Cell key={i} fill={d.cor || '#999'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(valor) => `${Number(valor).toFixed(2)} €`}
          contentStyle={{
            background: 'var(--paper-alt)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--ink)',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
