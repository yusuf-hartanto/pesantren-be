'use strict';

export default class DataMenu {
  public menu() {
    return [
      {
        id: 1,
        menu_name: 'Dashboard',
        menu_icon: 'tabler-dashboard',
        module_name: 'dashboard',
        seq_number: 1,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
      {
        id: 2,
        menu_name: 'Settings',
        menu_icon: 'tabler-smart-home',
        module_name: '#',
        seq_number: 99,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
    ];
  }

  public childmenu() {
    return [
      {
        parent_id: 2,
        menu_name: 'Menu',
        menu_icon: 'Circle',
        module_name: 'master/menu',
        seq_number: 91,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Role',
        menu_icon: 'Circle',
        module_name: 'master/role',
        seq_number: 92,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'User',
        menu_icon: 'Circle',
        module_name: 'master/user',
        seq_number: 93,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Param Global',
        menu_icon: 'Circle',
        module_name: 'master/param-global',
        seq_number: 94,
        status: 1,
      },
    ];
  }
}
export const datamenu = new DataMenu();
