const ADMIN: string[] = ['admin'];
const CASHIER: string[] = ['cashier'];
const ALL_ROLES: string[] = ['admin', 'cashier'];

export const NAVIGATION_MENU: Readonly<any[]> = [
    {
        label: 'MENU.HOME',
        roles: ALL_ROLES,
        items: [
            {
                label: 'MENU.DASHBOARD',
                icon: 'pi pi-fw pi-chart-pie',
                routerLink: ['/dashboard'],
                roles: ALL_ROLES
            },
        ],
    },
    {
        label: 'MENU.MASTER',
        roles: ALL_ROLES,
        items: [
            {
                label: 'MENU.MASTER.PRODUCT_STOCK',
                icon: 'pi pi-box',
                routerLink: ['/master/product-stock'],
                roles: ALL_ROLES
            },
            {
                label: 'MENU.MASTER.STOCK_MOVEMENT',
                icon: 'pi pi-arrow-right-arrow-left',
                routerLink: ['/process/stock-movement'],
                roles: ALL_ROLES
            },
            {
                label: 'MENU.MASTER.PRODUCT_STOCK_SUMMARY',
                icon: 'pi pi-list-check',
                routerLink: ['/process/product-stock-summary'],
                roles: ALL_ROLES
            },
            {
                label: 'MENU.MASTER.USER_INFO',
                icon: 'pi pi-list-check',
                routerLink: ['/user/user-manage'],
                roles: ADMIN
            },
        ],
    },
];