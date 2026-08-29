import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readPersistedJSON, ensureStorageSchemaVersion, STORAGE_SCHEMA_VERSION } from '../storage';

describe('readPersistedJSON', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('retorna o valor parseado quando o JSON é válido', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, nome: 'Matheus' }));

    const result = readPersistedJSON('user', null);

    expect(result).toEqual({ id: 1, nome: 'Matheus' });
  });

  it('retorna o fallback quando a chave não existe', () => {
    const result = readPersistedJSON('user', null);

    expect(result).toBeNull();
  });

  it('retorna o fallback e remove a chave quando o valor é uma string vazia', () => {
    localStorage.setItem('user', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = readPersistedJSON('user', null);

    expect(result).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('retorna o fallback e remove a chave quando o valor é a string literal "undefined"', () => {
    localStorage.setItem('user', 'undefined');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = readPersistedJSON('user', null);

    expect(result).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('retorna o fallback e remove a chave quando o JSON está malformado', () => {
    localStorage.setItem('user', '{ id: 1, nome: "Matheus" '); // sem fechar chaves, aspas erradas
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = readPersistedJSON('user', null);

    expect(result).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('não afeta outras chaves de storage ao remover a chave corrompida', () => {
    localStorage.setItem('user', '{bad json');
    localStorage.setItem('token', 'um-token-valido');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    readPersistedJSON('user', null);

    expect(localStorage.getItem('token')).toBe('um-token-valido');
  });
});

describe('ensureStorageSchemaVersion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('limpa as chaves de auth quando não existe versão salva (primeira execução após o deploy)', () => {
    localStorage.setItem('token', 'token-antigo');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    localStorage.setItem('portal_token', 'portal-token-antigo');
    localStorage.setItem('portal_cliente', JSON.stringify({ id: 2 }));

    ensureStorageSchemaVersion();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('portal_token')).toBeNull();
    expect(localStorage.getItem('portal_cliente')).toBeNull();
    expect(localStorage.getItem('@lambda:storage_version')).toBe(STORAGE_SCHEMA_VERSION);
  });

  it('limpa as chaves de auth quando a versão salva é de um schema anterior', () => {
    localStorage.setItem('@lambda:storage_version', '0');
    localStorage.setItem('token', 'token-com-schema-antigo');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    ensureStorageSchemaVersion();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('@lambda:storage_version')).toBe(STORAGE_SCHEMA_VERSION);
  });

  it('não mexe nas chaves de auth quando a versão salva já é a atual', () => {
    localStorage.setItem('@lambda:storage_version', STORAGE_SCHEMA_VERSION);
    localStorage.setItem('token', 'token-valido');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    ensureStorageSchemaVersion();

    expect(localStorage.getItem('token')).toBe('token-valido');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: 1 }));
  });
});
