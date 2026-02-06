import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/api.models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isLoading = false;
  errorMessage = '';
  model: LoginRequest = {
    email: '',
    password: ''
  };

  constructor(private api: ApiService, private authService: AuthService, private router: Router) {}

  submit() {
    this.errorMessage = '';
    this.isLoading = true;

    this.api.login(this.model).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.authService.storeAuth(response.data);
          this.router.navigate(['/clients']);
        } else {
          this.errorMessage = response.message || 'Login failed.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unable to login. Please check your credentials.';
        this.isLoading = false;
      }
    });
  }
}
