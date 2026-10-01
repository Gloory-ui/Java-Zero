import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

// Только для серверных маршрутов. Секретный ключ даёт полный доступ к базе и в браузер попадать не должен:
// переменная без NEXT_PUBLIC_, в клиентский код этот модуль не импортируется
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const serverAuth = { persistSession: false, autoRefreshToken: false } as const;

/** Клиент с секретным ключом: читает профили в обход RLS и находит почту аккаунта по id. Без ключа — null */
export const supabaseAdmin =
  supabaseConfig && secret ? createClient(supabaseConfig.url, secret, { auth: serverAuth }) : null;

/** Публичный клиент без сохранения сессии: вход по паролю от имени сервера, сессия уходит в браузер */
export function supabaseAnon() {
  return supabaseConfig ? createClient(supabaseConfig.url, supabaseConfig.key, { auth: serverAuth }) : null;
}
