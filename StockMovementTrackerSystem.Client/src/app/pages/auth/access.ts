import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-access',
  standalone: true,
  imports: [ButtonModule, RouterModule, RippleModule, AppFloatingConfigurator, ButtonModule],
  template: `
    <app-floating-configurator/>
    <div
      class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
      <div class="flex flex-col items-center justify-center">
        <div
          style="">
          <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center border border-orange-200 shadow-lg"
               style="border-radius: 15px">
            <div class="gap-4 flex flex-col items-center">
              <div class="flex justify-center items-center border-2 border-orange-500 rounded-full"
                   style="width: 3.2rem; height: 3.2rem">
                <i class="text-orange-500 pi pi-fw pi-lock text-2xl!"></i>
              </div>
              <h1 class="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-5xl mb-2">Access Denied</h1>
              <span
                class="text-muted-color mb-8">You do not have the necessary permisions. Please contact admins.</span>
              <div class="col-span-12 mt-8 text-center">
                <p-button label="Go to Dashboard" routerLink="/" severity="warn"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`
})
export class Access {
}
