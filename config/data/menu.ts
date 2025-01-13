'use strict';

export default class DataMenu {
  public menu() {
    return [
      {
        id: 1,
        menu_name: 'Dashboard',
        menu_icon: 'Home',
        module_name: 'dashboard',
        seq_number: 1,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
      {
        id: 2,
        menu_name: 'Insurance',
        menu_icon: 'Activity',
        module_name: '#',
        seq_number: 2,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
      {
        id: 3,
        menu_name: 'Survey',
        menu_icon: 'CheckSquare',
        module_name: '#',
        seq_number: 3,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
      {
        id: 4,
        menu_name: 'Control Panel',
        menu_icon: 'Users',
        module_name: '#',
        seq_number: 4,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
    ];
  }

  public childmenu() {
    return [
      {
        parent_id: 2,
        menu_name: 'Client',
        menu_icon: 'Users',
        module_name: '#',
        seq_number: 21,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Policy',
        menu_icon: 'Activity',
        module_name: 'policy',
        seq_number: 22,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Record',
        menu_icon: 'Activity',
        module_name: 'record',
        seq_number: 23,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Event',
        menu_icon: 'Circle',
        module_name: 'event',
        seq_number: 31,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Form',
        menu_icon: 'Circle',
        module_name: 'form',
        seq_number: 32,
        status: 1,
      },
      {
        parent_id: 4,
        menu_name: 'Menu',
        menu_icon: 'Circle',
        module_name: 'menu',
        seq_number: 41,
        status: 1,
      },
      {
        parent_id: 4,
        menu_name: 'Role',
        menu_icon: 'Circle',
        module_name: 'role',
        seq_number: 42,
        status: 1,
      },
      {
        parent_id: 4,
        menu_name: 'Role Menu',
        menu_icon: 'Circle',
        module_name: 'role_menu',
        seq_number: 43,
        status: 1,
      },
      {
        parent_id: 4,
        menu_name: 'User',
        menu_icon: 'Circle',
        module_name: 'user',
        seq_number: 44,
        status: 1,
      },
      {
        parent_id: 4,
        menu_name: 'Global Param',
        menu_icon: 'Circle',
        module_name: 'global_param',
        seq_number: 45,
        status: 1,
      },
    ];
  }
}
export const datamenu = new DataMenu();
