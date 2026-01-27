import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { triggerPostMergedEmail } from '@/lib/email/triggers';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetPostId } = await request.json();
    const sourcePostId = params.id;

    // Get source post with votes
    const { data: sourcePost } = await supabase
        .from('posts')
        .select('*, votes(*), comments(*)')
        .eq('id', sourcePostId)
        .single();

    if (!sourcePost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get target post votes
    const { data: targetPost } = await supabase
        .from('posts')
        .select('*, votes(*)')
        .eq('id', targetPostId)
        .single();

    if (!targetPost) {
        return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
    }

    const existingVoterIds = new Set(targetPost.votes?.map((v: any) => v.user_id) || []);

    // Move votes (skip duplicates)
    for (const vote of sourcePost.votes || []) {
        if (!existingVoterIds.has(vote.user_id)) {
            await supabase
                .from('votes')
                .update({ post_id: targetPostId })
                .eq('id', vote.id);
        } else {
            await supabase.from('votes').delete().eq('id', vote.id);
        }
    }

    // Move comments
    await supabase
        .from('comments')
        .update({ post_id: targetPostId })
        .eq('post_id', sourcePostId);

    // Update vote count on target
    const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', targetPostId);

    await supabase
        .from('posts')
        .update({ vote_count: count || 0 })
        .eq('id', targetPostId);

    // Mark source as merged
    await supabase
        .from('posts')
        .update({
            merged_into_id: targetPostId,
            merged_at: new Date().toISOString(),
            merged_by_id: user.id,
            status: 'merged'
        })
        .eq('id', sourcePostId);

    // Send email notifications
    try {
        await triggerPostMergedEmail(sourcePostId, targetPostId);
    } catch (e) {
        console.error('Email trigger failed:', e);
    }

    return NextResponse.json({ success: true });
}
