import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { RegisterRequest } from '../../models/api.models';
import { normalizeJalaliInput, toGregorianDateString } from '../../utils/jalali-date';

@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrls: ['./admin-register.component.css']
})
export class AdminRegisterComponent {
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  birthDateInput = '';
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

    const normalizedBirthDate = this.birthDateInput ? toGregorianDateString(this.birthDateInput) : '';
    const payload: RegisterRequest = {
      ...this.model,
      birthDate: normalizedBirthDate || undefined
    };

    this.api.register(payload).subscribe({
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
          this.birthDateInput = '';
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

  normalizeBirthDateInput() {
    this.birthDateInput = normalizeJalaliInput(this.birthDateInput);
  }
}
