'use strict';

export default class Transformer {
  public list(data: any) {
    let result: Array<any> = [];
    data.forEach((item: any) => {
      result.push({
        role_id: item?.getDataValue('role_id'),
        role_name: item?.getDataValue('role_name'),
        role_menu_status: item?.getDataValue('status'),
        menu: item?.getDataValue('role_menu').map((m: any) => ({
          menu_id: m?.menu?.getDataValue('menu_id'),
          menu_name: m?.menu?.getDataValue('menu_name'),
          menu_icon: m?.menu?.getDataValue('menu_icon'),
          module_name: m?.menu?.getDataValue('module_name'),
          type_menu: m?.menu?.getDataValue('type_menu'),
          seq_number: m?.menu?.getDataValue('seq_number'),
          parent_id: m?.menu?.getDataValue('parent_id'),
          menu_status: m?.menu?.getDataValue('status'),
          role_menu_status: m?.getDataValue('status') || 0,
          role_menu_view: m?.getDataValue('view') || 0,
          role_menu_create: m?.getDataValue('create') || 0,
          role_menu_edit: m?.getDataValue('edit') || 0,
          role_menu_delete: m?.getDataValue('delete') || 0,
          role_menu_approve: m?.getDataValue('approve') || 0,
          role_menu_import: m?.getDataValue('import') || 0,
          role_menu_export: m?.getDataValue('export') || 0,
        })),
      });
    });
    return result;
  }

  public detail(data: any) {
    const role = data?.dataValues;
    return {
      role_id: role?.role_id,
      role_name: role?.role_name,
      role_menu_status: role?.status,
      menu: role?.role_menu.map((m: any) => ({
        menu_id: m?.menu?.getDataValue('menu_id'),
        status: m?.getDataValue('status') || 0,
        view: m?.getDataValue('view') || 0,
        create: m?.getDataValue('create') || 0,
        edit: m?.getDataValue('edit') || 0,
        delete: m?.getDataValue('delete') || 0,
        approve: m?.getDataValue('approve') || 0,
        import: m?.getDataValue('import') || 0,
        export: m?.getDataValue('export') || 0,
      })),
    };
  }
}

export const transformer = new Transformer();
