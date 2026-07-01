import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { ApiLoadingService } from '../../services/api-loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lazy-progress-bar',
  imports: [ProgressBarModule],
  template: `
    <div style="position:fixed;top:0;z-index:1000;width:100%" [hidden]="hidden">
      @if (loading) {
        <p-progressBar
          mode="indeterminate"
          [style]="{ height: '3px' }"
        ></p-progressBar>
      }
    </div>
  `,
})
export class LazyProgressBar implements OnInit {
  loading: boolean = true;
  hidden: boolean = false;
  private apiLoadingSub?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _router: Router,
    private apiLoadingService: ApiLoadingService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.hidden = true;
    } else {
      this.apiLoadingSub = this.apiLoadingService.loading$.subscribe(
        (loading) => {
          this.loading = loading;
          this.cdr.markForCheck();
        },
      );
    }
  }

  ngOnDestroy(): void {
    this.apiLoadingSub?.unsubscribe();
  }
}
