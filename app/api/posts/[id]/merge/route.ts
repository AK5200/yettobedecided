import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { triggerPostMergedEmail } from '@/lib/email/triggers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const {
        targetPostId,
        sourcePostIds,
        mergeOption,
        customTitle,
        customContent
    } = await request.json();

    // Target post is either specified or the current post (when merging into this post)
    const finalTargetPostId = targetPostId || resolvedParams.id;

    // Source posts to merge - if not provided, use empty array (target-only mode for title update)
    const allSourceIds: string[] = sourcePostIds || [];

    // Get target post
    const { data: targetPost } = await supabase
        .from('posts')
        .select('*, votes(*)')
        .eq('id', finalTargetPostId)
        .single();

    if (!targetPost) {
        return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
    }

    // Collect all existing voter emails from target
    const existingVoterEmails = new Set(
        targetPost.votes?.map((v: any) => v.voter_email).filter(Boolean) || []
    );

    // Get existing tag IDs on target post
    const { data: targetTags } = await supabase
        .from('post_tags')
        .select('tag_id')
        .eq('post_id', finalTargetPostId);
    const existingTagIds = new Set(targetTags?.map((t: any) => t.tag_id) || []);

    // Store source posts data for title/content option before deletion
    const sourcePostsData: Record<string, { title: string; content: string | null }> = {};

    // Track if any source post is featured
    let anySourceFeatured = false;

    // Process each source post
    for (const sourcePostId of allSourceIds) {
        // Get source post with votes and comments
        const { data: sourcePost } = await supabase
            .from('posts')
            .select('*, votes(*), comments(*)')
            .eq('id', sourcePostId)
            .single();

        if (!sourcePost) {
            continue; // Skip if source post not found
        }

        // Store title/content before deletion
        sourcePostsData[sourcePostId] = {
            title: sourcePost.title,
            content: sourcePost.content
        };

        // Track featured status
        if (sourcePost.is_pinned) {
            anySourceFeatured = true;
        }

        // Send email notifications BEFORE deleting (so we can reference the post)
        try {
            await triggerPostMergedEmail(sourcePostId, finalTargetPostId);
        } catch (e) {
            console.error('Email trigger failed:', e);
        }

        // Move votes (skip duplicates by email)
        for (const vote of sourcePost.votes || []) {
            if (vote.voter_email && !existingVoterEmails.has(vote.voter_email)) {
                await supabase
                    .from('votes')
                    .update({ post_id: finalTargetPostId })
                    .eq('id', vote.id);
                existingVoterEmails.add(vote.voter_email);
            } else if (!vote.voter_email && vote.user_id) {
                // Handle legacy votes with user_id
                await supabase
                    .from('votes')
                    .update({ post_id: finalTargetPostId })
                    .eq('id', vote.id);
            } else {
                // Duplicate vote - delete it
                await supabase.from('votes').delete().eq('id', vote.id);
            }
        }

        // Move comments
        await supabase
            .from('comments')
            .update({ post_id: finalTargetPostId })
            .eq('post_id', sourcePostId);

        // Merge tags - move tags from source to target (skip duplicates)
        const { data: sourceTags } = await supabase
            .from('post_tags')
            .select('tag_id')
            .eq('post_id', sourcePostId);

        for (const tag of sourceTags || []) {
            if (!existingTagIds.has(tag.tag_id)) {
                await supabase
                    .from('post_tags')
                    .insert({ post_id: finalTargetPostId, tag_id: tag.tag_id });
                existingTagIds.add(tag.tag_id);
            }
        }

        // Delete any remaining votes on source post
        await supabase
            .from('votes')
            .delete()
            .eq('post_id', sourcePostId);

        // Delete post_tags associations from source
        await supabase
            .from('post_tags')
            .delete()
            .eq('post_id', sourcePostId);

        // Delete the source post
        await supabase
            .from('posts')
            .delete()
            .eq('id', sourcePostId);
    }

    // Update vote count on target
    const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', finalTargetPostId);

    // Determine final title and content based on merge option
    let updateData: Record<string, any> = { vote_count: count || 0 };

    // If any source post was featured, make the merged post featured
    if (anySourceFeatured && !targetPost.is_pinned) {
        updateData.is_pinned = true;
    }

    if (mergeOption === 'custom' && customTitle) {
        updateData.title = customTitle;
        if (customContent !== undefined) {
            updateData.content = customContent;
        }
    } else if (mergeOption === 'source' && allSourceIds.length > 0) {
        // Use stored title/content from first source post
        const firstSourceData = sourcePostsData[allSourceIds[0]];
        if (firstSourceData) {
            updateData.title = firstSourceData.title;
            updateData.content = firstSourceData.content;
        }
    }
    // If mergeOption is 'target' or not specified, keep target's title/content (no change)

    await supabase
        .from('posts')
        .update(updateData)
        .eq('id', finalTargetPostId);

    return NextResponse.json({ success: true });
}
