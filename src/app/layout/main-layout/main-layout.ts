import { Component } from '@angular/core';
import { NavbarComponent } from '../../navbar.component/navbar.component';
import { RouterOutlet } from '@angular/router';
import { Fotter } from '../../fotter/fotter';
@Component({
  selector: 'app-main-layout',
  imports: [NavbarComponent,RouterOutlet,Fotter],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {}
