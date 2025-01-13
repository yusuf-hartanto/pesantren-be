'use strict';

import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { helper } from '../../helpers/helper';
import { response } from '../../helpers/response';
import { repository as RepoMenu } from '../app/menu/menu.respository';

dotenv.config();

const nestedChildren = (data: any, parent: string = '') => {
  let result: Array<object> = [];
  data.forEach((item: any) => {
    const menu: any = item?.dataValues;
    if (menu?.parent_id === parent) {
      let children: any = nestedChildren(data, menu?.menu_id);
      result.push({
        ...menu,
        children,
      });
    }
  });
  return result;
};

export default class Controller {
  public index(req: Request, res: Response) {
    return response.success('Hello from the POC RESTful API  !!!!!', null, res);
  }

  public async navigation(req: Request, res: Response) {
    const result = await RepoMenu.list();
    if (result?.length < 1) return response.failed('Data not found', 404, res);
    const navigation = nestedChildren(result);
    return response.success('Data navigation', navigation, res);
  }

  public sendmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, subject, content } = req?.body;
      if (!email) return response.failed('email is required', 422, res);
      if (!subject) return response.failed('subject is required', 422, res);
      if (!content) return response.failed('content is required', 422, res);

      let attachments: Array<Object> = [];
      if (req?.files && req?.files?.attachs) {
        const attachs = req?.files?.attachs;
        if (attachs?.length > 0) {
          for (let i in attachs) {
            attachments.push({
              filename: attachs[i]?.name,
              path: attachs[i]?.tempFilePath,
            });
          }
        } else {
          attachments.push({
            filename: attachs?.name,
            path: attachs?.tempFilePath,
          });
        }
      }

      await helper.sendEmail({
        to: email,
        subject: subject,
        content: content,
        attachments: attachments,
      });

      return response.success('Send email success', null, res);
    } catch (err: any) {
      return helper.catchError(`sendmail: ${err?.message}`, 500, res);
    }
  };
}

export const global = new Controller();
