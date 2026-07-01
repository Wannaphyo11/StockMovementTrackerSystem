import { Injectable, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private appName = 'Agri Burma';

  constructor(private titleService: Title) {}

  setTitle(titles: string[]) {
    const fullTitle = [...titles, this.appName].join(' | ');
    this.titleService.setTitle(fullTitle);
  }
}
