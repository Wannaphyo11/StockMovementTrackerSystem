const ADMIN: string[] = ['admin'];
const ADMIN_MANAGER: string[] = ['admin', 'manager'];
const ALL_ROLES: string[] = ['admin', 'manager', 'cashier'];

export const NAVIGATION_MENU: Readonly<any[]> = [
    {
        label: 'MENU.HOME',
        items: [
            {
                label: 'MENU.DASHBOARD',
                icon: 'pi pi-fw pi-chart-pie',
                routerLink: ['/dashboard'],
            },
        ],
    },
    {
        label: 'MENU.MASTER',
        items: [
            {
                label: 'MENU.MASTER.PRODUCT-STOCK',
                icon: 'pi pi-box',
                routerLink: ['/master/product-stock'],

            },

            // {
            //     label: 'MENU.MASTER.FORMULA_OUTPUT',
            //     routerLink: ['/master/formula-output'],
            // },
            // {
            //     label: 'MENU.MASTER.FORMULA_COMPONENT',
            //     routerLink: ['/master/formula-component'],
            // },

        ],
    },
];
