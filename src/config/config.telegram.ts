'use strict';

interface TeleConfig {
  token: string;
  chatId: string;
}

let teleConfig: TeleConfig;

export function initializeTelegram(data: any) {
  if (teleConfig) return teleConfig;

  teleConfig = {
    token: data?.token || '',
    chatId: data?.chatId || '',
  };

  return teleConfig;
}

export { teleConfig };
