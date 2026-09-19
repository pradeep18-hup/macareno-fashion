import { Routes } from '@angular/router';
import { ContactComponent } from './contact/contact/contact';
import { HeroComponent } from './hero.component/hero.component';
import { DressForm } from './dress/dress-form/dress-form';
export const routes: Routes = [
    {path:'contact', component: ContactComponent},
    {path:'', component: HeroComponent},
    {path:'dress-form',component:DressForm}
];
