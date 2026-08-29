// Leitura segura de dados persistidos no localStorage, usada pelos contexts de
// autenticação (AuthContext/PortalAuthContext) para não deixar um JSON.parse
// inválido derrubar a inicialização do app antes do React montar a árvore.

export const STORAGE_SCHEMA_VERSION = '1';
const STORAGE_VERSION_KEY = '@lambda:storage_version';

// Chaves de auth cujo formato é atrelado à versão do schema abaixo.
const VERSIONED_AUTH_KEYS = ['token', 'user', 'portal_token', 'portal_cliente'];

export function readPersistedJSON<T>(key: string, fallback: T): T {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }

  if (raw === null) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] Falha ao ler a chave "${key}" do localStorage, removendo valor inválido.`, error);
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage indisponível (modo privado, quota, etc.) - segue com o fallback
    }
    return fallback;
  }
}

// Compara a versão do schema de storage salva com a atual (STORAGE_SCHEMA_VERSION).
// Se divergirem (ou nunca tiver sido gravada), limpa as chaves de auth versionadas
// e grava a versão vigente - evita incompatibilidades entre deploys que mudam o
// formato do que é persistido.
export function ensureStorageSchemaVersion(): void {
  try {
    const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (currentVersion !== STORAGE_SCHEMA_VERSION) {
      VERSIONED_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_SCHEMA_VERSION);
    }
  } catch {
    // localStorage indisponível - segue sem versionamento
  }
}
