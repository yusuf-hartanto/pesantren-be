'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'menu_name',
      'menu_icon',
      'module_name',
      'type_menu',
      'seq_number',
      'parent_id',
      'status',
    ];
    return field;
  }
}

export const variable = new Variable();
