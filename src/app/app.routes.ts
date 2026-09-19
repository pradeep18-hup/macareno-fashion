import { Routes } from '@angular/router';
import { ContactComponent } from './contact/contact/contact';
import { HeroComponent } from './hero.component/hero.component';
import { DressForm } from './dress/dress-form/dress-form';
import { Login } from './login/login';
import { Register } from './register/register';

export const routes: Routes = [
    {path:'contact', component: ContactComponent},
    {path:'', component: HeroComponent},
    {path:'dress-form',component:DressForm},
    {path:'login',component:Login},
    {path:'register',component:Register}
];