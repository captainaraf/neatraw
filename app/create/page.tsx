
'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, Upload, FileSpreadsheet, FileText, Grid3X3, Check, Info } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type ColumnType = 'text' | 'number' | 'date'

interface ColumnDef {
    name: string
    type: ColumnType
}
import Header from '@/components/Header'

export default function CreateDataPacket() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<User | null>(null)
    const [step, setStep] = useState<1 | 2>(1)
    const [inputMode, setInputMode] = useState<'excel' | 'csv' | 'manual'>('excel')
    const [rawInput, setRawInput] = useState('')
    const [columns, setColumns] = useState<ColumnDef[]>([])
    const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([])
    const [manualRows, setManualRows] = useState<string[][]>([])
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null)
    const [contextText, setContextText] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
            } else {
                setUser(user)
            }
        }
        fetchUser()
    }, [router, supabase])

    const fileInputRef = useRef<HTMLInputElement>(null)

    const manualData = useMemo(() => {
        return manualRows
            .map((row) => {
                const obj: Record<string, string> = {}
                columns.forEach((col, idx) => {
                    obj[col.name] = row[idx] ?? ''
                })
                return obj
            })
            .filter((row) => Object.values(row).some((val) => val !== ''))
    }, [manualRows, columns])

    const activeData = (inputMode === 'csv' || inputMode === 'excel') && parsedData.length > 0 ? parsedData : manualData

    const columnLabel = useCallback((index: number) => {
        let label = ''
        let i = index
        while (i >= 0) {
            label = String.fromCharCode((i % 26) + 65) + label
            i = Math.floor(i / 26) - 1
        }
        return label
    }, [])

    const ensureGridSeed = useCallback(() => {
        if (columns.length === 0) {
            const seedColumns: ColumnDef[] = Array.from({ length: 5 }, (_, idx) => ({
                name: columnLabel(idx),
                type: 'text'
            }))
            setColumns(seedColumns)
            setManualRows(Array.from({ length: 20 }, () => Array(seedColumns.length).fill('')))
        }
    }, [columns.length, columnLabel])

    useEffect(() => {
        if (inputMode === 'manual') {
            ensureGridSeed()
        }
    }, [inputMode, ensureGridSeed])

    const processParsedData = (results: Record<string, unknown>[], headers: string[]) => {
        if (results.length === 0) {
            setError('No data found.')
            return
        }

        const cols: ColumnDef[] = headers.map((h: string) => ({ name: h, type: 'text' }))
        const checkRows = results.slice(0, 5)

        cols.forEach(col => {
            let isNumber = true
            let isDate = true
            let hasValue = false

            for (const row of checkRows) {
                const val = row[col.name]
                if (val !== undefined && val !== null && val !== '') {
                    hasValue = true
                    if (isNaN(Number(val))) isNumber = false
                    if (isNaN(Date.parse(val as string))) isDate = false
                }
            }

            if (hasValue) {
                if (isNumber) col.type = 'number'
                else if (isDate) col.type = 'date'
            }
        })

        const validationError = validateSchema(cols, results)
        if (validationError) {
            setError(validationError)
            return
        }

        setColumns(normalizeColumns(cols))
        setParsedData(results)

        const gridRows = results.map(row => cols.map(c => row[c.name] ?? ''))
        setManualRows(gridRows)
        setInputMode('manual')
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null)
        const file = e.target.files?.[0]
        if (!file) return
        processFile(file)
    }

    const processFile = (file: File) => {
        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || []
                    processParsedData(results.data, headers)
                },
                error: (err) => setError('Failed to parse CSV: ' + err.message)
            })
        } else {
            const reader = new FileReader()
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary' })
                    const wsname = wb.SheetNames[0]
                    const ws = wb.Sheets[wsname]
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

                    if (data.length === 0) throw new Error("Empty sheet")

                    const headers = data[0].map(String)
                    const rows = data.slice(1).map(row => {
                        const obj: Record<string, unknown> = {}
                        headers.forEach((h, i) => {
                            obj[h] = row[i]
                        })
                        return obj
                    })

                    processParsedData(rows, headers)
                } catch (err: unknown) {
                    setError("Failed to parse Excel file: " + (err instanceof Error ? err.message : 'Unknown error'))
                }
            }
            reader.readAsBinaryString(file)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }

    const handleParseCSVText = () => {
        setError(null)
        Papa.parse(rawInput, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h: string) => h.trim(),
            complete: (results) => {
                const headers = results.meta.fields || []
                processParsedData(results.data, headers)
            },
            error: (err: { message: string }) => setError('Failed to parse CSV: ' + err.message)
        })
    }

    const normalizeColumns = (cols: ColumnDef[]) => {
        return cols.map((col) => ({ ...col, name: col.name.trim() }))
    }

    const validateSchema = (cols: ColumnDef[], rows: Record<string, unknown>[]) => {
        const trimmedCols = normalizeColumns(cols)
        if (trimmedCols.length === 0) return 'Please add at least one column.'
        const names = trimmedCols.map((c) => c.name)
        if (names.some((n) => !n)) return 'Column names cannot be empty.'
        const unique = new Set(names)
        if (unique.size !== names.length) return 'Column names must be unique.'
        if (rows.length === 0) return 'Please add at least one row of data.'
        return null
    }

    const coerceRow = (row: Record<string, unknown>, cols: ColumnDef[]) => {
        const output: Record<string, unknown> = {}
        cols.forEach((col) => {
            const raw = row[col.name]
            if (col.type === 'number') {
                const num = typeof raw === 'number' ? raw : Number(raw)
                output[col.name] = Number.isFinite(num) ? num : null
            } else if (col.type === 'date') {
                if (!raw) {
                    output[col.name] = null
                } else {
                    const date = new Date(raw as string)
                    output[col.name] = Number.isNaN(date.getTime()) ? (raw as string) : date.toISOString()
                }
            } else {
                output[col.name] = raw ?? ''
            }
        })
        return output
    }

    const handleAddColumn = () => {
        const nextColumns = [...columns, { name: columnLabel(columns.length), type: 'text' as ColumnType }]
        setColumns(nextColumns)
        setManualRows((prev) => {
            if (prev.length === 0) return [Array(nextColumns.length).fill('')]
            return prev.map((row) => [...row, ''])
        })
    }

    const handleRemoveColumn = (idx: number) => {
        const nextColumns = columns.filter((_, index) => index !== idx)
        setColumns(nextColumns)
        setManualRows((prev) => prev.map((row) => row.filter((_, index) => index !== idx)))
    }

    const handleManualNext = () => {
        const validationError = validateSchema(columns, manualData)
        if (validationError) {
            setError(validationError)
            return
        }
        setColumns(normalizeColumns(columns))
        setStep(2)
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        if (!activeCell) return
        const text = event.clipboardData.getData('text')
        if (!text) return
        event.preventDefault()

        const rows = text.trimEnd().split(/\r?\n/).map((row) => row.split('\t'))
        const maxCols = Math.max(...rows.map((row) => row.length))
        const neededCols = activeCell.col + maxCols
        const neededRows = activeCell.row + rows.length

        let nextColumns = [...columns]
        if (neededCols > nextColumns.length) {
            const additional = neededCols - nextColumns.length
            nextColumns = [
                ...nextColumns,
                ...Array.from({ length: additional }, (_, idx) => ({
                    name: columnLabel(nextColumns.length + idx),
                    type: 'text' as ColumnType
                }))
            ]
            setColumns(nextColumns)
        }

        setManualRows((prev) => {
            const nextRows = [...prev]
            while (nextRows.length < neededRows) {
                nextRows.push(Array(nextColumns.length).fill(''))
            }
            for (let r = 0; r < nextRows.length; r += 1) {
                if (nextRows[r].length < nextColumns.length) {
                    nextRows[r] = [...nextRows[r], ...Array(nextColumns.length - nextRows[r].length).fill('')]
                }
            }
            rows.forEach((rowValues, rIndex) => {
                rowValues.forEach((value, cIndex) => {
                    const targetRow = activeCell.row + rIndex
                    const targetCol = activeCell.col + cIndex
                    nextRows[targetRow][targetCol] = value
                })
            })
            return nextRows
        })
    }

    const handleSave = async () => {
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const finalColumns = normalizeColumns(columns)
            const finalRows = activeData.map((row) => coerceRow(row, finalColumns))
            const schemaError = validateSchema(finalColumns, finalRows)
            if (schemaError) throw new Error(schemaError)

            const { data: packet, error: packetError } = await supabase
                .from('data_packets')
                .insert({
                    owner_id: user.id,
                    schema: finalColumns,
                    context_text: contextText,
                    is_public: isPublic
                })
                .select()
                .single()

            if (packetError) throw packetError

            const rowsToInsert = finalRows.map(row => ({
                packet_id: packet.id,
                row_data: row
            }))

            const { error: rowsError } = await supabase
                .from('data_rows')
                .insert(rowsToInsert)

            if (rowsError) throw rowsError

            router.push(`/data/${packet.id}`)

        } catch (err: unknown) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const inputModes = [
        { id: 'excel', icon: FileSpreadsheet, label: 'Upload File', desc: '.xlsx, .xls, .csv' },
        { id: 'csv', icon: FileText, label: 'Paste CSV', desc: 'Raw text' },
        { id: 'manual', icon: Grid3X3, label: 'Empty Grid', desc: 'Start fresh' }
    ]
    return (
        <div className="min-h-screen bg-background">
            <Header user={user} />

            {/* Step Indicator */}
            <div className="border-b border-border bg-muted/30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                            </div>
                            <span className="text-sm font-medium">Add Data</span>
                        </div>
                        <div className="flex-1 h-px bg-border max-w-[100px]" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                2
                            </div>
                            <span className="text-sm font-medium">Save & Share</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 fade-in">
                        <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">!</div>
                        <span>{error}</span>
                    </div>
                )}

                {step === 1 && (
                    <div className="grid lg:grid-cols-[280px_1fr] gap-8 fade-up-1">
                        {/* Sidebar */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Import Method</p>
                            {inputModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setInputMode(mode.id as 'excel' | 'csv' | 'manual')}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border text-left transition-all ${inputMode === mode.id
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'bg-card border-border hover:bg-muted hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${inputMode === mode.id ? 'bg-primary/10' : 'bg-muted'}`}>
                                        <mode.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{mode.label}</div>
                                        <div className="text-xs text-muted-foreground">{mode.desc}</div>
                                    </div>
                                </button>
                            ))}

                            <div className="pt-4 px-1">
                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>Tip: You can paste data directly from Excel into the grid. We&apos;ll auto-detect columns.</p>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="card p-6 min-h-[500px] flex flex-col">
                            {inputMode === 'excel' && (
                                <div
                                    className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all cursor-pointer ${isDragging
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                        }`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center mb-6 transition-all ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                        <Upload className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        {isDragging ? 'Drop your file here' : 'Upload a spreadsheet'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                                        Drag and drop your Excel or CSV file, or click to browse.
                                        We&apos;ll automatically detect headers and data types.
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button className="btn btn-primary">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Choose File
                                    </button>
                                </div>
                            )}

                            {inputMode === 'csv' && (
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex-1">
                                        <textarea
                                            className="input w-full h-full min-h-[300px] resize-none font-mono text-xs leading-relaxed"
                                            placeholder="Paste your CSV data here...&#10;&#10;Example:&#10;Name,Age,City&#10;John,25,New York&#10;Jane,30,London"
                                            value={rawInput}
                                            onChange={(e) => setRawInput(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleParseCSVText}
                                            disabled={!rawInput.trim()}
                                            className="btn btn-primary"
                                        >
                                            Parse & Preview
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {inputMode === 'manual' && (
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { ensureGridSeed(); handleAddColumn() }}
                                                className="btn btn-ghost btn-sm text-primary"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Column
                                            </button>
                                            <button
                                                onClick={() => {
                                                    ensureGridSeed()
                                                    setManualRows((prev) => [...prev, Array(columns.length || 3).fill('')])
                                                }}
                                                className="btn btn-ghost btn-sm text-primary"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Row
                                            </button>
                                        </div>
                                        <button onClick={handleManualNext} className="btn btn-primary btn-sm">
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div
                                        className="flex-1 overflow-auto border border-border rounded-lg bg-card scrollbar-thin"
                                        onPaste={handlePaste}
                                        onFocus={ensureGridSeed}
                                    >
                                        <table className="w-auto border-collapse text-sm">
                                            <thead className="sticky top-0 z-10 bg-muted">
                                                <tr>
                                                    <th className="w-12 border-r border-b border-border bg-muted p-2 text-center text-xs text-muted-foreground" />
                                                    {columns.map((col, idx) => (
                                                        <th key={idx} className="min-w-[140px] max-w-[200px] border-r border-b border-border p-0 relative group">
                                                            <div className="flex flex-col px-3 py-2">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <span className="text-primary/60 text-[10px] font-mono">{columnLabel(idx)}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveColumn(idx)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-destructive hover:bg-destructive/10 rounded transition-opacity"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={col.name}
                                                                    onChange={(e) => {
                                                                        const next = [...columns]
                                                                        next[idx].name = e.target.value
                                                                        setColumns(next)
                                                                    }}
                                                                    className="w-full bg-transparent font-semibold text-foreground focus:outline-none focus:bg-background/50 rounded px-1 -ml-1"
                                                                    placeholder="Header"
                                                                />
                                                                <select
                                                                    value={col.type}
                                                                    onChange={(e) => {
                                                                        const next = [...columns]
                                                                        next[idx].type = e.target.value as ColumnType
                                                                        setColumns(next)
                                                                    }}
                                                                    className="mt-1 w-full bg-transparent text-[10px] text-muted-foreground focus:outline-none cursor-pointer hover:text-foreground"
                                                                >
                                                                    <option value="text">Text</option>
                                                                    <option value="number">Number</option>
                                                                    <option value="date">Date</option>
                                                                </select>
                                                            </div>
                                                        </th>
                                                    ))}
                                                    <th className="w-10 border-b border-border bg-muted/50" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {manualRows.map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="group hover:bg-muted/20">
                                                        <td className="border-r border-b border-border bg-muted/30 text-center text-xs text-muted-foreground">
                                                            {rowIdx + 1}
                                                        </td>
                                                        {columns.map((_, colIdx) => (
                                                            <td key={colIdx} className="border-r border-b border-border p-0">
                                                                <input
                                                                    type="text"
                                                                    value={row[colIdx] ?? ''}
                                                                    onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
                                                                    onChange={(e) => {
                                                                        const nextRows = [...manualRows]
                                                                        const nextRow = [...(nextRows[rowIdx] || [])]
                                                                        nextRow[colIdx] = e.target.value
                                                                        nextRows[rowIdx] = nextRow
                                                                        setManualRows(nextRows)
                                                                    }}
                                                                    className={`w-full h-full px-3 py-2 bg-transparent outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30 ${row[colIdx] ? 'text-foreground' : 'text-muted-foreground'}`}
                                                                />
                                                            </td>
                                                        ))}
                                                        <td className="border-b border-border p-0 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualRows((prev) => prev.filter((_, idx) => idx !== rowIdx))}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-opacity"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="max-w-2xl mx-auto fade-up-1">
                        <div className="card p-8">
                            <h3 className="text-xl font-semibold text-foreground mb-6">Final Details</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="input-label">Packet Name</label>
                                    <input
                                        type="text"
                                        value={contextText}
                                        onChange={e => setContextText(e.target.value)}
                                        className="input"
                                        placeholder="e.g. Q3 Sales Report"
                                        autoFocus
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Give your data packet a descriptive name. This helps the AI understand context when answering questions.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-foreground mb-3">Schema Preview</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {columns.map((col, idx) => (
                                            <div key={idx} className="badge badge-muted">
                                                <span className="font-semibold">{col.name}</span>
                                                <span className="text-muted-foreground/50">|</span>
                                                <span className="text-muted-foreground">{col.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {activeData.length} rows ready to save
                                    </p>
                                </div>

                                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
                                    <input
                                        id="is_public"
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={e => setIsPublic(e.target.checked)}
                                        className="h-5 w-5 text-primary focus:ring-primary border-input rounded cursor-pointer mt-0.5"
                                    />
                                    <label htmlFor="is_public" className="cursor-pointer select-none">
                                        <span className="text-sm font-medium text-foreground block">Make Public</span>
                                        <span className="text-xs text-muted-foreground">Anyone with the link can view this data packet</span>
                                    </label>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="btn btn-primary flex-[2]"
                                    >
                                        {loading ? 'Creating...' : 'Create Data Packet'}
                                        {!loading && <Save className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div >
    )
}
