import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { LazyProgressBar } from './app/shared/components/lazy-progress-bar/lazy-progress-bar';
import { TitleService } from './app/shared/services/title.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LazyProgressBar, ToastModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('StockMovementTrackerSystem');

  translationsLoaded: boolean = false;

  constructor(
    private translate: TranslateService,
    private titleService: TitleService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Use the language and wait for the observable to resolve
    let lang = window.localStorage.getItem('lang') || 'en';
    console.log(lang);
    this.translate.use(lang).subscribe({
      next: () => {
        this.translationsLoaded = true;
      },
      error: (error) => {
        console.error('Failed to load translations:', error);
        // You might want to show an error message or fallback
        this.translationsLoaded = true;
      },
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(true), // Ensure execution on refresh
        map(() => this.activatedRoute),
        map((route) => {
          const titles: string[] = [];
          while (route) {
            if (route.snapshot.data['title']) {
              titles.unshift(route.snapshot.data['title']);
            }
            route = route.firstChild!;
          }
          return titles;
        }),
      )
      .subscribe((titles) => {
        this.titleService.setTitle(titles);
      });
  }
}
