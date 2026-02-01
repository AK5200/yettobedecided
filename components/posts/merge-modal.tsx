'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Check } from 'lucide-react';

interface Post {
    id: string;
    title: string;
    content?: string;
    vote_count: number;
}

interface MergeModalProps {
    open: boolean;
    onClose: () => void;
    sourcePost: Post;
    boardId: string;
    onMerged?: () => void;
}

export function MergeModal({ open, onClose, sourcePost, boardId, onMerged }: MergeModalProps) {
    const [search, setSearch] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPosts, setSelectedPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'select' | 'options'>('select');

    // Merge options
    const [mergeOption, setMergeOption] = useState<'target' | 'source' | 'custom'>('target');
    const [selectedSourceForTitle, setSelectedSourceForTitle] = useState<string>('');
    const [customTitle, setCustomTitle] = useState('');
    const [customContent, setCustomContent] = useState('');

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setSearch('');
            setPosts([]);
            setSelectedPosts([]);
            setStep('select');
            setMergeOption('target');
            setSelectedSourceForTitle('');
            setCustomTitle('');
            setCustomContent('');
        }
    }, [open]);

    // Search for posts
    useEffect(() => {
        if (!search || search.length < 2) {
            setPosts([]);
            return;
        }

        const excludeIds = [sourcePost.id, ...selectedPosts.map(p => p.id)].join(',');
        const timer = setTimeout(async () => {
            const res = await fetch(`/api/posts?board_id=${boardId}&search=${encodeURIComponent(search)}&exclude=${excludeIds}`);
            const data = await res.json();
            const allPosts = data.posts || data || [];
            // Filter out already selected posts
            const filteredPosts = allPosts.filter((p: Post) =>
                p.id !== sourcePost.id && !selectedPosts.find(sp => sp.id === p.id)
            );
            setPosts(filteredPosts);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, boardId, sourcePost.id, selectedPosts]);

    const addPost = (post: Post) => {
        setSelectedPosts(prev => [...prev, post]);
        setSearch('');
        setPosts([]);
    };

    const removePost = (postId: string) => {
        setSelectedPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedSourceForTitle === postId) {
            setSelectedSourceForTitle('');
        }
    };

    const handleNextStep = () => {
        if (selectedPosts.length === 0) return;
        setStep('options');
        // Default to first selected post for source option
        if (selectedPosts.length > 0 && !selectedSourceForTitle) {
            setSelectedSourceForTitle(selectedPosts[0].id);
        }
    };

    const handleMerge = async () => {
        if (selectedPosts.length === 0) return;
        setLoading(true);

        try {
            // Determine what to send based on merge option
            const body: Record<string, any> = {
                targetPostId: sourcePost.id, // The current post is the target (posts merge INTO this)
                sourcePostIds: selectedPosts.map(p => p.id),
                mergeOption,
            };

            if (mergeOption === 'custom') {
                body.customTitle = customTitle || sourcePost.title;
                body.customContent = customContent;
            } else if (mergeOption === 'source') {
                // Find the selected source post for title
                const selectedForTitle = selectedPosts.find(p => p.id === selectedSourceForTitle);
                if (selectedForTitle) {
                    body.customTitle = selectedForTitle.title;
                    body.customContent = selectedForTitle.content || '';
                    body.mergeOption = 'custom'; // Use custom to set the title
                }
            }

            const res = await fetch(`/api/posts/${sourcePost.id}/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onMerged?.();
                onClose();
            } else {
                const error = await res.json();
                console.error('Merge failed:', error);
            }
        } catch (e) {
            console.error('Merge failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const totalVotes = sourcePost.vote_count + selectedPosts.reduce((sum, p) => sum + (p.vote_count || 0), 0);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'select' ? 'Select Posts to Merge' : 'Merge Options'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'select' ? (
                    <>
                        {/* Current Post Info */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm font-medium text-blue-800">Merging into this post:</p>
                            <p className="font-semibold">{sourcePost.title}</p>
                            <p className="text-sm text-gray-600">{sourcePost.vote_count || 0} votes</p>
                        </div>

                        {/* Selected Posts */}
                        {selectedPosts.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Posts to merge ({selectedPosts.length}):</p>
                                {selectedPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="p-3 border rounded flex items-start justify-between gap-2 bg-green-50 border-green-200"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{post.title}</p>
                                            <p className="text-sm text-gray-500">{post.vote_count || 0} votes</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePost(post.id)}
                                            className="p-1 hover:bg-red-100 rounded"
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-sm text-gray-600">
                                    Total votes after merge: <strong>{totalVotes}</strong>
                                </p>
                            </div>
                        )}

                        {/* Search Input */}
                        <div>
                            <Label>Search for posts to merge</Label>
                            <Input
                                placeholder="Type to search posts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        {/* Search Results */}
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="p-3 border rounded cursor-pointer hover:border-gray-400 hover:bg-gray-50 flex items-center justify-between"
                                    onClick={() => addPost(post)}
                                >
                                    <div>
                                        <p className="font-medium">{post.title}</p>
                                        <p className="text-sm text-gray-500">{post.vote_count || 0} votes</p>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {search.length >= 2 && posts.length === 0 && (
                                <p className="text-sm text-center text-gray-500 py-4">No posts found</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleNextStep} disabled={selectedPosts.length === 0}>
                                Next: Choose Title
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Merge Preview */}
                        <div className="p-3 bg-gray-50 border rounded">
                            <p className="text-sm text-gray-600">
                                Merging {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} into "{sourcePost.title}"
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Combined votes: <strong>{totalVotes}</strong>
                            </p>
                        </div>

                        {/* Title/Content Options */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Choose title and description</Label>

                            <RadioGroup value={mergeOption} onValueChange={(v) => setMergeOption(v as any)}>
                                {/* Option 1: Keep current post's title */}
                                <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                                    <RadioGroupItem value="target" id="target" className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor="target" className="font-medium cursor-pointer">
                                            Keep current post's title & description
                                        </Label>
                                        <p className="text-sm text-gray-600 mt-1">"{sourcePost.title}"</p>
                                    </div>
                                </div>

                                {/* Option 2: Use selected post's title */}
                                <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                                    <RadioGroupItem value="source" id="source" className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor="source" className="font-medium cursor-pointer">
                                            Use a selected post's title & description
                                        </Label>
                                        {mergeOption === 'source' && (
                                            <div className="mt-2 space-y-2">
                                                {selectedPosts.map((post) => (
                                                    <div
                                                        key={post.id}
                                                        className={`p-2 border rounded cursor-pointer text-sm ${
                                                            selectedSourceForTitle === post.id
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'hover:border-gray-400'
                                                        }`}
                                                        onClick={() => setSelectedSourceForTitle(post.id)}
                                                    >
                                                        {post.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Option 3: Custom title */}
                                <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                                    <div className="flex-1">
                                        <Label htmlFor="custom" className="font-medium cursor-pointer">
                                            Write custom title & description
                                        </Label>
                                        {mergeOption === 'custom' && (
                                            <div className="mt-2 space-y-3">
                                                <div>
                                                    <Label className="text-sm">Title</Label>
                                                    <Input
                                                        value={customTitle}
                                                        onChange={(e) => setCustomTitle(e.target.value)}
                                                        placeholder="Enter merged post title..."
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm">Description (optional)</Label>
                                                    <Textarea
                                                        value={customContent}
                                                        onChange={(e) => setCustomContent(e.target.value)}
                                                        placeholder="Enter merged post description..."
                                                        className="mt-1"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                            <Button variant="outline" onClick={() => setStep('select')}>
                                Back
                            </Button>
                            <Button
                                onClick={handleMerge}
                                disabled={loading || (mergeOption === 'custom' && !customTitle.trim()) || (mergeOption === 'source' && !selectedSourceForTitle)}
                            >
                                {loading ? 'Merging...' : `Merge ${selectedPosts.length} Post${selectedPosts.length > 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
