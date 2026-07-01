import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter, map } from 'rxjs';
import { NAVIGATION_MENU } from '../../../app.menu';

@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  private titleSubject = new BehaviorSubject<string>('Dashboard');
  title$ = this.titleSubject.asObservable(); // Observable for title updates

  private buttonSubject = new BehaviorSubject<{ show: boolean; link: string }>({
    show: false,
    link: ''
  });
  button$ = this.buttonSubject.asObservable(); // Observable for button updates

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.updateTitleAndButton(this.activatedRoute))
    )
    .subscribe();
  }

  private updateTitleAndButton(route: ActivatedRoute): void {
    let lastTitle = 'Dashboard';
    let showButton = false;
    let buttonLink = '';

    while (route) {
      if (route.snapshot.data['title']) {
        lastTitle = route.snapshot.data['title'];
      }
      route = route.firstChild!;
    }

    // Get the current URL
    const currentUrl = this.router.url;

    // Check if the current URL exists in menu.ts
    let routeFound = false;
    for (const category of NAVIGATION_MENU) {
      for (const item of category.items) {
        if (item.routerLink === undefined) continue;

        if (currentUrl === item.routerLink[0]) {
          routeFound = true;
          break;
        }
      }
    }

    // If not found, show the back button
    if (!routeFound) {
      showButton = true;
      buttonLink = 'back'; // Custom link for handling back navigation
    }

    this.titleSubject.next(lastTitle);
    this.buttonSubject.next({ show: showButton, link: buttonLink });
  }
}

