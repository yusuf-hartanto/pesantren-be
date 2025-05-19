'use strict';

import { helper } from './/helper';
import { jwtConfig } from '../config/config.jwt';
import jwt, { JwtPayload } from 'jsonwebtoken';

export default class HelperAuth {
  public decodeBearerToken(token: string) {
    let split: Array<string>;
    if (token == null) return '';

    split = token.split(' ');
    if (split?.length < 2 || split[0] != 'Bearer') return '';
    return split[1];
  }

  public decodeToken(token: string) {
    const data: string = Buffer.from(token, 'base64').toString('ascii');
    const payload: string | JwtPayload = jwt.verify(data, jwtConfig?.secret);
    return payload;
  }

  public decodeExpiredToken(token: string) {
    const data: string = Buffer.from(token, 'base64').toString('ascii');
    const payload: any = jwt.verify(data, jwtConfig?.secret, {
      ignoreExpiration: true,
    });
    return payload;
  }

  public decodeRefreshToken(token: string) {
    const data: string = Buffer.from(token, 'base64').toString('ascii');
    const payload: string | JwtPayload = jwt.verify(
      data,
      jwtConfig?.secretRefresh
    );
    return payload;
  }

  public token(payload: string | Object) {
    const token: string = jwt.sign(payload, jwtConfig?.secret, {
      expiresIn: jwtConfig?.expiresIn,
    });
    return Buffer.from(token).toString('base64');
  }

  public refresh(payload: string | Object) {
    const refresh: string = jwt.sign(payload, jwtConfig?.secretRefresh, {
      expiresIn: jwtConfig?.expiresInRefresh,
    });
    return Buffer.from(refresh).toString('base64');
  }

  public async hashToken(key: string) {
    const hashed: string = await helper.hashIt(
      `${key}_${jwtConfig?.secret}_${helper.date()}`
    );
    return Buffer.from(hashed).toString('base64');
  }

  public newToken(payload: any) {
    const jsonString = JSON.stringify(payload);
    return Buffer.from(jsonString).toString('base64');
  }

  public newDecodeToken(token: string) {
    const decode: string = Buffer.from(token, 'base64').toString('ascii');

    let isJson: boolean = true;
    try {
      JSON.parse(decode);
    } catch (e) {
      isJson = false;
    }

    let payload: any = decode;
    if (isJson) payload = JSON.parse(decode);
    return payload;
  }
}

export const helperauth = new HelperAuth();
