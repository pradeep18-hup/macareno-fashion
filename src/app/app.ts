import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar.component/navbar.component';
import { HeroComponent } from './hero.component/hero.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, HeroComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('macarena-korean-fashion');
}