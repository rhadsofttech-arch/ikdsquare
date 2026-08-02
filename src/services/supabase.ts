import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabase);
};

// Google Auth Sign-In via OAuth
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Authentication service is not configured yet. Please contact support.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
  return data;
}

// Sign Out Helper
export async function logoutUser() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Supabase Sign-Out Error:', error);
  }
}

// Email & Password Sign Up via Supabase Auth
export async function signUpWithEmailPassword(
  email: string,
  password: string,
  metadata?: { name?: string; phone?: string; role?: string; area?: string }
) {
  if (!supabase) {
    console.warn('Supabase client not initialized - using fallback state.');
    return { id: 'u-' + Date.now(), email, emailVerified: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    },
  });

  if (error) {
    console.error('Supabase Sign-Up Error:', error);
    throw error;
  }

  return {
    id: data.user?.id || 'u-' + Date.now(),
    email: data.user?.email || email,
    emailVerified: Boolean(data.user?.email_confirmed_at),
  };
}

// Email & Password Sign In via Supabase Auth
export async function loginWithEmailPassword(email: string, password: string) {
  if (!supabase) {
    console.warn('Supabase client not initialized - using fallback state.');
    return { id: 'u-' + Date.now(), email, emailVerified: true };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Supabase Login Error:', error);
    throw error;
  }

  return {
    id: data.user?.id || 'u-' + Date.now(),
    email: data.user?.email || email,
    emailVerified: Boolean(data.user?.email_confirmed_at),
  };
}

// Resend Email Verification
export async function resendSupabaseVerificationEmail(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  if (error) {
    console.error('Supabase resend email error:', error);
    return false;
  }
  return true;
}

// Password Reset: Send Password Reset Email
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Authentication service is not configured yet.' };
  }
  const redirectTo = `${window.location.origin}/#reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    console.error('Password Reset Error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Password Reset: Update User Password after recovery link click
export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Authentication service is not configured yet.' };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    console.error('Supabase Update Password Error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Check Email Verification Status
export async function checkSupabaseEmailVerified(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    return Boolean(data.user.email_confirmed_at);
  }
  return false;
}

// Supabase Storage Helper for Uploading Images & Documents
export async function uploadToSupabaseStorage(
  file: File,
  bucket: 'images' | 'documents' = 'images',
  folder: string = 'uploads'
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase storage not configured.');
    return null;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: true });

  if (error) {
    console.error(`Supabase Storage Upload Error (${bucket}):`, error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}
