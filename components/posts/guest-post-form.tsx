'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface GuestPostFormProps {
    boardId: string;
    onPostCreated?: () => void;
}

export function GuestPostForm({ boardId, onPostCreated }: GuestPostFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: description,
                    board_id: boardId,
                    guest_email: email,
                    guest_name: name,
                    is_guest: true
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit post');
            }

            setSuccess(true);
            setTitle('');
            setDescription('');
            setEmail('');
            setName('');
            onPostCreated?.();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-6 border rounded-lg text-center space-y-4">
                <h3 className="text-lg font-bold">Feedback Submitted!</h3>
                <p className="text-gray-600">Thank you for your feedback. We'll let you know when there's an update.</p>
                <Button onClick={() => setSuccess(false)}>Submit another</Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-bold">Submit Feedback</h3>

            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    placeholder="Short, descriptive title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="Tell us more..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email (Required)</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                        id="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
        </form>
    );
}
