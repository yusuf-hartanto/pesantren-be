'use strict';

interface EmailConfig {
  service: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  sender: string;
  secure: boolean;
  debug: boolean;
}

let mailConfig: EmailConfig;

export function initializeMail(data: any) {
  if (mailConfig) return mailConfig;

  mailConfig = {
    service: data?.service || 'smtp.mailtrap.io',
    host: data?.host || 'smtp.mailtrap.io',
    port: +(data?.port || 2525),
    user: data?.user || 'fce06934e4832d',
    pass: data?.pass || '27ceb283c382c4',
    sender: data?.sender || 'no-reply@yopmail.com',
    secure: data?.secure == 'ssl' ? true : false,
    debug: data?.debug == 'false',
  };

  return mailConfig;
}

export { mailConfig };
