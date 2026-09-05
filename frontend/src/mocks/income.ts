import { income } from '../../wailsjs/go/models'

// Stand-ins for ListIncomeStreams/ListIncomeEntries backend responses, used
// when isMockMode() is on. Shapes match internal/income/store.go. profileId
// matches MOCK_PROFILES' 'mock-guest' so mock mode's default profile always
// has data to show.
export const MOCK_INCOME_STREAMS: income.Stream[] = [
  new income.Stream({
    id: 'mock-stream-salary',
    profileId: 'mock-guest',
    name: 'Primary Employment',
    sourceType: 'account',
    taxStatus: 'taxed',
    bankAccount: 'HDFC Bank',
    lastUpdated: new Date().toISOString(),
  }),
  new income.Stream({
    id: 'mock-stream-consulting',
    profileId: 'mock-guest',
    name: 'Consulting & Advisory',
    sourceType: 'cash',
    taxStatus: 'non_taxed',
    bankAccount: '',
    lastUpdated: new Date().toISOString(),
  }),
]

export const MOCK_INCOME_ENTRIES: income.Entry[] = [
  new income.Entry({
    id: 'mock-entry-jan',
    name: 'Primary Employment Entry 01/26',
    incomeStreamId: 'mock-stream-salary',
    monthYear: '01/26',
    day: '31',
    sourceType: 'account',
    taxStatus: 'taxed',
    bankAccount: 'HDFC Bank',
    amount: 16500,
    taxAmount: 2850,
    deductions: 650,
    directories: ['income/Primary Employment/2026-01-payslip.pdf'],
    lastUpdated: new Date().toISOString(),
  }),
  new income.Entry({
    id: 'mock-entry-feb',
    name: 'Primary Employment Entry 02/26',
    incomeStreamId: 'mock-stream-salary',
    monthYear: '02/26',
    day: '28',
    sourceType: 'account',
    taxStatus: 'taxed',
    bankAccount: 'HDFC Bank',
    amount: 16500,
    taxAmount: 2850,
    deductions: 650,
    directories: ['income/Primary Employment/2026-02-payslip.pdf'],
    lastUpdated: new Date().toISOString(),
  }),
]
