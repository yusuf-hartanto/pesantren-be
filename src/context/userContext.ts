'use strict';

import { AsyncLocalStorage } from 'async_hooks';

const userContext = new AsyncLocalStorage<{ username: string | null }>();

export function runWithUser(username: string | null, fn: () => any) {
  return userContext.run({ username }, fn);
}

export function setUserLogin(username: string = 'sistem') {
  const store = userContext.getStore();
  if (store) store.username = username;
}

export function getUserLogin() {
  const store = userContext.getStore();
  return store?.username || 'sistem';
}
