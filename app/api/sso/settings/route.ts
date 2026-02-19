import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateSecretKey } from '@/lib/sso';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get user's organization
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single();
  
  if (!member) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }
  
  // Get organization SSO settings
  const { data: org } = await supabase
    .from('organizations')
    .select('sso_mode, sso_secret_key, guest_posting_enabled, social_login_enabled, login_handler, sso_redirect_enabled, sso_redirect_url')
    .eq('id', member.org_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({
    sso_mode: org.sso_mode || 'guest_only',
    has_secret_key: !!org.sso_secret_key,
    // Only expose secret key to owners
    secret_key: member.role === 'owner' ? org.sso_secret_key : undefined,
    guest_posting_enabled: org.guest_posting_enabled ?? true,
    social_login_enabled: org.social_login_enabled ?? true, // Keep for backward compatibility
    login_handler: org.login_handler || null,
    sso_redirect_enabled: org.sso_redirect_enabled ?? false,
    sso_redirect_url: org.sso_redirect_url || '',
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const {
    sso_mode,
    guest_posting_enabled,
    social_login_enabled,
    login_handler,
    sso_redirect_enabled,
    sso_redirect_url,
  } = body;

  if (sso_mode && !['guest_only', 'trust', 'jwt_required'].includes(sso_mode)) {
    return NextResponse.json({ error: 'Invalid SSO mode' }, { status: 400 });
  }

  if (login_handler !== undefined && login_handler !== null && !['feedbackhub', 'customer'].includes(login_handler)) {
    return NextResponse.json({ error: 'Invalid login_handler' }, { status: 400 });
  }
  
  // Get user's organization
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single();
  
  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can change SSO settings' }, { status: 403 });
  }
  
  const updateData: Record<string, unknown> = {};
  if (sso_mode) updateData.sso_mode = sso_mode;
  if (typeof guest_posting_enabled === 'boolean') updateData.guest_posting_enabled = guest_posting_enabled;
  if (typeof social_login_enabled === 'boolean') updateData.social_login_enabled = social_login_enabled; // Keep for backward compatibility
  if (login_handler !== undefined) updateData.login_handler = login_handler;
  if (typeof sso_redirect_enabled === 'boolean') updateData.sso_redirect_enabled = sso_redirect_enabled;
  if (typeof sso_redirect_url === 'string') updateData.sso_redirect_url = sso_redirect_url;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
  }

  // Update SSO settings
  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', member.org_id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, ...updateData });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { action } = body;
  
  if (action !== 'generate_key') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  
  // Get user's organization
  const { data: member } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single();
  
  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can generate keys' }, { status: 403 });
  }
  
  const newKey = generateSecretKey();
  
  const { error } = await supabase
    .from('organizations')
    .update({ sso_secret_key: newKey })
    .eq('id', member.org_id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, secret_key: newKey });
}
