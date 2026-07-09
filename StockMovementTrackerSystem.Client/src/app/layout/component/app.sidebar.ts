import { Component, ElementRef } from '@angular/core';
import { AppMenu } from './app.menu';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [AppMenu, CommonModule],
    template: `
      <div class="layout-sidebar bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200/70 dark:border-slate-700/60">

        <!-- Branded mini-header -->
        <!-- <div class="flex items-center gap-2.5 px-4 py-3">
          <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <i class="pi pi-box text-white text-sm"></i>
          </span>
          <div class="flex flex-col leading-tight">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">Stock Tracker</span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500">Movement System</span>
          </div>
        </div> -->

        <!-- Gradient divider -->
        <!-- <div class="mx-4 mb-1 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent"></div> -->

        <app-menu></app-menu>
      </div>`
})
export class AppSidebar {
    constructor(public el: ElementRef) {}
}
