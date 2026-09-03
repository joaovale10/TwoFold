import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Label custom: o <LabelList> nativo usa a largura da própria barra como limite de texto
// e quebra linha quando o valor é pequeno (barra quase invisível) — este ignora esse limite.
function ValorNaBarra({ x, y, width, height, value }) {
  return (
    <text x={x + width + 8} y={y + height / 2} dy={4} fontSize={13} fill="var(--ink)">
      {Number(value).toFixed(2)} €
    </text>
  )
}

export default function CategoryBarChart({ dados }) {
  if (dados.length === 0) return null

  const n = dados.length
  // Poucas categorias → barras mais largas; muitas → mais finas, para nunca ficar apertado.
  const barSize = Math.max(16, Math.min(48, Math.round(180 / n)))
  const altura = Math.max(180, n * (barSize + 26))
  const maiorValor = Math.max(...dados.map((d) => d.valor))

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 60, bottom: 4, left: 8 }}>
        <XAxis type="number" hide domain={[0, maiorValor * 1.2]} />
        <YAxis
          type="category"
          dataKey="nome"
          width={120}
          tick={{ fill: 'var(--ink)', fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
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
        <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={barSize}>
          {dados.map((d, i) => (
            <Cell key={i} fill={d.cor || '#999'} />
          ))}
          <LabelList dataKey="valor" content={ValorNaBarra} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
