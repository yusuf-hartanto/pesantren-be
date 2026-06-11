'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'from',
      'to',
      'title',
      'type',
      'url',
      'message',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
