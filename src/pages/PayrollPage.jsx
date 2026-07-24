import { useMemo, useState } from 'react'
import { Banknote, ChartNoAxesColumnIncreasing, ChevronDown, Home, ReceiptText, TrendingUp } from 'lucide-react'

const PAYROLL_ENTRIES = [
  { date: '2021-01-25', type: '월급', basePay: 2943011, overtimePay: 0, grossPay: 3183334, taxAmount: 315910, netPay: 2867424, note: '' },
  { date: '2021-02-25', type: '월급', basePay: 3258334, overtimePay: 0, grossPay: 3508334, taxAmount: 703210, netPay: 2805124, note: '' },
  { date: '2021-07-25', type: '월급', basePay: 3258334, overtimePay: 216932, grossPay: 4175266, taxAmount: 1156430, netPay: 3018836, note: '' },
  { date: '2021-11-25', type: '월급', basePay: 3258334, overtimePay: 36156, grossPay: 5032162, taxAmount: 949590, netPay: 4086572, note: '특별 상여 약 150만 포함 추정' },
  { date: '2021-12-25', type: '월급', basePay: 3258334, overtimePay: 48207, grossPay: 3556541, taxAmount: 708980, netPay: 2847561, note: '' },
  { date: '2022-01-25', type: '월급', basePay: 3518973, overtimePay: 289242, grossPay: 4058215, taxAmount: 793723, netPay: 3264492, note: '' },
  { date: '2022-01-27', type: '상여', basePay: null, overtimePay: null, grossPay: 11851800, taxAmount: 2050350, netPay: 9801450, note: '2021년 성과급' },
  { date: '2022-02-25', type: '월급', basePay: 3518973, overtimePay: 207792, grossPay: 3976765, taxAmount: null, netPay: 4357142, note: '연말정산 환급 포함 추정' },
  { date: '2022-11-25', type: '월급', basePay: 3727307, overtimePay: 298701, grossPay: 7359342, taxAmount: 1490243, netPay: 5869099, note: '포상/격려금 포함 추정' },
  { date: '2023-02-14', type: '상여', basePay: null, overtimePay: null, grossPay: 11006000, taxAmount: 1915040, netPay: 9090960, note: '2022년 성과급' },
  { date: '2023-11-23', type: '월급', basePay: 3879497, overtimePay: 28562, grossPay: 5856119, taxAmount: 1234896, netPay: 4621223, note: '격려금/포상 포함 추정' },
  { date: '2024-01-25', type: '월급', basePay: 4240647, overtimePay: 131760, grossPay: 4772407, taxAmount: 944573, netPay: 3777834, note: '' },
  { date: '2024-01-31', type: '상여', basePay: null, overtimePay: null, grossPay: 4290000, taxAmount: 46460, netPay: 3543540, note: '상여' },
  { date: '2024-02-23', type: '월급', basePay: 4240647, overtimePay: 680468, grossPay: 6021430, taxAmount: null, netPay: 6748577, note: '연말정산 환급 포함 추정' },
  { date: '2024-03-25', type: '월급', basePay: 4240647, overtimePay: 1141018, grossPay: 5731665, taxAmount: 1114633, netPay: 4617032, note: '초과근무 정산 추정' },
  { date: '2024-11-25', type: '월급', basePay: 4340647, overtimePay: 627879, grossPay: 7818526, taxAmount: 2166553, netPay: 5651973, note: '포상/격려금 포함' },
  { date: '2025-01-24', type: '월급', basePay: 4822179, overtimePay: 0, grossPay: 5172179, taxAmount: 1543402, netPay: 3628777, note: '생활안전자금 대출 차감 시작 추정' },
  { date: '2025-01-24', type: '상여', basePay: null, overtimePay: null, grossPay: 9090000, taxAmount: 1581660, netPay: 7508340, note: '상여' },
  { date: '2025-02-25', type: '월급', basePay: 4822179, overtimePay: 0, grossPay: 5275629, taxAmount: -1554175, netPay: 5716524, note: '연말정산/대출 차감 관련' },
  { date: '2025-06-25', type: '월급', basePay: 4822179, overtimePay: 0, grossPay: 5292328, taxAmount: 1572247, netPay: 3720081, note: '초과근무 3.2H, 약 12만' },
  { date: '2025-07-15', type: '포상', basePay: 375000, overtimePay: null, grossPay: 375000, taxAmount: null, netPay: 375000, note: 'CEO 포상 추정' },
]

const ANNUAL_INCOME = [
  { year: 2021, amount: 47491132, age: 28, note: 'SK스토아 급여 포함' },
  { year: 2022, amount: 61923545, age: 29, note: '상여/연봉 조정 포함 추정' },
  { year: 2023, amount: 61432422, age: 30, note: '평가 반영/조정 추정' },
  { year: 2024, amount: 66436068, age: 31, note: '포상/상여 포함' },
  { year: 2025, amount: 72595223, age: 32, note: '목표/상여 포함' },
  { year: 2026, amount: 59644424, age: 33, note: '급여 포함 추정' },
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
  포상: 'bg-rose-50 text-rose-700 ring-rose-100',
}

const money = (value) => (
  value === null || value === undefined ? '-' : `${Math.round(value).toLocaleString('ko-KR')}원`
)

const compactMoney = (value) => {
  if (!value) return '-'
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${Math.round(value / 10000).toLocaleString('ko-KR')}만`
}

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

export default function PayrollPage() {
  const [year, setYear] = useState('all')
  const [type, setType] = useState('all')
  const [growthRate, setGrowthRate] = useState(6)
  const [annualBonus, setAnnualBonus] = useState(10000000)

  const years = useMemo(() => [...new Set(PAYROLL_ENTRIES.map((entry) => getYear(entry.date)))], [])
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
    return {
      gross,
      tax,
      net,
      avgNet: net / salaryMonths,
      taxRate: gross ? (tax / gross) * 100 : 0,
    }
  }, [filteredEntries])

  const monthlyBars = useMemo(() => {
    const values = filteredEntries.slice().reverse()
    const max = Math.max(...values.map((entry) => entry.netPay), 1)
    return values.map((entry) => ({ ...entry, pct: (entry.netPay / max) * 100 }))
  }, [filteredEntries])

  const nextSimulation = useMemo(() => {
    const currentBase = 72595223
    const target = 70000000
    const rows = Array.from({ length: 8 }, (_, index) => {
      const yearValue = 2025 + index
      const income = currentBase * ((1 + growthRate / 100) ** index) + annualBonus
      return { year: yearValue, income, reached: income >= target }
    })
    return rows
  }, [annualBonus, growthRate])

  const firstTargetYear = nextSimulation.find((row) => row.reached)?.year

  return (
    <section className="min-h-full bg-[#f6f8fa] px-4 py-4 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-[#0044cc]">급여</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">급여·연봉 대시보드</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              월별 세전/세후 입금, 상여·포상 이벤트, 원천 7천 목표와 주택 구입 타이밍을 함께 보는 개인 재무 화면입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0044cc]"
            >
              <option value="all">전체 연도</option>
              {years.map((item) => <option key={item} value={item}>{item}년</option>)}
            </select>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0044cc]"
            >
              <option value="all">전체 구분</option>
              <option value="월급">월급</option>
              <option value="상여">상여</option>
              <option value="포상">포상</option>
            </select>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Banknote} label="세후 입금 합계" value={money(summary.net)} helper={`${filteredEntries.length}개 기록 기준`} />
          <StatCard icon={ReceiptText} label="세전 합계" value={money(summary.gross)} helper={`공제율 ${summary.taxRate.toFixed(1)}%`} />
          <StatCard icon={ChartNoAxesColumnIncreasing} label="월 평균 실수령" value={money(summary.avgNet)} helper="월급성 기록 수 기준" />
          <StatCard icon={Home} label="원천 7천 도달" value={firstTargetYear ? `${firstTargetYear}년` : '미도달'} helper="성장률/상여 입력 기준" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950">월별 실수령 흐름</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">세후 입금액 기준</p>
                </div>
                <ChevronDown className="text-slate-300" size={18} />
              </div>
              <div className="mt-5 flex h-64 items-end gap-2 overflow-x-auto pb-2">
                {monthlyBars.map((entry) => (
                  <div key={`${entry.date}-${entry.type}-${entry.netPay}`} className="flex min-w-14 flex-1 flex-col items-center gap-2">
                    <div className="flex h-48 w-full items-end rounded-md bg-slate-100">
                      <div
                        className={`w-full rounded-md ${entry.type === '상여' ? 'bg-amber-400' : entry.type === '포상' ? 'bg-rose-400' : 'bg-[#0044cc]'}`}
                        style={{ height: `${Math.max(entry.pct, 5)}%` }}
                        title={`${entry.date} ${money(entry.netPay)}`}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{entry.date.slice(2, 7)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-black text-slate-950">급여 타임라인</h2>
                <span className="text-xs font-black text-slate-500">{filteredEntries.length}건</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {filteredEntries.map((entry) => (
                  <article key={`${entry.date}-${entry.type}-${entry.netPay}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${TYPE_STYLES[entry.type] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                            {entry.type}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{entry.date}</span>
                        </div>
                        <h3 className="mt-2 text-lg font-black text-slate-950">{money(entry.netPay)}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-xs font-bold text-slate-500">
                        <span>세전</span><span className="text-slate-800">{money(entry.grossPay)}</span>
                        <span>세액</span><span className="text-slate-800">{money(entry.taxAmount)}</span>
                        <span>기본급</span><span className="text-slate-800">{money(entry.basePay)}</span>
                        <span>초과</span><span className="text-slate-800">{money(entry.overtimePay)}</span>
                      </div>
                    </div>
                    {entry.note && <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-500">{entry.note}</p>}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-950">연간 원천/연봉 흐름</h2>
              <div className="mt-4 flex flex-col gap-3">
                {ANNUAL_INCOME.map((row, index) => {
                  const prev = ANNUAL_INCOME[index - 1]?.amount
                  const growth = prev ? ((row.amount - prev) / prev) * 100 : null
                  return (
                    <div key={row.year} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-slate-950">{row.year}년</span>
                        <span className="text-sm font-black text-[#0044cc]">{compactMoney(row.amount)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>만 {row.age}세</span>
                        <span>{growth === null ? '기준' : `${growth.toFixed(1)}%`}</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{row.note}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#0044cc]" />
                <h2 className="text-base font-black text-slate-950">원천 7천 시뮬레이터</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="text-[11px] font-black text-slate-500">
                  연 상승률
                  <input
                    type="number"
                    value={growthRate}
                    onChange={(event) => setGrowthRate(Number(event.target.value))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm font-bold outline-none focus:border-[#0044cc]"
                  />
                </label>
                <label className="text-[11px] font-black text-slate-500">
                  예상 상여
                  <input
                    type="number"
                    value={annualBonus}
                    onChange={(event) => setAnnualBonus(Number(event.target.value))}
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm font-bold outline-none focus:border-[#0044cc]"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {nextSimulation.map((row) => (
                  <div key={row.year} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-black ${row.reached ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                    <span>{row.year}년</span>
                    <span>{compactMoney(row.income)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-sm">
              <p className="text-xs font-black text-red-500">목표 메모</p>
              <h2 className="mt-1 text-lg font-black text-red-700">원천 7천 넘기 전에는 집 사야함</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-red-600">
                목표 연도, 대출 차감, 상여 포함/제외를 분리해서 계산하면 실제 주택 구입 타이밍 판단에 더 유용합니다.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}
