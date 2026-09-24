// NEXT_PUBLIC_* подставляются при сборке: на Render переменные нужны до `npm run build`.
// Ключ — публичный: новый publishable (sb_publishable_…) или классический anon. Ключ service_role сюда не годится.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Аккаунты включены, только если заданы адрес проекта и публичный ключ Supabase. Без них сайт работает локально. */
export const supabaseConfig = url && key ? { url, key } : null;

export const accountsEnabled = supabaseConfig !== null;
