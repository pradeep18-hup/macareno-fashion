import { Routes } from '@angular/router';
import { ContactComponent } from './contact/contact/contact';
import { HeroComponent } from './hero.component/hero.component';
import { DressForm } from './dress/dress-form/dress-form';
import { DressTypeService } from './dress/dress-type/dress-type';
import { Login } from './login/login';
import { Register } from './register/register';
import { MainLayout } from './layout/main-layout/main-layout';
import { Admin } from './admin/admin';
import { Customers } from './customer/customer';
import { Orders } from './orders/orders/orders';
import { AdminLayout } from './layout/admin-layout/admin-layout';
export const routes: Routes = [
  // No header/footer
  { path: 'login', component: Login },
  { path: 'register', component: Register },


  // Header/footer shown for all children
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: HeroComponent },
      { path: 'contact', component: ContactComponent },
      

    ]
  },
 {
  path: '',             
  component: AdminLayout,
  children: [
    { path: 'dress-form', component: DressForm },
    { path: 'dress-types', component: DressTypeService },
    { path: 'admin', component: Admin },
    { path: 'customer-list', component: Customers },
    { path: 'orders', component: Orders }
  ]
},

  { path: '**', redirectTo: '' }
];