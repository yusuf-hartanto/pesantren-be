'use strict';

export default class DataMenu {
  public menu() {
    return [
      {
        id: 1,
        menu_name: 'Dashboard',
        menu_icon: 'Circle',
        module_name: 'dashboard',
        seq_number: 1,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
      {
        id: 2,
        menu_name: 'Settings',
        menu_icon: 'Circle',
        module_name: '#',
        seq_number: 2,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      },
      {
        id: 3,
        menu_name: 'Master',
        menu_icon: 'Circle',
        module_name: '#',
        seq_number: 3,
        parent_id: '00000000-0000-0000-0000-000000000000',
        status: 1,
      }
    ];
  }

  public childmenu() {
    return [
      {
        parent_id: 2,
        menu_name: 'User',
        menu_icon: 'Circle',
        module_name: 'user',
        seq_number: 3,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Role',
        menu_icon: 'Circle',
        module_name: 'role',
        seq_number: 4,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Menu',
        menu_icon: 'Circle',
        module_name: 'menu',
        seq_number: 5,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Role Menu',
        menu_icon: 'Circle',
        module_name: 'role_menu',
        seq_number: 6,
        status: 1,
      },
      {
        parent_id: 2,
        menu_name: 'Param Global',
        menu_icon: 'Circle',
        module_name: 'global_param',
        seq_number: 7,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Tahun Angkatan',
        menu_icon: 'Circle',
        module_name: 'tahun_angkatan',
        seq_number: 8,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Tingkat',
        menu_icon: 'Circle',
        module_name: 'tingkat',
        seq_number: 9,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Tahun Ajaran',
        menu_icon: 'Circle',
        module_name: 'tahun_ajaran',
        seq_number: 10,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Semester',
        menu_icon: 'Circle',
        module_name: 'semester',
        seq_number: 11,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Status Awal Santri',
        menu_icon: 'Circle',
        module_name: 'status_awal_santri',
        seq_number: 12,
        status: 1,
      },
      {
        parent_id: 3,
        menu_name: 'Beasiswa Santri',
        menu_icon: 'Circle',
        module_name: 'beasiswa_santri',
        seq_number: 13,
        status: 1,
      },
    ];
  }
}
export const datamenu = new DataMenu();
