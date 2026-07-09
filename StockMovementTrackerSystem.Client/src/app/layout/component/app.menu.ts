import { Component, inject, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { NAVIGATION_MENU } from '../../../app.menu';
import { SharedService } from '../../shared/services/shared.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [AppMenuitem, RouterModule],
  template: `
    <ul class="layout-menu">
      @for (item of model; track item; let i = $index) {
        @if (!item.separator) {
          <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
        }
        @if (item.separator) {
          <li class="menu-separator"></li>
        }
      }
    </ul>
  `,
})
export class AppMenu implements OnInit {
  private readonly sharedService = inject(SharedService);
  model: MenuItem[] = [];

  ngOnInit() {
    const role = this.sharedService.getUserRole();

    const userRoles = role.split(',').map(r => r.trim().toLowerCase());
    this.model = this.filterMenuByRole(NAVIGATION_MENU, userRoles);
  }

  private filterMenuByRole(menu: ReadonlyArray<any>, userRoles: string[]): any[] {
    return menu
      .filter(item => {
        if (!item.roles) return true;
        const allowedRoles = item.roles.map((r: string) => r.toLowerCase());
        return allowedRoles.some((role: string) => userRoles.includes(role));
      })
      .map(item => ({
        ...item,
        items: item.items
          ? this.filterMenuByRole(item.items, userRoles)
          : undefined
      }))
      .filter(item => !item.items || item.items.length > 0);
  }
}