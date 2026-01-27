import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { LinearClient } from '@linear/sdk';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const postId = params.id;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get post detail
        const { data: post } = await supabase
            .from('posts')
            .select('*, boards(org_id)')
            .eq('id', postId)
            .single();

        if (!post) throw new Error('Post not found');

        // Get Linear integration for org
        const { data: linearIntegration } = await supabase
            .from('linear_integrations')
            .select('*')
            .eq('org_id', post.boards.org_id)
            .single();

        if (!linearIntegration) {
            throw new Error('Linear not connected for this organization');
        }

        const linear = new LinearClient({ accessToken: linearIntegration.access_token });

        // Create Linear issue
        const issueCreate = await linear.createIssue({
            teamId: linearIntegration.team_id!,
            title: post.title,
            description: `**Source**: FeedbackHub\n**Author**: ${post.author_email || post.guest_email || 'Anonymous'}\n\n${post.content || ''}`
        });

        const issue = await issueCreate.issue;

        if (issue) {
            // Update post with Linear info
            await supabase
                .from('posts')
                .update({
                    linear_issue_id: issue.id,
                    linear_issue_url: issue.url
                })
                .eq('id', postId);

            return NextResponse.json({ success: true, url: issue.url });
        } else {
            throw new Error('Failed to create Linear issue');
        }

    } catch (e: any) {
        console.error('Linear sync failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
