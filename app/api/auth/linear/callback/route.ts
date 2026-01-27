import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { LinearClient } from '@linear/sdk';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/organization?error=no_code`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    try {
        // Exchange code for token
        const tokenResponse = await fetch('https://api.linear.app/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.NEXT_PUBLIC_LINEAR_CLIENT_ID!,
                client_secret: process.env.LINEAR_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linear/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            throw new Error(tokenData.error_description || tokenData.error);
        }

        const accessToken = tokenData.access_token;

        // Get Linear viewer/team info
        const linear = new LinearClient({ accessToken });
        const viewer = await linear.viewer;
        const teams = await linear.teams();
        const firstTeam = teams.nodes[0];

        // Get user's org
        const { data: membership } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            throw new Error('No organization association found');
        }

        // Store in database
        await supabase.from('linear_integrations').upsert({
            org_id: membership.org_id,
            access_token: accessToken,
            team_id: firstTeam?.id,
            team_name: firstTeam?.name,
            connected_by_id: user.id
        });

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/organization?success=linear_connected`);
    } catch (e: any) {
        console.error('Linear OAuth failed:', e);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/organization?error=${encodeURIComponent(e.message)}`);
    }
}
