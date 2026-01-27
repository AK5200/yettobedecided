'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

export function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (query) {
                params.set('q', query);
            } else {
                params.delete('q');
            }
            router.push(`?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, router, searchParams]);

    return (
        <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
                placeholder='Search posts...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='pl-10 pr-10'
            />
            {query && (
                <button
                    onClick={() => setQuery('')}
                    className='absolute right-3 top-1/2 -translate-y-1/2'
                >
                    <X className='w-4 h-4 text-gray-400 hover:text-gray-600' />
                </button>
            )}
        </div>
    );
}
