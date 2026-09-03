import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function ValorNaBarra({ x, y, width, value }) {
  if (!value) return null
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="var(--ink)">
      {Number(value).toFixed(0)} €
    </text>
  )
}

// dados: array de 12 valores (índice = mês, 0-11)
export default function MonthlyBarChart({ dados, mesDestacado }) {
  const dadosGrafico = dados.map((valor, mes) => ({ mes: MESES[mes], valor, destacado: mes === mesDestacado }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dadosGrafico} margin={{ top: 20, right: 4, bottom: 4, left: 4 }}>
        <XAxis dataKey="mes" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'var(--border)', opacity: 0.3 }}
          formatter={(valor) => `${Number(valor).toFixed(2)} €`}
          contentStyle={{
            background: 'var(--paper-alt)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--ink)',
          }}
        />
        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
          {dadosGrafico.map((d, i) => (
            <Cell key={i} fill={d.destacado ? 'var(--accent)' : 'var(--border)'} />
          ))}
          <LabelList dataKey="valor" content={ValorNaBarra} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
