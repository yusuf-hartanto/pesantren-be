'use strict';

import { AsyncLocalStorage } from 'async_hooks';

export interface UserContextStore {
  username: string | null;
  id_cabang?: string | null;
  id_orgunit?: string | null;
  id_lembaga?: string | null;
  lembaga_type?: string | null;
}

const userContext = new AsyncLocalStorage<UserContextStore>();

export function runWithUser(username: string | null, fn: () => any) {
  return userContext.run({ 
    username, 
    id_cabang: null, 
    id_orgunit: null, 
    id_lembaga: null,
    lembaga_type: null,
  }, fn);
}

export function setUserLogin(username: string = 'sistem') {
  const store = userContext.getStore();
  if (store) store.username = username;
}

export function getUserLogin() {
  const store = userContext.getStore();
  return store?.username || 'sistem';
}

export function setUserContextData(data: Partial<Omit<UserContextStore, 'username'>>) {
  const store = userContext.getStore();
  if (store) {
    if (data.id_cabang !== undefined) store.id_cabang = data.id_cabang;
    if (data.id_orgunit !== undefined) store.id_orgunit = data.id_orgunit;
    if (data.id_lembaga !== undefined) store.id_lembaga = data.id_lembaga;
    if (data.lembaga_type !== undefined) store.lembaga_type = data.lembaga_type;
  }
}

export function getUserContextData() {
  const store = userContext.getStore();
  return {
    id_cabang: store?.id_cabang || null,
    id_orgunit: store?.id_orgunit || null,
    id_lembaga: store?.id_lembaga || null,
    lembaga_type: store?.lembaga_type || null,
  };
}