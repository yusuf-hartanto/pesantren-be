'use strict';

import Model from './otp.model';

export default class Repository {
  public detail(condition: any) {
    return Model.findOne({
      where: condition,
      order: [['expired', 'DESC']],
    });
  }

  public async create(data: any) {
    return Model.create(data?.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
    });
  }

  public delete(condition: any) {
    return Model.destroy({
      where: condition,
    });
  }
}

export const repository = new Repository();
