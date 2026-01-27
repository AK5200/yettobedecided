'use client'

import { Settings } from 'lucide-react'
import Link from 'next/link'

interface BoardSettingsButtonProps {
    boardId: string
}

export function BoardSettingsButton({ boardId }: BoardSettingsButtonProps) {
    return (
        <Link
            href={`/boards/${boardId}/settings`}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded cursor-pointer"
            onClick={(e) => e.stopPropagation()}
        >
            <Settings className="h-4 w-4 text-gray-600" />
        </Link>
    )
}
