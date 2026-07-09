import {
  Component,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { LayoutService } from '../service/layout.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[app-menuitem]',
  imports: [CommonModule, RouterModule, RippleModule, TranslatePipe],
  template: `
    <ng-container>
      @if (root && item.visible !== false) {
        <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-4 pt-5 pb-1.5 select-none">
          {{ item.label | translate }}
        </div>
      }
      @if ((!item.routerLink || item.items) && item.visible !== false) {
        <a
          [attr.href]="item.url"
          (click)="itemClick($event)"
          [ngClass]="item.styleClass"
          [attr.target]="item.target"
          tabindex="0"
          pRipple
          class="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 group"
        >
          <span class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors shrink-0">
            <i [ngClass]="item.icon" class="text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm"></i>
          </span>
          <span class="layout-menuitem-text text-slate-700 dark:text-slate-300 text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{{ item.label | translate }}</span>
          @if (item.items) {
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler ml-auto text-slate-400 transition-transform duration-300"></i>
          }
        </a>
      }
      @if (item.routerLink && !item.items && item.visible !== false) {
        <a
          (click)="itemClick($event)"
          [ngClass]="item.styleClass"
          [routerLink]="item.routerLink"
          routerLinkActive="active-route"
          [routerLinkActiveOptions]="
            item.routerLinkActiveOptions || {
              paths: 'exact',
              queryParams: 'ignored',
              matrixParams: 'ignored',
              fragment: 'ignored',
            }
          "
          [fragment]="item.fragment"
          [queryParamsHandling]="item.queryParamsHandling"
          [preserveFragment]="item.preserveFragment"
          [skipLocationChange]="item.skipLocationChange"
          [replaceUrl]="item.replaceUrl"
          [state]="item.state"
          [queryParams]="item.queryParams"
          [attr.target]="item.target"
          tabindex="0"
          pRipple
          class="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 group"
        >
          <span class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors shrink-0"
                [class.!bg-primary-100]="isActiveRoute()"
                [class.dark:!bg-primary-900/50]="isActiveRoute()">
            <i [ngClass]="item.icon"
               class="text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm"
               [class.!text-primary-600]="isActiveRoute()"
               [class.dark:!text-primary-400]="isActiveRoute()"></i>
          </span>
          <span class="layout-menuitem-text text-slate-700 dark:text-slate-300 text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors"
                [class.!text-primary-700]="isActiveRoute()"
                [class.!font-semibold]="isActiveRoute()">
            {{ item.label | translate }}
          </span>
          @if (item.items) {
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler ml-auto text-slate-400 transition-transform duration-300"></i>
          }
        </a>
      }

      @if (item.items && item.visible !== false) {
        <ul [@children]="submenuAnimation">
          @for (child of item.items; track child; let i = $index) {
            <li app-menuitem [item]="child" [index]="i" [parentKey]="key" [class]="child['badgeClass']"></li>
          }
        </ul>
      }
    </ng-container>
  `,
  animations: [
    trigger('children', [
      state(
        'collapsed',
        style({
          height: '0',
        }),
      ),
      state(
        'expanded',
        style({
          height: '*',
        }),
      ),
      transition(
        'collapsed <=> expanded',
        animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'),
      ),
    ]),
  ],
  providers: [LayoutService],
})
export class AppMenuitem implements OnInit, OnDestroy {
  @Input() item!: MenuItem;

  @Input() index!: number;

  @Input() @HostBinding('class.layout-root-menuitem') root!: boolean;

  @Input() parentKey!: string;

  active = false;

  menuSourceSubscription: Subscription;

  menuResetSubscription: Subscription;

  key: string = '';

  constructor(
    public router: Router,
    private layoutService: LayoutService
  ) {
    this.menuSourceSubscription = this.layoutService.menuSource$.subscribe(
      (value) => {
        Promise.resolve(null).then(() => {
          if (value.routeEvent) {
            this.active =
              value.key === this.key || value.key.startsWith(this.key + '-');
          } else {
            if (
              value.key !== this.key &&
              !value.key.startsWith(this.key + '-')
            ) {
              this.active = false;
            }
          }
        });
      },
    );

    this.menuResetSubscription = this.layoutService.resetSource$.subscribe(
      () => {
        this.active = false;
      },
    );

    this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe((params) => {
      if (this.item.routerLink) {
        this.updateActiveStateFromRoute();
      }
    });
  }

  ngOnInit() {
    this.key = this.parentKey
      ? this.parentKey + '-' + this.index
      : String(this.index);

    if (this.item.routerLink) {
      this.updateActiveStateFromRoute();
    }
  }

  updateActiveStateFromRoute() {
    let activeRoute = this.router.isActive(this.item.routerLink[0], {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });

    if (activeRoute) {
      this.layoutService.onMenuStateChange({ key: this.key, routeEvent: true });
    }
  }

  isActiveRoute(): boolean {
    if (!this.item.routerLink) return false;
    return this.router.isActive(this.item.routerLink[0], {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });
  }

  itemClick(event: Event) {
    // avoid processing disabled items
    if (this.item.disabled) {
      event.preventDefault();
      return;
    }

    // execute command
    if (this.item.command) {
      this.item.command({ originalEvent: event, item: this.item });
    }

    // toggle active state
    if (this.item.items) {
      this.active = !this.active;
    }

    this.layoutService.onMenuStateChange({ key: this.key });
  }

  get submenuAnimation() {
    return this.root ? 'expanded' : this.active ? 'expanded' : 'collapsed';
  }

  @HostBinding('class.active-menuitem')
  get activeClass() {
    return this.active && !this.root;
  }

  ngOnDestroy() {
    if (this.menuSourceSubscription) {
      this.menuSourceSubscription.unsubscribe();
    }

    if (this.menuResetSubscription) {
      this.menuResetSubscription.unsubscribe();
    }
  }
}
