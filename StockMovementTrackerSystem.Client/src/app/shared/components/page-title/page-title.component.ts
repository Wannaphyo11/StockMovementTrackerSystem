import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { Observable, Subscription } from "rxjs";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-page-title',
  template: `
    <div class="flex gap-2 items-center content-center">
      <div class="scale-75" *ngIf="showButton">
        <p-button icon="pi pi-angle-left" severity="warn" [rounded]="true" size="small"
                  *ngIf="showButton" (click)="window.history.back()" />
      </div>
      <h1 class="text-lg m-0 p-0">{{ title }}</h1>
    </div>
  `,
  styleUrls: ['./page-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule
  ]
})
export class PageTitleComponent implements OnInit, OnDestroy {
  title: string = 'Dashboard';
  showButton: boolean = false;
  buttonLabel: string = '';
  buttonLink: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private pageTitleService: PageTitleService,
    private cdr: ChangeDetectorRef
  ) {
    this.subscriptions.add(
      this.pageTitleService.title$.subscribe((title) => {
        this.title = title;
        this.cdr.markForCheck(); // Ensure UI updates properly
      })
    );

    this.subscriptions.add(
      this.pageTitleService.button$.subscribe((button) => {
        this.showButton = button.show;
        this.buttonLink = button.link;
        this.cdr.markForCheck(); // Ensure UI updates properly
      })
    );
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Prevents memory leaks
  }

  protected readonly window = window;
}
