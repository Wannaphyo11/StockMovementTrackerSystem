import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { LayoutService } from '../service/layout.service';
import { TranslateService } from '@ngx-translate/core';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { AppFloatingConfigurator } from './app.floatingconfigurator';
import { BreadCrumb } from '../../shared/components/bread-crumb/bread-crumb';
import { SharedService } from '../../shared/services/shared.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    TieredMenuModule,
    PopoverModule,
    MenubarModule,
    BreadCrumb,
    AppFloatingConfigurator
  ],
  template: `
    <div class="layout-topbar">
      <div class="layout-topbar-logo-container">
        <button
          class="layout-menu-button layout-topbar-action"
          (click)="layoutService.onMenuToggle()"
        >
          <i class="pi pi-bars"></i>
        </button>
        <a class="layout-topbar-logo font-bold" routerLink="/">
          <img src="images/logo-banner.png" alt="Sakai Logo" class="h-14" />
        </a>
      </div>
      <div class="layout-topbar-breadcrumbs">
        <app-bread-crumb></app-bread-crumb>
      </div>
      <div class="layout-topbar-module-menu xl:mx-auto xl:block hidden">
        <p-menubar [model]="moduleMenu"></p-menubar>
      </div>
      <div class="layout-topbar-actions">
        <div class="layout-config-menu">
          <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
            <i
              [ngClass]="{
                'pi ': true,
                'pi-moon': layoutService.isDarkTheme(),
                'pi-sun': !layoutService.isDarkTheme(),
              }"
            ></i>
          </button>
        </div>

        <button
          class="layout-topbar-menu-button layout-topbar-action"
          pStyleClass="@next"
          enterFromClass="hidden"
          enterActiveClass="animate-scalein"
          leaveToClass="hidden"
          leaveActiveClass="animate-fadeout"
          [hideOnOutsideClick]="true"
        >
          <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu hidden lg:block">
          <div class="layout-topbar-menu-content">
            @for (menuItem of moduleMenu; track $index) {
              <button class="layout-topbar-action layout-topar-module-menu-action"
                      (click)="window.open(menuItem.url , '_self')">
                <i [class]="menuItem.icon"></i>
                <span>{{ menuItem.label }}</span>
              </button>
            }

            <button type="button" class="layout-topbar-action">
              <i class="pi pi-inbox"></i>
              <span>Messages</span>
            </button>
            <button type="button" class="layout-topbar-action" (click)="opToggle($event)">
              <i class="pi pi-user"></i>
              <span>Profile</span>
            </button>
            <button type="button" class="layout-topbar-action" (click)="opToggle($event)">
              <i class="pi pi-sign-out"></i>
              <span>Logout</span>
            </button>
            <p-popover #op>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-4">
                  <div class="border border-gray-200 rounded-md px-4 py-2">
                    <span class="text-base font-semibold">{{ userName }}</span>
                  </div>
                  <div class="grid grid-cols-2 w-full">
                    <div
                      class="col-span-1 border border-gray-200 border-r-0 rounded-r-none rounded-md px-4 py-2"
                    >
                      <button
                        type="button"
                        class="flex items-center"
                        (click)="switchLanguage('en')"
                      >
                        <img src="assets/flags/en.svg" alt="EN" class="w-6 h-6 inline-block mr-2" />
                        <span class="text-base font-semibold">ENGLISH</span>
                      </button>
                    </div>
                    <div
                      class="col-span-1 border border-gray-200 rounded-l-none rounded-md px-4 py-2"
                    >
                      <button
                        type="button"
                        class="flex items-center"
                        (click)="switchLanguage('mm')"
                      >
                        <img src="assets/flags/mm.svg" alt="EN" class="w-6 h-6 inline-block mr-2" />
                        <span class="text-base font-semibold">မြန်မာ</span>
                      </button>
                    </div>
                  </div>
                </div>
                <p-tieredmenu #menu [model]="items" />
              </div>
            </p-popover>
          </div>
        </div>
      </div>
    </div>
    <div class="hidden">
      <app-floating-configurator></app-floating-configurator>
    </div>
  `,
  styles: [
    `
      ::ng-deep .p-menubar {
        background: none !important;
        border: none !important;
      }

      .layout-topar-module-menu-action {
        display: none !important;
      }

      @media (max-width: 1000px) {
        .layout-topbar-module-menu {

        }

        .layout-topar-module-menu-action {
          display: inline-flex !important;
        }
      }

    `
  ]
})
export class AppTopbar implements OnInit {
  @ViewChild('op') op!: any;

  items!: MenuItem[];
  moduleMenu!: MenuItem[];
  userName: string | null = 'N/A';
  userRole: string | null = 'N/A';

  constructor(
    private renderer: Renderer2,
    public layoutService: LayoutService,
    private sharedService: SharedService,
    private authServices: AuthService,
    private translateService: TranslateService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.userName = this.sharedService.getUserName();
    this.userRole = this.sharedService.getUserRole();
    let lang = window.localStorage.getItem('lang') || 'en';
    this.switchLanguage(lang);

    this.items = [
      {
        label: 'Settings',
        icon: 'pi pi-cog'
      },
      {
        label: 'Search',
        icon: 'pi pi-search'
      },
      {
        separator: true
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => {
          this.authServices.logoutForce();
          this.router.navigate(['/auth/login']);
        }
      }
    ];

    const isProduction = environment.production;
    const domainUrl: string = isProduction ? 'https://agriburma.com' : 'https://agriburma.com/uat';

    this.moduleMenu =
      this.userRole === 'analysis'
        ? []
        : [
            {
              label: 'Dashboard',
              icon: 'pi pi-chart-pie',
              url: `${domainUrl}/dashboard`,
            },
            {
              label: 'Master',
              icon: 'pi pi-database',
              url: `${domainUrl}/master`,
            },
            {
              label: 'Stock',
              icon: 'pi pi-box',
              url: `${domainUrl}/stock`,
            },
            {
              label: 'Inventory',
              icon: 'pi pi-box',
              url: `${domainUrl}/inventory`,
            },
            {
              label: 'Trade',
              icon: 'pi pi-sync',
              url: `${domainUrl}/trade`,
            },
          ];
  }

  switchLanguage(lang: string) {
    this.translateService.use(lang);
    window.localStorage.setItem('lang', lang);
    // Set initial lang
    this.setHtmlLang(lang);
  }

  opToggle(event: Event) {
    this.op.toggle(event);
  }

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme
    }));
  }

  setHtmlLang(lang: string) {
    this.renderer.setAttribute(document.documentElement, 'lang', lang);
  }

  protected readonly window = window;
}
