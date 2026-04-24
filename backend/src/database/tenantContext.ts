import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  empresaId: number;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();
