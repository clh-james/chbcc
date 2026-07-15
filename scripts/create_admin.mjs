import { readFile } from 'fs/promises';

const envPath = new URL('../.env', import.meta.url);
const rawEnv = await readFile(envPath, 'utf8');
const env = rawEnv.split(/\r?\n/).reduce((acc, line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return acc;
  const index = trimmed.indexOf('=');
  if (index === -1) return acc;
  const key = trimmed.slice(0, index);
  const value = trimmed.slice(index + 1);
  acc[key] = value;
  return acc;
}, {});

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment or .env file.');
  process.exit(1);
}

const rootUrl = SUPABASE_URL.replace(/\/$/, '');
const adminEmail = 'admin@chloehouse.com';
const adminPassword = 'Admin123!';
const adminMetadata = {
  full_name: 'Admin User',
  role: 'admin',
};

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

async function createAuthUser() {
  const url = `${rootUrl}/auth/v1/admin/users`;
  const body = JSON.stringify({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: adminMetadata,
  });

  const response = await fetch(url, { method: 'POST', headers, body });

  if (response.ok) {
    return response.json();
  }

  const responseText = await response.text();
  let errorData;

  try {
    errorData = JSON.parse(responseText);
  } catch {
    errorData = null;
  }

  if (response.status === 409 || (response.status === 422 && errorData?.error_code === 'email_exists')) {
    console.log('Admin user already exists. Fetching existing user...');
    const existing = await fetchExistingUser();
    await updateExistingUser(existing.id);
    return existing;
  }

  throw new Error(`Failed to create admin user: ${response.status} ${responseText}`);
}

async function updateExistingUser(userId) {
  const url = `${rootUrl}/auth/v1/admin/users/${userId}`;
  const body = JSON.stringify({
    password: adminPassword,
    user_metadata: adminMetadata,
    email_confirm: true,
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update existing admin user: ${response.status} ${errorText}`);
  }

  console.log('Updated existing admin password successfully.');
  return response.text().then((text) => {
    if (!text) return { message: 'Updated existing admin user successfully' };
    try {
      return JSON.parse(text);
    } catch {
      return { message: 'Updated existing admin user successfully', body: text };
    }
  });
}

async function fetchExistingUser() {
  const url = `${rootUrl}/auth/v1/admin/users?email=eq.${encodeURIComponent(adminEmail)}`;
  let response = await fetch(url, { method: 'GET', headers });
  let responseText = await response.text();

  console.log('fetchExistingUser primary status:', response.status);
  console.log('fetchExistingUser primary body:', responseText);

  if (!response.ok) {
    console.warn(`Auth lookup failed with status ${response.status}, retrying list fetch.`);
    const listUrl = `${rootUrl}/auth/v1/admin/users?limit=100`; // fallback list query
    response = await fetch(listUrl, { method: 'GET', headers });
    responseText = await response.text();
    console.log('fetchExistingUser list status:', response.status);
    console.log('fetchExistingUser list body:', responseText);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch existing user: ${response.status} ${responseText}`);
  }

  let users;
  try {
    users = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`Failed to parse existing user response as JSON: ${err instanceof Error ? err.message : err}`);
  }

  if (Array.isArray(users)) {
    const existing = users.find((user) => user.email === adminEmail);
    if (existing) return existing;
  } else if (users && typeof users === 'object' && Array.isArray(users.users)) {
    const existing = users.users.find((user) => user.email === adminEmail);
    if (existing) return existing;
  }

  throw new Error('Admin user not found after conflict response. Please verify the Supabase auth state.');
}

async function upsertProfile(userId) {
  const url = `${rootUrl}/rest/v1/profiles`;
  const body = JSON.stringify([
    {
      id: userId,
      role: 'admin',
      branch_id: '00000000-0000-0000-0000-000000000001',
    },
  ]);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: 'resolution=merge-duplicates',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upsert admin profile: ${response.status} ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    return { message: 'Profile upsert succeeded with empty response body' };
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    return { message: 'Profile upsert succeeded but returned non-JSON body', body: text };
  }
}

try {
  const user = await createAuthUser();
  console.log(`Admin auth user is ready: ${adminEmail}`);
  console.log(`Admin password: ${adminPassword}`);
  console.log(`User ID: ${user.id}`);

  const profileResult = await upsertProfile(user.id);
  console.log('Admin profile created/updated successfully:', profileResult);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
