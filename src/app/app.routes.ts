import { Routes } from '@angular/router';
import { ContactComponent } from './contact/contact/contact';
import { HeroComponent } from './hero.component/hero.component';
export const routes: Routes = [
    {path:'contact', component: ContactComponent},
    {path:'', component: HeroComponent}
];
