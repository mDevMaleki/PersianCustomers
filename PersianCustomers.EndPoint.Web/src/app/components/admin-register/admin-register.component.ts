import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { RegisterRequest } from '../../models/api.models';

@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrls: ['./admin-register.component.css']
})
export class AdminRegisterComponent {
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  model: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private api: ApiService) {}

  submit() {
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoading = true;

    this.api.register(this.model).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.successMessage = 'کاربر با موفقیت ایجاد شد.';
          this.model = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
          };
        } else {
          this.errorMessage = response.message || 'ثبت کاربر ناموفق بود.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'امکان ثبت کاربر وجود ندارد.';
        this.isLoading = false;
      }
    });
  }
}
