import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import CalendarioDespesas from '../components/CalendarioDespesas'
import FormDespesaFixa from '../components/FormDespesaFixa'
import MenuAcoes from '../components/MenuAcoes'
import Modal from '../components/Modal'
import { diaEfetivo, jaComecou } from '../lib/calendario'

const formatoValor = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const formatoMesCurto = new Intl.DateTimeFormat('pt-PT', { month: 'long' })

export default function FixedExpensesPage() {
  const { household, contas, categorias } = useOutletContext()
  const [despesas, setDespesas] = useState(null)
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date()
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() }
  })
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [formulario, setFormulario] = useState(null) // null | { despesa: objeto ou null }
  const [aApagar, setAApagar] = useState(null)
  const [erro, setErro] = useState(null)

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'despesa')
  const { ano, mes } = mesVisivel

  async function carregar() {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select(
        'id, descricao, valor, dia_vencimento, data_inicio, ativa, account_id, categoria_id, categories (nome, cor), accounts (nome)'
      )
      .eq('household_id', household.id)
      .order('dia_vencimento')

    if (error) setErro('Não foi possível carregar as despesas fixas. Atualiza a página para tentar de novo.')
    setDespesas(data ?? [])
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household.id])

  const doMes = useMemo(
    () =>
      (despesas ?? [])
        .filter((d) => jaComecou(d.data_inicio, ano, mes))
        .map((d) => ({ ...d, dia: diaEfetivo(d.dia_vencimento, ano, mes) }))
        .sort((a, b) => b.ativa - a.ativa || a.dia - b.dia),
    [despesas, ano, mes]
  )

  const despesasPorDia = useMemo(() => {
    const porDia = {}
    for (const d of doMes) {
      if (!d.ativa) continue
      porDia[d.dia] = [...(porDia[d.dia] ?? []), d]
    }
    return porDia
  }, [doMes])

  const visiveis = diaSelecionado ? doMes.filter((d) => d.ativa && d.dia === diaSelecionado) : doMes
  const total = visiveis.filter((d) => d.ativa).reduce((soma, d) => soma + Number(d.valor), 0)

  function mudarMes(delta, paraHoje = false) {
    setDiaSelecionado(null)
    if (paraHoje) {
      const hoje = new Date()
      setMesVisivel({ ano: hoje.getFullYear(), mes: hoje.getMonth() })
      return
    }
    const destino = new Date(ano, mes + delta, 1)
    setMesVisivel({ ano: destino.getFullYear(), mes: destino.getMonth() })
  }

  async function alternarAtiva(despesa) {
    setErro(null)
    const { error } = await supabase.from('fixed_expenses').update({ ativa: !despesa.ativa }).eq('id', despesa.id)
    if (error) {
      setErro(`Não foi possível alterar “${despesa.descricao}”. Tenta de novo.`)
      return
    }
    setDiaSelecionado(null)
    carregar()
  }

  async function apagar() {
    setErro(null)
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', aApagar.id)
    if (error) {
      setErro(`Não foi possível apagar “${aApagar.descricao}”. Tenta de novo.`)
    } else {
      setDiaSelecionado(null)
      carregar()
    }
    setAApagar(null)
  }

  function aposGuardar() {
    setFormulario(null)
    carregar()
  }

  return (
    <div className="despesas-fixas">
      <h1 className="titulo-centrado">Despesas Fixas</h1>

      <div className="despesas-fixas__grelha">
        <CalendarioDespesas
          ano={ano}
          mes={mes}
          despesasPorDia={despesasPorDia}
          diaSelecionado={diaSelecionado}
          onEscolherDia={setDiaSelecionado}
          onMudarMes={mudarMes}
        />

        <section className="despesas-lista" aria-label="Lista de despesas fixas">
          {diaSelecionado && (
            <div className="despesas-lista__filtro">
              <span>
                Dia {diaSelecionado} de {formatoMesCurto.format(new Date(ano, mes, 1))}
              </span>
              <button type="button" className="botao-link" onClick={() => setDiaSelecionado(null)}>
                Ver todas
              </button>
            </div>
          )}

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}

          {despesas && visiveis.length === 0 && (
            <p className="despesas-lista__vazio">
              {doMes.length === 0 && despesas.length > 0
                ? 'Ainda não havia despesas fixas neste mês.'
                : 'Ainda não há despesas fixas. Usa o botão + para adicionar a primeira.'}
            </p>
          )}

          {visiveis.length > 0 && (
            <>
              <ul className="despesas-lista__linhas">
                {visiveis.map((d) => (
                  <li key={d.id} className={d.ativa ? 'despesa-linha' : 'despesa-linha despesa-linha--inativa'}>
                    <span className="despesa-linha__data">
                      <strong>{d.dia}</strong>
                      {DIAS_SEMANA[new Date(ano, mes, d.dia).getDay()]}
                    </span>
                    <i
                      className="despesa-linha__cor"
                      style={{ background: d.categories?.cor ?? 'var(--muted)' }}
                      aria-hidden="true"
                    />
                    <span className="despesa-linha__texto">
                      <span className="despesa-linha__descricao">{d.descricao}</span>
                      <span className="despesa-linha__detalhe">
                        {d.ativa
                          ? [d.categories?.nome, d.accounts?.nome].filter(Boolean).join(' · ')
                          : 'Desativada'}
                      </span>
                    </span>
                    <span className="despesa-linha__valor">{formatoValor.format(d.valor)}</span>
                    <MenuAcoes
                      rotulo={`Ações de ${d.descricao}`}
                      acoes={[
                        { rotulo: 'Editar', onClick: () => setFormulario({ despesa: d }) },
                        { rotulo: d.ativa ? 'Desativar' : 'Reativar', onClick: () => alternarAtiva(d) },
                        { rotulo: 'Apagar', perigo: true, onClick: () => setAApagar(d) },
                      ]}
                    />
                  </li>
                ))}
              </ul>
              <p className="despesas-lista__total">
                {diaSelecionado ? 'Total do dia' : 'Total do mês'} <span>{formatoValor.format(total)}</span>
              </p>
            </>
          )}
        </section>
      </div>

      <button
        type="button"
        className="botao-circular"
        onClick={() => setFormulario({ despesa: null })}
        aria-label="Adicionar despesa fixa"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {formulario && (
        <Modal
          titulo={formulario.despesa ? 'Editar despesa fixa' : 'Nova despesa fixa'}
          onFechar={() => setFormulario(null)}
        >
          <FormDespesaFixa
            despesa={formulario.despesa}
            householdId={household.id}
            contas={contas}
            categorias={categoriasDespesa}
            onGuardada={aposGuardar}
            onCancelar={() => setFormulario(null)}
          />
        </Modal>
      )}

      {aApagar && (
        <Modal titulo="Apagar despesa fixa?" onFechar={() => setAApagar(null)}>
          <p className="modal__texto">
            “{aApagar.descricao}” deixa de gerar transações. As transações já criadas mantêm-se.
          </p>
          <div className="modal__acoes">
            <button type="button" className="botao-secundario" onClick={() => setAApagar(null)}>
              Cancelar
            </button>
            <button type="button" className="botao-perigo" onClick={apagar}>
              Apagar despesa
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
