'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MergeModalProps {
    open: boolean;
    onClose: () => void;
    sourcePost: { id: string; title: string; vote_count: number };
    boardId: string;
    onMerged?: () => void;
}

export function MergeModal({ open, onClose, sourcePost, boardId, onMerged }: MergeModalProps) {
    const [search, setSearch] = useState('');
    const [posts, setPosts] = useState<any[]>([]);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!search || search.length < 2) {
            setPosts([]);
            return;
        }

        const timer = setTimeout(async () => {
            const res = await fetch(`/api/posts?board_id=${boardId}&search=${search}&exclude=${sourcePost.id}`);
            const data = await res.json();
            setPosts(data.posts || data || []);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, boardId, sourcePost.id]);

    const handleMerge = async () => {
        if (!selectedPost) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/posts/${sourcePost.id}/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetPostId: selectedPost.id })
            });

            if (res.ok) {
                onMerged?.();
                onClose();
            }
        } catch (e) {
            console.error('Merge failed:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Merge "{sourcePost.title}"</DialogTitle>
                </DialogHeader>

                <p className='text-sm text-gray-500 mb-4'>
                    This will move {sourcePost.vote_count} votes to the target post.
                </p>

                <Input
                    placeholder='Search for target post...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className='max-h-60 overflow-y-auto space-y-2 mt-4'>
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className={`p-3 border rounded cursor-pointer transition-colors ${selectedPost?.id === post.id ? 'border-black bg-gray-100' : 'hover:border-gray-300'
                                }`}
                            onClick={() => setSelectedPost(post)}
                        >
                            <p className='font-medium'>{post.title}</p>
                            <p className='text-sm text-gray-500'>{post.vote_count || 0} votes</p>
                        </div>
                    ))}
                    {search.length >= 2 && posts.length === 0 && (
                        <p className='text-sm text-center text-gray-500 py-4'>No posts found</p>
                    )}
                </div>

                <div className='flex gap-2 justify-end mt-4'>
                    <Button variant='outline' onClick={onClose}>Cancel</Button>
                    <Button onClick={handleMerge} disabled={!selectedPost || loading}>
                        {loading ? 'Merging...' : 'Merge'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
