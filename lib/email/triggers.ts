import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new Resend(apiKey);
}

export async function triggerNewPostEmail(postId: string) {
    const resend = getResendClient();
    if (!resend) return;
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('posts')
        .select('*, boards(*, organizations(*))')
        .eq('id', postId)
        .single();

    if (!post) return;

    // Get org admins
    const { data: members } = await supabase
        .from('organization_members')
        .select('*, users:user_id(email)')
        .eq('org_id', post.boards?.org_id)
        .in('role', ['admin', 'owner']);

    if (!members) return;

    for (const member of members) {
        if (member.users?.email) {
            await resend.emails.send({
                from: 'FeedbackHub <notifications@feedbackhub.com>',
                to: member.users.email,
                subject: `New feedback: ${post.title}`,
                html: `<p>New feedback submitted: <strong>${post.title}</strong></p><p>${post.description || ''}</p>`
            });
        }
    }
}

export async function triggerStatusChangeEmail(postId: string, oldStatus: string, newStatus: string) {
    const resend = getResendClient();
    if (!resend) return;
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('posts')
        .select('*, votes(user_id, users:user_id(email))')
        .eq('id', postId)
        .single();

    if (!post) return;

    const emails = new Set<string>();
    if (post.author_email) emails.add(post.author_email);
    if (post.guest_email) emails.add(post.guest_email);
    post.votes?.forEach((v: any) => {
        if (v.users?.email) emails.add(v.users.email);
    });

    for (const email of emails) {
        await resend.emails.send({
            from: 'FeedbackHub <notifications@feedbackhub.com>',
            to: email,
            subject: `Update: ${post.title} is now ${newStatus}`,
            html: `<p>Status changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong></p><p>${post.title}</p>`
        });
    }
}

export async function triggerNewCommentEmail(postId: string, commentContent: string) {
    const resend = getResendClient();
    if (!resend) return;
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (!post) return;

    const email = post.author_email || post.guest_email;
    if (!email) return;

    await resend.emails.send({
        from: 'FeedbackHub <notifications@feedbackhub.com>',
        to: email,
        subject: `New comment on: ${post.title}`,
        html: `<p>New comment on your post: <strong>${post.title}</strong></p><p>${commentContent}</p>`
    });
}

export async function triggerPostMergedEmail(sourcePostId: string, targetPostId: string) {
    const resend = getResendClient();
    if (!resend) return;
    const supabase = await createClient();
    const { data: sourcePost } = await supabase
        .from('posts')
        .select('*, votes(user_id, users:user_id(email))')
        .eq('id', sourcePostId)
        .single();

    const { data: targetPost } = await supabase
        .from('posts')
        .select('title')
        .eq('id', targetPostId)
        .single();

    if (!sourcePost || !targetPost) return;

    const emails = new Set<string>();
    sourcePost.votes?.forEach((v: any) => {
        if (v.users?.email) emails.add(v.users.email);
    });

    for (const email of emails) {
        await resend.emails.send({
            from: 'FeedbackHub <notifications@feedbackhub.com>',
            to: email,
            subject: `Your feedback was merged`,
            html: `<p>Your feedback <strong>${sourcePost.title}</strong> was merged into <strong>${targetPost.title}</strong></p>`
        });
    }
}

export async function triggerInvitationEmail(email: string, token: string, inviterName?: string) {
    const resend = getResendClient();
    if (!resend) return;
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;

    await resend.emails.send({
        from: 'FeedbackHub <notifications@feedbackhub.com>',
        to: email,
        subject: `You've been invited to join FeedbackHub`,
        html: `
            <p>You've been invited to join the team on FeedbackHub${inviterName ? ` by ${inviterName}` : ''}.</p>
            <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
            <p>Or copy this link: ${inviteUrl}</p>
        `
    });
}
