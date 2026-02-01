import { Resend } from 'resend';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY is not set. Email triggers will be disabled.');
        return null;
    }
    return new Resend(apiKey);
}

function getFromEmail(): string {
    // Resend requires either:
    // 1. A verified domain (for production)
    // 2. Their test domain: onboarding@resend.dev (for development/testing)
    // You CANNOT use Gmail or other personal emails directly
    // 
    // For now, using Resend's test domain which works without verification
    return process.env.RESEND_FROM_EMAIL || 'FeedbackHub <onboarding@resend.dev>';
}

async function sendEmailSafely(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
}): Promise<{ success: boolean; error?: string }> {
    const resend = getResendClient();
    if (!resend) {
        return { success: false, error: 'Resend client not available' };
    }

    try {
        const result = await resend.emails.send(params);
        if (result.error) {
            console.error('Resend API error:', result.error);
            return { success: false, error: result.error.message || 'Failed to send email' };
        }
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send email:', error);
        
        // Handle 403 (domain not verified) or other errors
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            return { 
                success: false, 
                error: 'Domain not verified in Resend. Please verify your domain or use onboarding@resend.dev for testing.' 
            };
        }
        
        return { success: false, error: error.message || 'Failed to send email' };
    }
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
    const orgId = (post.boards as any)?.org_id;
    if (!orgId) return;

    const adminClient = createAdminClient();
    const { data: members } = await adminClient
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .in('role', ['admin', 'owner']);

    if (!members || members.length === 0) return;

    // Get user emails
    for (const member of members) {
        const { data: user } = await adminClient.auth.admin.getUserById(member.user_id);
        if (user?.user?.email) {
            await sendEmailSafely({
                from: getFromEmail(),
                to: user.user.email,
                subject: `New feedback: ${post.title}`,
                html: `<p>New feedback submitted: <strong>${post.title}</strong></p><p>${post.content || ''}</p>`
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
        await sendEmailSafely({
            from: getFromEmail(),
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

    await sendEmailSafely({
        from: getFromEmail(),
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
        await sendEmailSafely({
            from: getFromEmail(),
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

    await sendEmailSafely({
        from: getFromEmail(),
        to: email,
        subject: `You've been invited to join FeedbackHub`,
        html: `
            <p>You've been invited to join the team on FeedbackHub${inviterName ? ` by ${inviterName}` : ''}.</p>
            <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
            <p>Or copy this link: ${inviteUrl}</p>
        `
    });
}

/**
 * Send signup confirmation email via Resend
 */
export async function sendSignupConfirmationEmail(email: string, confirmationUrl: string) {
    const resend = getResendClient();
    if (!resend) {
        console.warn('Resend client not available, skipping signup confirmation email');
        return;
    }

    const result = await sendEmailSafely({
        from: getFromEmail(),
        to: email,
        subject: 'Confirm your FeedbackHub account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #000;">Welcome to FeedbackHub!</h1>
                <p>Thank you for signing up. Please confirm your email address to get started.</p>
                <p style="margin: 24px 0;">
                    <a href="${confirmationUrl}" 
                       style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
                        Confirm Email Address
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${confirmationUrl}" style="color: #0066cc;">${confirmationUrl}</a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 24px;">
                    If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
        `
    });

    if (!result.success) {
        throw new Error(result.error || 'Failed to send signup confirmation email');
    }
}

/**
 * Send password reset email via Resend
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
    const resend = getResendClient();
    if (!resend) {
        console.warn('Resend client not available, skipping password reset email');
        return;
    }

    const result = await sendEmailSafely({
        from: getFromEmail(),
        to: email,
        subject: 'Reset your FeedbackHub password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #000;">Reset Your Password</h1>
                <p>You requested to reset your password. Click the button below to create a new password.</p>
                <p style="margin: 24px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
                        Reset Password
                    </a>
                </p>
                <p style="color: #666; font-size: 14px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #0066cc;">${resetUrl}</a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 24px;">
                    This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                </p>
            </div>
        `
    });

    if (!result.success) {
        throw new Error(result.error || 'Failed to send password reset email');
    }
}
