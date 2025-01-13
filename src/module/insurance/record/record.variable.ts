'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'policy_id',
      'client_id',
      'notification_date',
      'notification_type',
    ];
    return field;
  }
}

export const variable = new Variable();
