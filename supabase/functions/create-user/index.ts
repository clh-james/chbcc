// @ts-nocheck
// supabase/functions/create-user/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ✅ FIX: Explicitly type req as Request
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { email, password, fullName, role } = body as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: string;
    };

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Find existing auth user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    // ✅ FIX: Explicitly type u parameter
    const existingUser = existingUsers?.users.find(
      (u: { email?: string; id: string }) => u.email?.toLowerCase() === email.toLowerCase()
    );
    
    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
      await supabase.auth.admin.updateUserById(authUserId, { password });
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: role || 'Stylist' }
      });

      if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
      authUserId = authData.user.id;
    }

    // 2. Check/Update Staff Record
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const staffPayload = {
      full_name: fullName,
      email: email,
      role: role || 'Stylist',
      branch_id: '00000000-0000-0000-0000-000000000001',
      is_active: true,
      specializations: [],
      hourly_rate: 0,
      commission_rate: 0,
      hire_date: new Date().toISOString().split('T')[0],
    };

    if (existingStaff) {
      await supabase.from('staff').update(staffPayload).eq('id', existingStaff.id);
    } else {
      await supabase.from('staff').insert({ ...staffPayload, phone: null });
    }

    // 3. Sync Profiles Table
    await supabase
      .from('profiles')
      .upsert({
        id: authUserId,
        full_name: fullName,
        role: role || 'Stylist',
        branch_id: '00000000-0000-0000-0000-000000000001'
      }, { onConflict: 'id' });

    return new Response(JSON.stringify({ success: true, userId: authUserId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Edge Function Error:', errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});