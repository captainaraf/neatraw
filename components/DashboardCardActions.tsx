'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Edit2, X, Check } from 'lucide-react'
import { deletePacket, updatePacket } from '@/app/actions/packets'

interface DashboardCardActionsProps {
    packetId: string
    initialName: string
}

export default function DashboardCardActions({ packetId, initialName }: DashboardCardActionsProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState(initialName)
    const [loading, setLoading] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this data packet? All associated rows will be lost.')) return

        setLoading(true)
        const result = await deletePacket(packetId)
        if (!result.success) {
            alert(result.error || 'Failed to delete packet')
            setLoading(false)
        }
    }

    const handleUpdate = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!newName.trim()) return

        setLoading(true)
        const result = await updatePacket(packetId, { context_text: newName })
        if (result.success) {
            setIsEditing(false)
        } else {
            alert(result.error || 'Failed to update packet')
        }
        setLoading(false)
        setShowMenu(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1" onClick={e => e.stopPropagation()}>
                <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="bg-transparent border-none text-xs focus:ring-0 p-1 w-32"
                    onClick={e => e.stopPropagation()}
                />
                <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="p-1 hover:bg-primary/10 text-primary rounded"
                >
                    <Check className="h-3 w-3" />
                </button>
                <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setIsEditing(false); }}
                    className="p-1 hover:bg-destructive/10 text-destructive rounded"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                }}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden fade-up-1">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsEditing(true)
                            setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                        Rename
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </button>
                </div>
            )}

            {showMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    )
}
