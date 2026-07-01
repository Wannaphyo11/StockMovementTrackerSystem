import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { Subscription } from 'rxjs';
import { NAVIGATION_MENU } from '../../../../app.menu';
import { TranslatePipe } from '@ngx-translate/core';
import { BreadCrumbStateService } from '../../services/state-management/breadcrumb-state.service';

@Component({
  selector: 'app-bread-crumb',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule, TranslatePipe],
  template: `
    <p-breadcrumb [home]="home" [model]="menuItems">
      <ng-template #item let-item>
        <a class="cursor-pointer" [routerLink]="item.url">
          <i [class]="item.icon"></i>
          <span class="title">{{ item.label | translate }}</span>
        </a>
      </ng-template>
      <ng-template #separator> /</ng-template>
    </p-breadcrumb>`,
  styles: [
    `
      ::ng-deep .p-breadcrumb {
        background: transparent !important;
      }
    `,
  ],
})
export class BreadCrumb implements OnInit, OnDestroy {
  static readonly ROUTE_DATA_BREADCRUMB = 'breadcrumb';
  readonly home = { icon: 'pi pi-home', routerLink: ['/dashboard'] };
  menuItems: MenuItem[] = [];
  displayName: string = '';
  private breadcrumbSub?: Subscription;

  constructor(
    private router: Router,
    private breadcrumbState: BreadCrumbStateService
  ) {
  }

  ngOnInit(): void {
    this.breadcrumbSub = this.breadcrumbState.menuItems$.subscribe((items) => {
      this.menuItems = items;
      if (this.menuItems[this.menuItems.length - 1] !== undefined) {
        let _displayName =
          this.menuItems[this.menuItems.length - 1].label ?? '';
        this.displayName = '';
        _displayName.split(' ').forEach((v, i) => {
          this.displayName += this.titleCaseWord(v) + ' ';
        });
      }
    });
    this.router.events.subscribe((eventData: any) => {
      if (eventData instanceof NavigationEnd) {
        let items = this.buildMenuItems(
          eventData.urlAfterRedirects || eventData.url,
        );
        this.breadcrumbState.setMenuItems(items);
      }
    });
  }

  ngOnDestroy(): void {
    this.breadcrumbSub?.unsubscribe();
  }

  buildMenuItems(url: string): MenuItem[] {
    let menuItems: MenuItem[] = [];
    NAVIGATION_MENU.forEach((v, i) => {
      v.items.forEach((v1: any, i1: any) => {
        if (v1.items !== undefined) {
          v1.items.forEach((v2: any, i2: any) => {
            if (v2.routerLink !== undefined) {
              if (this.getRouterLinkFullPath(v2.routerLink) == url) {
                menuItems.push({ label: v.label, routerLink: null });
                menuItems.push({ label: v1.label, routerLink: null });
                menuItems.push({ label: v2.label, routerLink: url });

                return;
              }
            }
          });
        } else {
          if (v1.routerLink !== undefined) {
            if (this.getRouterLinkFullPath(v1.routerLink) == url) {
              menuItems = [];
              menuItems.push({ label: v.label, routerLink: null });
              menuItems.push({ label: v1.label, routerLink: url });
              return;
            } else if (
              url.startsWith(this.getRouterLinkFullPath(v1.routerLink) ?? '') &&
              menuItems.length == 0
            ) {
              menuItems = [];
              menuItems.push({ label: v.label, routerLink: null });
              menuItems.push({ label: v1.label, routerLink: url });
              return;
            }
          }
        }
      });
    });

    return menuItems.filter((v: MenuItem, i: any) => v.label !== 'MENU.HOME');
  }

  getRouterLinkFullPath(routerLinks: string[] | undefined) {
    if (routerLinks == undefined) return;

    if (routerLinks.length > 1) {
      return routerLinks.join('/');
    } else return routerLinks[0];
  }

  titleCaseWord(word: string) {
    if (!word) return word;
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
  }
}
