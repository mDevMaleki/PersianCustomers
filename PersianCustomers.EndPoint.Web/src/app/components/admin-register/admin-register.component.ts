import { Component, HostListener } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { RegisterRequest } from '../../models/api.models';
import {
  getJalaliMonthLength,
  normalizeJalaliInput,
  parseJalaliDate,
  toGregorianDate,
  toGregorianDateString,
  toJalaliDateString
} from '../../utils/jalali-date';

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
  activeDatePicker = false;
  datePickerYear = 0;
  datePickerMonth = 0;
  datePickerLeadingDays: number[] = [];
  datePickerDays: number[] = [];

  readonly datePickerMonths = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند'
  ];

  readonly datePickerWeekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  model: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private api: ApiService) {}

  @HostListener('document:click')
  closeDatePicker() {
    this.activeDatePicker = false;
  }

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

  openDatePicker() {
    const parsed = parseJalaliDate(this.birthDateInput);
    const today = parseJalaliDate(toJalaliDateString(new Date()));
    const fallbackYear = today?.jy ?? 1400;
    const fallbackMonth = today?.jm ?? 1;

    this.datePickerYear = parsed?.jy ?? fallbackYear;
    this.datePickerMonth = parsed?.jm ?? fallbackMonth;
    this.activeDatePicker = true;
    this.updateDatePickerGrid();
  }

  changeDatePickerMonth(step: number) {
    let nextMonth = this.datePickerMonth + step;
    let nextYear = this.datePickerYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    this.datePickerMonth = nextMonth;
    this.datePickerYear = nextYear;
    this.updateDatePickerGrid();
  }

  selectDatePickerDay(day: number) {
    this.birthDateInput = normalizeJalaliInput(`${this.datePickerYear}/${this.datePickerMonth}/${day}`);
    this.closeDatePicker();
  }

  isDatePickerSelected(day: number) {
    const parsed = parseJalaliDate(this.birthDateInput);
    return parsed?.jy === this.datePickerYear
      && parsed?.jm === this.datePickerMonth
      && parsed?.jd === day;
  }

  isDatePickerToday(day: number) {
    const today = parseJalaliDate(toJalaliDateString(new Date()));
    return today?.jy === this.datePickerYear
      && today?.jm === this.datePickerMonth
      && today?.jd === day;
  }

  private updateDatePickerGrid() {
    const monthLength = getJalaliMonthLength(this.datePickerYear, this.datePickerMonth);
    const firstDay = toGregorianDate(this.datePickerYear, this.datePickerMonth, 1);
    const startOffset = (firstDay.getDay() + 1) % 7;
    this.datePickerLeadingDays = Array.from({ length: startOffset }, (_, index) => index);
    this.datePickerDays = Array.from({ length: monthLength }, (_, index) => index + 1);
  }
}
