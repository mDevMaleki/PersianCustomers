import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminRegisterComponent } from './components/admin-register/admin-register.component';
import { ClientsComponent } from './components/clients/clients.component';
import { CampaignsComponent } from './components/campaigns/campaigns.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin/register', component: AdminRegisterComponent },
  { path: 'clients', component: ClientsComponent },
  { path: 'campaigns', component: CampaignsComponent },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
