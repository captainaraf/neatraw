'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Download,
  Table as TableIcon,
  BarChart3,
  MessageSquare,
  Send,
  Copy,
  Link2,
  UserPlus,
  Filter,
  ArrowUpDown,
  Check,
  ChevronDown,
  Sparkles,
  X,
  FileSpreadsheet,
  FileImage,
  FileText
} from 'lucide-react'
import Papa from 'papaparse'
import { chatWithData } from '@/app/actions/chat'
import { createInvite, createShareLink } from '@/app/actions/shares'
import { deletePacket, deleteRow, updateRow, addRow } from '@/app/actions/packets'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Trash2, Plus, Edit3, Trash } from 'lucide-react'

interface ColumnDef {
  name: string
  type: 'text' | 'number' | 'date'
}

interface DataViewProps {
  dataPacket: {
    id: string
    context_text: string | null
    schema: ColumnDef[]
    created_at: string
  }
  rows: any[]
  isOwner: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  logic?: string
}

type FilterOperator =
  | 'contains'
  | 'equals'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'before'
  | 'after'
  | 'on'

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#6366f1', '#818cf8', '#4f46e5']

const expiryOptions = [
  { value: 'never', label: 'Never' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' }
]

const resolveExpiry = (value: string) => {
  const now = Date.now()
  switch (value) {
    case '1d':
      return new Date(now + 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return null
  }
}

export default function DataView({ dataPacket, rows, isOwner }: DataViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'chat'>('table')
  const [localRows, setLocalRows] = useState(rows)
  const [editingCell, setEditingCell] = useState<{ rowIdx: number, colName: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const [chartConfig, setChartConfig] = useState<{
    type: 'bar' | 'line' | 'pie'
    xAxis: string
    yAxis: string
    groupData: boolean
    groupOp: 'count' | 'sum' | 'avg'
    binSize: string
  }>({
    type: 'bar',
    xAxis: '',
    yAxis: '',
    groupData: true,
    groupOp: 'count',
    binSize: ''
  })

  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterColumn, setFilterColumn] = useState('')
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('contains')
  const [filterValue, setFilterValue] = useState('')
  const [aggregateOp, setAggregateOp] = useState<'count' | 'sum' | 'avg' | 'min' | 'max'>('count')
  const [aggregateColumn, setAggregateColumn] = useState('')

  const [shareUrl, setShareUrl] = useState('')
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [linkExpiry, setLinkExpiry] = useState('7d')
  const [inviteExpiry, setInviteExpiry] = useState('never')
  const [inviteEmail, setInviteEmail] = useState('')
  const [showSharePanel, setShowSharePanel] = useState(false)

  const [exportError, setExportError] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const tableData = useMemo(() =>
    localRows.map((r) => ({ ...r.row_data, __row_id: r.id })),
    [localRows]
  )

  // Update local rows if props change
  useEffect(() => {
    setLocalRows(rows)
  }, [rows])

  const handleDeletePacket = async () => {
    if (!confirm('Are you sure you want to delete this data packet?')) return
    const result = await deletePacket(dataPacket.id)
    if (result.success) {
      router.push('/dashboard')
    } else {
      alert(result.error)
    }
  }

  const handleUpdateRow = async (rowIndexInView: number, colName: string, value: string) => {
    const rowInView = viewData[rowIndexInView]
    if (!rowInView) return
    const rowId = rowInView.__row_id

    const newRowData = { ...rowInView }
    delete newRowData.__row_id
    newRowData[colName] = value

    const result = await updateRow(dataPacket.id, rowId, newRowData)

    if (result.success) {
      setLocalRows(prev => prev.map(r => r.id === rowId ? { ...r, row_data: newRowData } : r))
      setEditingCell(null)
    } else {
      alert(result.error)
    }
  }

  const handleDeleteRow = async (rowIndexInView: number) => {
    if (!confirm('Delete this row?')) return
    const rowInView = viewData[rowIndexInView]
    if (!rowInView) return
    const rowId = rowInView.__row_id

    const result = await deleteRow(dataPacket.id, rowId)
    if (result.success) {
      setLocalRows(prev => prev.filter(r => r.id !== rowId))
    } else {
      alert(result.error)
    }
  }

  const handleAddRow = async () => {
    const emptyRowData = dataPacket.schema.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
    const result = await addRow(dataPacket.id, emptyRowData)
    if (result.success) {
      // Re-fetching or manual update - addRow result doesn't return the new ID easily here
      // but revalidatePath will trigger a server update. 
      // For immediate feedback we could just wait for revalidation or add a dummy
      router.refresh()
    } else {
      alert(result.error)
    }
  }
  const numberColumns = useMemo(
    () => dataPacket.schema.filter((c) => c.type === 'number'),
    [dataPacket.schema]
  )
  const allColumns = dataPacket.schema

  const filterColumnDef = useMemo(
    () => allColumns.find((col) => col.name === filterColumn),
    [allColumns, filterColumn]
  )

  useEffect(() => {
    if (allColumns.length > 0 && !chartConfig.xAxis) {
      setChartConfig((prev) => ({ ...prev, xAxis: allColumns[0].name }))
    }
    if (numberColumns.length > 0 && !chartConfig.yAxis) {
      setChartConfig((prev) => ({ ...prev, yAxis: numberColumns[0].name }))
    }
  }, [allColumns, numberColumns, chartConfig.xAxis, chartConfig.yAxis])

  useEffect(() => {
    if (numberColumns.length > 0 && !aggregateColumn) {
      setAggregateColumn(numberColumns[0].name)
    }
  }, [numberColumns, aggregateColumn])

  useEffect(() => {
    if (!filterColumnDef) return
    if (filterColumnDef.type === 'number') {
      setFilterOperator('>=')
    } else if (filterColumnDef.type === 'date') {
      setFilterOperator('after')
    } else {
      setFilterOperator('contains')
    }
  }, [filterColumnDef])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getComparableValue = (row: Record<string, any>, col: ColumnDef) => {
    const raw = row[col.name]
    if (col.type === 'number') {
      const num = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(num) ? num : null
    }
    if (col.type === 'date') {
      if (!raw) return null
      const date = new Date(raw)
      return Number.isNaN(date.getTime()) ? null : date.getTime()
    }
    return (raw ?? '').toString().toLowerCase()
  }

  const viewData = useMemo(() => {
    let data = [...tableData]

    if (filterColumnDef && filterValue.trim() !== '') {
      const target = filterValue.trim()
      data = data.filter((row) => {
        if (filterColumnDef.type === 'text') {
          const val = (row[filterColumnDef.name] ?? '').toString().toLowerCase()
          const normalized = target.toLowerCase()
          if (filterOperator === 'equals') {
            return val === normalized
          }
          return val.includes(normalized)
        }

        if (filterColumnDef.type === 'number') {
          const num = getComparableValue(row, filterColumnDef)
          const compare = Number(target)
          if (!Number.isFinite(compare) || num === null) return false
          switch (filterOperator) {
            case '>':
              return num > compare
            case '>=':
              return num >= compare
            case '<':
              return num < compare
            case '<=':
              return num <= compare
            case 'equals':
            default:
              return num === compare
          }
        }

        if (filterColumnDef.type === 'date') {
          const time = getComparableValue(row, filterColumnDef)
          const targetDate = new Date(target)
          if (!Number.isFinite(time) || Number.isNaN(targetDate.getTime())) return false
          const targetTime = targetDate.getTime()
          if (filterOperator === 'before') return time < targetTime
          if (filterOperator === 'after') return time > targetTime
          if (filterOperator === 'on') {
            return new Date(time).toDateString() === targetDate.toDateString()
          }
          return time >= targetTime
        }

        return true
      })
    }

    if (sortColumn) {
      const sortCol = allColumns.find((col) => col.name === sortColumn)
      if (sortCol) {
        data.sort((a, b) => {
          const aVal = getComparableValue(a, sortCol)
          const bVal = getComparableValue(b, sortCol)
          if (aVal === null && bVal === null) return 0
          if (aVal === null) return 1
          if (bVal === null) return -1
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
          }
          return sortDirection === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal))
        })
      }
    }

    return data
  }, [
    tableData,
    filterColumnDef,
    filterValue,
    filterOperator,
    sortColumn,
    sortDirection,
    allColumns
  ])

  const chartData = useMemo(() => {
    if (!chartConfig.xAxis || !chartConfig.yAxis) return []

    // If grouping is enabled, aggregate data by X-axis
    if (chartConfig.groupData) {
      const xAxisCol = allColumns.find(c => c.name === chartConfig.xAxis)
      const groups: Record<string, any[]> = {}
      const bSize = parseFloat(chartConfig.binSize)

      viewData.forEach(row => {
        let key = row[chartConfig.xAxis]

        // Handle numeric binning if X-axis is a number and binSize is provided
        if (xAxisCol?.type === 'number' && !isNaN(bSize) && bSize > 0) {
          const val = Number(key)
          if (!isNaN(val)) {
            const start = Math.floor(val / bSize) * bSize
            key = `${start} - ${start + bSize}`
          } else {
            key = 'Invalid'
          }
        } else {
          key = (key ?? 'Empty').toString()
        }

        if (!groups[key]) groups[key] = []
        groups[key].push(row)
      })

      const data = Object.entries(groups).map(([key, groupRows]) => {
        let resultValue = 0
        if (chartConfig.groupOp === 'count') {
          resultValue = groupRows.length
        } else {
          const numbers = groupRows
            .map(r => Number(r[chartConfig.yAxis]))
            .filter(n => !isNaN(n) && isFinite(n))

          if (numbers.length > 0) {
            const sum = numbers.reduce((s, n) => s + n, 0)
            resultValue = chartConfig.groupOp === 'sum' ? sum : sum / numbers.length
          }
        }

        return {
          [chartConfig.xAxis]: key,
          [chartConfig.yAxis]: resultValue
        }
      })

      // Sort by X-axis if possible
      return data.sort((a, b) => {
        const aVal = String(a[chartConfig.xAxis])
        const bVal = String(b[chartConfig.xAxis])
        const aNum = parseFloat(aVal.split(' - ')[0])
        const bNum = parseFloat(bVal.split(' - ')[0])
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
        return aVal.localeCompare(bVal)
      })
    }

    // Default: raw data mapping
    return viewData.map((row) => {
      const yVal = row[chartConfig.yAxis]
      const num = typeof yVal === 'number' ? yVal : Number(yVal)
      return {
        ...row,
        [chartConfig.xAxis]: (row[chartConfig.xAxis] ?? '').toString(),
        [chartConfig.yAxis]: Number.isFinite(num) ? num : 0
      }
    })
  }, [viewData, chartConfig, allColumns])

  const aggregateValue = useMemo(() => {
    if (aggregateOp === 'count') return viewData.length
    const col = numberColumns.find((c) => c.name === aggregateColumn)
    if (!col) return null
    const values = viewData
      .map((row) => {
        const raw = row[col.name]
        const num = typeof raw === 'number' ? raw : Number(raw)
        return Number.isFinite(num) ? num : null
      })
      .filter((val): val is number => val !== null)
    if (values.length === 0) return null
    if (aggregateOp === 'sum') return values.reduce((sum, val) => sum + val, 0)
    if (aggregateOp === 'avg') return values.reduce((sum, val) => sum + val, 0) / values.length
    if (aggregateOp === 'min') return Math.min(...values)
    if (aggregateOp === 'max') return Math.max(...values)
    return null
  }, [aggregateOp, aggregateColumn, numberColumns, viewData])

  const formattedAggregate =
    aggregateValue === null
      ? 'N/A'
      : typeof aggregateValue === 'number'
        ? aggregateValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : String(aggregateValue)

  const filterOptions = useMemo(() => {
    if (!filterColumnDef) {
      return []
    }
    if (filterColumnDef.type === 'number') {
      return [
        { value: 'equals', label: '=' },
        { value: '>', label: '>' },
        { value: '>=', label: '≥' },
        { value: '<', label: '<' },
        { value: '<=', label: '≤' }
      ]
    }
    if (filterColumnDef.type === 'date') {
      return [
        { value: 'on', label: 'On' },
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' }
      ]
    }
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' }
    ]
  }, [filterColumnDef])

  const handleExportCSV = () => {
    setExportError(null)
    setShowExportMenu(false)
    try {
      const dataToExport = viewData.map(({ __row_id, ...rest }: any) => rest)
      const csv = Papa.unparse(dataToExport)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `data_packet_${dataPacket.id}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      setExportError('Failed to export CSV.')
    }
  }

  const handleExportExcel = async () => {
    setExportError(null)
    setShowExportMenu(false)
    try {
      const XLSX = await import('xlsx')
      const dataToExport = viewData.map(({ __row_id, ...rest }: any) => rest)
      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `data_packet_${dataPacket.id}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      setExportError('Failed to export Excel.')
    }
  }

  const handleExportImage = async (asPdf: boolean) => {
    setExportError(null)
    setShowExportMenu(false)
    if (!chartRef.current) {
      setExportError('Chart is not ready for export.')
      return
    }
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 })
      const imgData = canvas.toDataURL('image/png')

      if (asPdf) {
        const jsPDF = (await import('jspdf')).default
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        })
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
        pdf.save(`data_packet_${dataPacket.id}.pdf`)
        return
      }

      const link = document.createElement('a')
      link.href = imgData
      link.download = `data_packet_${dataPacket.id}.png`
      link.click()
    } catch {
      setExportError('Failed to export image/PDF.')
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || chatLoading) return

    const userMsg = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    const dataForAI = tableData.map(({ __row_id, ...rest }: any) => rest)
    const result = await chatWithData(
      userMsg,
      dataPacket.context_text || '',
      dataPacket.schema,
      dataForAI
    )

    if (result.success) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer || 'No answer generated.', logic: result.logic }
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error analyzing the data.'
        }
      ])
    }
    setChatLoading(false)
  }

  const handleGenerateLink = async () => {
    setShareError(null)
    setShareStatus(null)
    setShareLoading(true)
    const expiresAt = resolveExpiry(linkExpiry)
    const result = await createShareLink(dataPacket.id, expiresAt)
    if (!result.success) {
      setShareError(result.error || 'Failed to generate share link.')
      setShareLoading(false)
      return
    }
    const origin = window.location.origin
    const url = `${origin}/share/${result.data?.token}`
    setShareUrl(url)
    setShareStatus('Share link generated.')
    setShareLoading(false)
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('Link copied to clipboard.')
    } catch {
      setShareError('Unable to copy link.')
    }
  }

  const handleInvite = async () => {
    setShareError(null)
    setShareStatus(null)
    setShareLoading(true)
    const expiresAt = resolveExpiry(inviteExpiry)
    const result = await createInvite(dataPacket.id, inviteEmail, expiresAt)
    if (!result.success) {
      setShareError(result.error || 'Failed to send invite.')
      setShareLoading(false)
      return
    }
    setShareStatus(`Invite created for ${result.data?.email}.`)
    setInviteEmail('')
    setShareLoading(false)
  }

  const tabs = [
    { id: 'table', icon: TableIcon, label: 'Table' },
    { id: 'chart', icon: BarChart3, label: 'Charts' },
    { id: 'chat', icon: MessageSquare, label: 'Ask AI' }
  ]

  return (
    <div className="card overflow-hidden flex flex-col min-h-[700px]">
      {/* Header */}
      <div className="border-b border-border p-6 bg-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="badge badge-primary">
                <Sparkles className="h-3 w-3" />
                Data Packet
              </span>
              <span className="text-xs text-muted-foreground">
                Created {new Date(dataPacket.created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {dataPacket.context_text || 'Untitled Data Packet'}
            </h2>

            <div className="flex flex-wrap gap-2">
              {dataPacket.schema.map((col) => (
                <span
                  key={col.name}
                  className="badge badge-muted"
                >
                  <span className="font-semibold">{col.name}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-muted-foreground">{col.type}</span>
                </span>
              ))}
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeletePacket}
                className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete Packet</span>
              </button>
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="btn btn-secondary btn-sm"
              >
                <Link2 className="h-4 w-4" />
                Share
                <ChevronDown className={`h-4 w-4 transition-transform ${showSharePanel ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Share Panel */}
        {isOwner && showSharePanel && (
          <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30 fade-in">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Link Sharing */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  Share Link
                </h4>
                <div className="flex gap-2">
                  <select
                    value={linkExpiry}
                    onChange={(e) => setLinkExpiry(e.target.value)}
                    className="select text-xs"
                  >
                    {expiryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        Expires {option.label.toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGenerateLink}
                    disabled={shareLoading}
                    className="btn btn-primary btn-sm"
                  >
                    {shareLoading ? 'Working...' : 'Generate'}
                  </button>
                </div>

                {shareUrl && (
                  <div className="flex items-center gap-2 fade-in">
                    <input
                      value={shareUrl}
                      readOnly
                      className="input text-xs font-mono flex-1"
                    />
                    <button onClick={handleCopyLink} className="btn btn-icon btn-ghost btn-sm">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email Invite */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Invite by Email
                </h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input text-xs flex-1"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={shareLoading || !inviteEmail}
                    className="btn btn-primary btn-sm"
                  >
                    Invite
                  </button>
                </div>
              </div>
            </div>

            {shareStatus && (
              <p className="mt-4 text-xs text-success font-medium flex items-center gap-2">
                <Check className="h-3.5 w-3.5" />
                {shareStatus}
              </p>
            )}
            {shareError && (
              <p className="mt-4 text-xs text-destructive font-medium">{shareError}</p>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-b border-border px-6 py-4 flex flex-wrap justify-between items-center gap-4 bg-muted/30">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 card p-2 shadow-lg z-20 fade-in">
              {activeTab === 'table' && (
                <>
                  <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Export as CSV
                  </button>
                  <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    Export as Excel
                  </button>
                </>
              )}
              {activeTab === 'chart' && (
                <>
                  <button onClick={() => handleExportImage(false)} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted">
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    Export as PNG
                  </button>
                  <button onClick={() => handleExportImage(true)} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Export as PDF
                  </button>
                </>
              )}
              {activeTab === 'chat' && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No exports for chat view</p>
              )}
            </div>
          )}
        </div>
      </div>

      {exportError && (
        <div className="px-6 py-2 bg-destructive/10 text-destructive text-xs">
          {exportError}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 bg-muted/10 p-6 overflow-hidden flex flex-col">
        {activeTab === 'table' && (
          <div className="flex flex-col h-full gap-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 p-4 card">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Filter by...</option>
                  {allColumns.map((col) => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>

              {filterColumn && (
                <>
                  <select
                    value={filterOperator}
                    onChange={(e) => setFilterOperator(e.target.value as FilterOperator)}
                    className="select text-sm"
                  >
                    {filterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Value..."
                    className="input w-40 text-sm"
                  />
                  <button
                    onClick={() => { setFilterColumn(''); setFilterValue('') }}
                    className="btn btn-ghost btn-sm text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </>
              )}

              <div className="divider-vertical hidden sm:block" />

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortColumn}
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="select text-sm"
                >
                  <option value="">Sort by...</option>
                  {allColumns.map((col) => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
                {sortColumn && (
                  <button
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="btn btn-ghost btn-sm"
                  >
                    {sortDirection.toUpperCase()}
                  </button>
                )}
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="badge badge-primary px-4 py-2">
                  <span className="text-xs font-semibold uppercase mr-2">
                    {aggregateOp}
                  </span>
                  <select
                    value={aggregateOp}
                    onChange={(e) => setAggregateOp(e.target.value as any)}
                    className="bg-transparent text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="count">Count</option>
                    <option value="sum">Sum</option>
                    <option value="avg">Avg</option>
                    <option value="max">Max</option>
                    <option value="min">Min</option>
                  </select>
                  {aggregateOp !== 'count' && (
                    <select
                      value={aggregateColumn}
                      onChange={(e) => setAggregateColumn(e.target.value)}
                      className="bg-transparent text-xs focus:outline-none cursor-pointer ml-1"
                    >
                      {numberColumns.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                    </select>
                  )}
                  <span className="ml-2 font-bold">{formattedAggregate}</span>
                </div>
                {isOwner && (
                  <button
                    onClick={handleAddRow}
                    className="btn btn-primary btn-sm h-[38px]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto card scrollbar-thin">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    {allColumns.map((col) => (
                      <th
                        key={col.name}
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {col.name}
                      </th>
                    ))}
                    {isOwner && (
                      <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {viewData.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      {allColumns.map((col) => (
                        <td
                          key={col.name}
                          className={`px-6 py-3 text-sm text-foreground whitespace-nowrap ${isOwner ? 'cursor-text hover:bg-primary/5 transition-colors' : ''}`}
                          onDoubleClick={() => {
                            if (isOwner) {
                              setEditingCell({ rowIdx: idx, colName: col.name })
                              setEditValue(String(row[col.name] ?? ''))
                            }
                          }}
                        >
                          {editingCell?.rowIdx === idx && editingCell?.colName === col.name ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => handleUpdateRow(idx, col.name, editValue)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdateRow(idx, col.name, editValue)
                                if (e.key === 'Escape') setEditingCell(null)
                              }}
                              className="input py-0 px-2 text-sm h-7 w-full min-w-[120px] focus:ring-1 focus:ring-primary shadow-sm"
                            />
                          ) : (
                            row[col.name] ?? '-'
                          )}
                        </td>
                      ))}
                      {isOwner && (
                        <td className="px-6 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1.5 hover:bg-destructive/10 text-destructive/40 hover:text-destructive rounded-lg transition-all"
                            title="Delete Row"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {viewData.length === 0 && (
                    <tr>
                      <td colSpan={allColumns.length} className="px-6 py-12 text-center text-muted-foreground">
                        No data matches your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-right text-xs text-muted-foreground">
              Showing {viewData.length} of {rows.length} rows
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="flex flex-col h-full gap-4">
            {/* Chart Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 card">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Type</span>
                <div className="flex bg-muted rounded-lg p-1">
                  {['bar', 'line', 'pie'].map(t => (
                    <button
                      key={t}
                      onClick={() => setChartConfig(prev => ({ ...prev, type: t as any }))}
                      className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${chartConfig.type === t ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider-vertical" />

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">X-Axis</span>
                <select
                  value={chartConfig.xAxis}
                  onChange={e => setChartConfig(prev => ({ ...prev, xAxis: e.target.value }))}
                  className="select text-sm"
                >
                  {allColumns.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Y-Axis</span>
                <select
                  value={chartConfig.yAxis}
                  onChange={e => setChartConfig(prev => ({ ...prev, yAxis: e.target.value }))}
                  className="select text-sm"
                >
                  {numberColumns.map(col => <option key={col.name} value={col.name}>{col.name}</option>)}
                </select>
              </div>

              <div className="divider-vertical" />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chartConfig.groupData}
                    onChange={e => setChartConfig(prev => ({ ...prev, groupData: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-muted-foreground uppercase">Group Data</span>
                </label>

                {chartConfig.groupData && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Mode</span>
                      <select
                        value={chartConfig.groupOp}
                        onChange={e => setChartConfig(prev => ({ ...prev, groupOp: e.target.value as any }))}
                        className="select text-sm py-1 px-2"
                      >
                        <option value="count">Count (Frequency)</option>
                        <option value="sum">Sum</option>
                        <option value="avg">Average</option>
                      </select>
                    </div>

                    {allColumns.find(c => c.name === chartConfig.xAxis)?.type === 'number' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Bucket Size</span>
                        <input
                          type="number"
                          placeholder="Auto"
                          value={chartConfig.binSize}
                          onChange={e => setChartConfig(prev => ({ ...prev, binSize: e.target.value }))}
                          className="input w-20 py-1 px-2 text-sm"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 card p-6 min-h-[500px] flex flex-col">
              {numberColumns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-xl border border-dashed border-border">
                  <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No numeric data found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Charts require at least one column with numeric values.
                    Please check your data or change a column type to <strong>Number</strong> in the Create page.
                  </p>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-muted-foreground">No data available to plot with current filters.</p>
                </div>
              ) : (
                <div ref={chartRef} className="flex-1 w-full min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                    {chartConfig.type === 'bar' ? (
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey={chartConfig.xAxis}
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <Tooltip
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey={chartConfig.yAxis} fill="#0d9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartConfig.type === 'line' ? (
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey={chartConfig.xAxis}
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey={chartConfig.yAxis} stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <Pie
                          data={chartData}
                          dataKey={chartConfig.yAxis}
                          nameKey={chartConfig.xAxis}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#0d9488"
                          label
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full card overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Ask questions about your data</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Get instant insights with natural language. Try asking:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "What's the total sum?",
                      "Show me the top 3 items",
                      "What's the average value?",
                      "Find the highest number"
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(q)}
                        className="badge badge-muted hover:border-primary hover:text-primary cursor-pointer transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose-chat">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    {msg.logic && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs opacity-70 font-mono">
                        <span className="font-semibold">Logic:</span> {msg.logic}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border bg-muted/30">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your data..."
                  className="input pr-12"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || chatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary btn-icon btn-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
