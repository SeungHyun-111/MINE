import { useMemo, useState } from 'react'
import { Banknote, ChartNoAxesColumnIncreasing, ChevronDown, Home, ReceiptText, TrendingUp } from 'lucide-react'
import { COMPENSATION_RECORDS, EVALUATION_RECORDS } from '@/data/compensationRecords'
import { PAYROLL_ENTRIES } from '@/data/payrollEntries'

const ANNUAL_INCOME = [
  { year: 2019, amount: 36064200, age: 26, note: '공영홈쇼핑 만근 원천' },
  { year: 2020, amount: 39937910, age: 27, note: '공영홈쇼핑 만근 원천' },
  { year: 2021, amount: 47491132, age: 28, note: 'SK스토아 급여 포함' },
  { year: 2022, amount: 61923545, age: 29, note: '상여 및 정산 포함' },
  { year: 2023, amount: 61432422, age: 30, note: '급여 변동 반영' },
  { year: 2024, amount: 66436068, age: 31, note: '상여 및 포상 포함' },
  { year: 2025, amount: 72595223, age: 32, note: '목표 및 상여 포함' },
  { year: 2026, amount: 59644424, age: 33, note: '현재 자료 기준' },
]

const LONG_TERM = [
  { year: 2024, target: 62087756 },
  { year: 2025, target: 66254776 },
  { year: 2026, target: 70755159 },
  { year: 2027, target: 75615571 },
  { year: 2028, target: 80864817 },
  { year: 2029, target: 86534002 },
  { year: 2030, target: 92656723 },
  { year: 2031, target: 99269260 },
  { year: 2032, target: 106410801 },
  { year: 2033, target: 114123665 },
  { year: 2034, target: 122453558 },
]

const TYPE_STYLES = {
  월급: 'bg-sky-50 text-sky-700 ring-sky-100',
  상여: 'bg-amber-50 text-amber-700 ring-amber-100',
  포상: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  알바: 'bg-violet-50 text-violet-700 ring-violet-100',
  정산: 'bg-rose-50 text-rose-700 ring-rose-100',
  기타: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const money = (value) => (
  value === null || value === undefined ? '-' : `${Math.round(value).toLocaleString('ko-KR')}원`
)

const compactMoney = (value) => {
  if (!value) return '-'
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${Math.round(value / 10000).toLocaleString('ko-KR')}만`
}

const percent = (value) => (
  value === null || value === undefined ? '-' : `${Number(value).toFixed(1)}%`
)

const getYear = (date) => Number(date.slice(0, 4))

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e9f2ff] text-[#0044cc]">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-500">{label}</p>
          <p className="mt-1 truncate text-xl font-black text-slate-950">{value}</p>
        </div>
      </div>
      {helper && <p className="mt-3 text-xs font-bold text-slate-500">{helper}</p>}
    </div>
  )
}

function PayrollPage() {
  const [year, setYear] = useState('all')
  const [type, setType] = useState('all')

  const years = useMemo(() => [...new Set(PAYROLL_ENTRIES.map((entry) => getYear(entry.date)))], [])
  const types = useMemo(() => [...new Set(PAYROLL_ENTRIES.map((entry) => entry.type))], [])

  const filteredEntries = useMemo(() => (
    PAYROLL_ENTRIES
      .filter((entry) => year === 'all' || getYear(entry.date) === Number(year))
      .filter((entry) => type === 'all' || entry.type === type)
      .sort((a, b) => b.date.localeCompare(a.date))
  ), [type, year])

  const summary = useMemo(() => {
    const gross = filteredEntries.reduce((sum, entry) => sum + (entry.grossPay ?? 0), 0)
    const tax = filteredEntries.reduce((sum, entry) => sum + (entry.taxAmount ?? 0), 0)
    const net = filteredEntries.reduce((sum, entry) => sum + (entry.netPay ?? 0), 0)
    const salaryMonths = filteredEntries.filter((entry) => entry.type === '월급').length || 1
    const overtime = filteredEntries.reduce((sum, entry) => sum + (entry.overtimePay ?? 0), 0)

    return {
      gross,
      tax,
      net,
      overtime,
      avgNet: net / salaryMonths,
    }
  }, [filteredEntries])

  const chartRows = useMemo(() => {
    const rows = filteredEntries.slice().reverse()
    const maxNet = Math.max(...rows.map((entry) => entry.netPay ?? 0), 1)
    return rows.map((entry) => ({ ...entry, height: Math.max(((entry.netPay ?? 0) / maxNet) * 100, 6) }))
  }, [filteredEntries])

  const annualMax = Math.max(...ANNUAL_INCOME.map((entry) => entry.amount), 1)
  const longTermMax = Math.max(...LONG_TERM.map((entry) => entry.target), 1)

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e9f2ff] px-3 py-1 text-xs font-black text-[#0044cc]">
                <ReceiptText size={14} />
                월급여 목록
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                급여 흐름 대시보드
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                첨부한 월급여 원장 74건 전체를 기준으로 세전, 세액, 세후 입금액과 연도별 흐름을 정리합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <label className="text-xs font-black text-slate-500">
                연도
                <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900">
                  <select className="w-full bg-transparent outline-none" value={year} onChange={(event) => setYear(event.target.value)}>
                    <option value="all">전체 연도</option>
                    {years.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </span>
              </label>
              <label className="text-xs font-black text-slate-500">
                구분
                <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900">
                  <select className="w-full bg-transparent outline-none" value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="all">전체 구분</option>
                    {types.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Banknote} label="세후 입금 합계" value={money(summary.net)} helper={`${filteredEntries.length}건 기준`} />
          <StatCard icon={TrendingUp} label="세전 합계" value={money(summary.gross)} helper={`세액 ${money(summary.tax)}`} />
          <StatCard icon={ChartNoAxesColumnIncreasing} label="월 평균 실수령" value={money(summary.avgNet)} helper="월급 기록 수 기준" />
          <StatCard icon={Home} label="초과근무 합계" value={money(summary.overtime)} helper="금액이 있는 행만 합산" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">월별 입금 흐름</h2>
              <span className="text-xs font-black text-slate-500">{filteredEntries.length}건</span>
            </div>
            <div className="mt-5 flex h-64 items-end gap-1 overflow-x-auto border-b border-slate-200 pb-2">
              {chartRows.map((entry, index) => (
                <div key={`${entry.date}-${entry.type}-${index}`} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-t bg-[#0044cc]"
                    style={{ height: `${entry.height}%` }}
                    title={`${entry.date} ${entry.type} ${money(entry.netPay)}`}
                  />
                  <span className="whitespace-nowrap text-[10px] font-black text-slate-400">{entry.date.slice(2, 7)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">연봉 기록</h2>
            <div className="mt-5 space-y-3">
              {ANNUAL_INCOME.map((entry) => (
                <div key={entry.year}>
                  <div className="mb-1 flex items-center justify-between text-sm font-black">
                    <span>{entry.year}</span>
                    <span>{compactMoney(entry.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#00a884]" style={{ width: `${(entry.amount / annualMax) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">만 {entry.age}세 · {entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">연봉 및 조정 상세</h2>
              <span className="text-xs font-black text-slate-500">{COMPENSATION_RECORDS.length}건</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black text-slate-500">
                    <tr>
                      <th className="px-3 py-3">연도</th>
                      <th className="px-3 py-3">구분</th>
                      <th className="px-3 py-3">회사</th>
                      <th className="px-3 py-3 text-right">예상 연봉</th>
                      <th className="px-3 py-3 text-right">원천/실제</th>
                      <th className="px-3 py-3 text-right">증감률</th>
                      <th className="px-3 py-3 text-right">기본</th>
                      <th className="px-3 py-3 text-right">기여</th>
                      <th className="px-3 py-3 text-right">기여 차이</th>
                      <th className="px-3 py-3">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {COMPENSATION_RECORDS.map((entry, index) => (
                      <tr key={`${entry.year}-${entry.month ?? 'annual'}-${index}`} className="bg-white">
                        <td className="whitespace-nowrap px-3 py-3 font-black text-slate-900">{entry.year}</td>
                        <td className="px-3 py-3 font-bold text-slate-600">{entry.month ? `${entry.month}월 조정` : '연간'}</td>
                        <td className="px-3 py-3 font-bold text-slate-600">{entry.company}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.expectedAnnual)}</td>
                        <td className="px-3 py-3 text-right font-black text-[#0044cc]">{money(entry.actualAnnual)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{percent(entry.growthRate)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.baseAmount)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.contributionAmount)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.contributionGap)}</td>
                        <td className="px-3 py-3 text-xs font-bold text-slate-500">{entry.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">평가 점수</h2>
              <span className="text-xs font-black text-slate-500">{EVALUATION_RECORDS.length}건</span>
            </div>
            <div className="mt-4 space-y-3">
              {EVALUATION_RECORDS.map((entry) => (
                <article key={entry.year} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-slate-950">{entry.year}년 평가</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[#0044cc] ring-1 ring-slate-200">
                      결과 {percent(entry.resultRate)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md bg-white p-2"><p className="font-black text-slate-500">전체</p><p className="mt-1 font-black text-slate-900">{entry.overall ?? '-'}</p></div>
                    <div className="rounded-md bg-white p-2"><p className="font-black text-slate-500">팀</p><p className="mt-1 font-black text-slate-900">{entry.team ?? '-'}</p></div>
                    <div className="rounded-md bg-white p-2"><p className="font-black text-slate-500">팀장</p><p className="mt-1 font-black text-slate-900">{entry.leader ?? '-'}</p></div>
                    <div className="rounded-md bg-white p-2"><p className="font-black text-slate-500">동료</p><p className="mt-1 font-black text-slate-900">{entry.peer ?? '-'}</p></div>
                    <div className="rounded-md bg-white p-2"><p className="font-black text-slate-500">개인기여도</p><p className="mt-1 font-black text-slate-900">{entry.contribution ?? '-'}</p></div>
                    <div className="rounded-md bg-white p-2"><p className="font-black text-slate-500">개인</p><p className="mt-1 font-black text-slate-900">{percent(entry.personalPetition)}</p></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">급여 상세</h2>
              <span className="text-xs font-black text-slate-500">일자순 최신 먼저</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs font-black text-slate-500">
                    <tr>
                      <th className="px-3 py-3">일자</th>
                      <th className="px-3 py-3">구분</th>
                      <th className="px-3 py-3 text-right">기본급</th>
                      <th className="px-3 py-3 text-right">초과근무</th>
                      <th className="px-3 py-3 text-right">세전</th>
                      <th className="px-3 py-3 text-right">세액</th>
                      <th className="px-3 py-3 text-right">세후 입금</th>
                      <th className="px-3 py-3">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map((entry, index) => (
                      <tr key={`${entry.date}-${entry.type}-${index}`} className="bg-white">
                        <td className="whitespace-nowrap px-3 py-3 font-black text-slate-900">{entry.date}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${TYPE_STYLES[entry.type] ?? TYPE_STYLES.기타}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.basePay)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.overtimePay)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.grossPay)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-700">{money(entry.taxAmount)}</td>
                        <td className="px-3 py-3 text-right font-black text-[#0044cc]">{money(entry.netPay)}</td>
                        <td className="max-w-56 px-3 py-3 text-xs font-bold text-slate-500">{entry.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">장기 목표선</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              붙여준 자료의 장기 연봉 목표값을 같이 놓고, 현재 기록과 비교할 수 있게 정리했습니다.
            </p>
            <div className="mt-5 space-y-3">
              {LONG_TERM.map((entry) => (
                <div key={entry.year} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm font-black">
                    <span>{entry.year}</span>
                    <span>{compactMoney(entry.target)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#0044cc]" style={{ width: `${(entry.target / longTermMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PayrollPage
