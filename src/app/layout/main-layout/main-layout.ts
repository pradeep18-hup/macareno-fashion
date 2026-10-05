import { Component } from '@angular/core';
import { NavbarComponent } from '../../navbar.component/navbar.component';
import { RouterOutlet } from '@angular/router';
import { Fotter } from '../../fotter/fotter';
import { inject } from '@angular/core';
import { ListScrollService } from '../../services/list-scroll.service';
@Component({
  selector: 'app-main-layout',
  imports: [NavbarComponent,RouterOutlet,Fotter],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private listScroll = inject(ListScrollService);
}
