import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { BaseResponse, CampaignDto, PaginatedResult } from '../../models/api.models';
import {
  getJalaliMonthLength,
  normalizeJalaliInput,
  parseJalaliDate,
  toGregorianDate,
  toJalaliDateString
} from '../../utils/jalali-date';

interface SelectOption {
  value: string;
  label: string;
}

type DatePickerTarget = 'startDate' | 'endDate';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.css']
})
export class CampaignsComponent implements OnInit {
  campaigns: CampaignDto[] = [];
  campaignsResult: PaginatedResult<CampaignDto> | null = null;

  isLoading = false;
  isSubmitting = false;
  isFormModalOpen = false;
  isEditMode = false;

  errorMessage = '';
  formErrorMessage = '';
  formSuccessMessage = '';

  currentPage = 1;
  pageSize = 10;

  formData: CampaignDto = this.getEmptyForm();
  activeDatePicker: DatePickerTarget | null = null;
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
  readonly datePickerYears = Array.from({ length: 201 }, (_, index) => 1300 + index);

  readonly datePickerWeekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  campaignTypeOptions: SelectOption[] = [
    { value: 'digital', label: 'دیجیتال' },
    { value: 'outdoor', label: 'محیطی' },
    { value: 'sms', label: 'پیامک' },
    { value: 'email', label: 'ایمیل' },
    { value: 'social', label: 'شبکه‌های اجتماعی' },
    { value: 'search', label: 'جستجو' }
  ];

  statusOptions: SelectOption[] = [
    { value: 'planned', label: 'برنامه‌ریزی شده' },
    { value: 'active', label: 'فعال' },
    { value: 'paused', label: 'متوقف' },
    { value: 'completed', label: 'پایان یافته' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCampaigns();
  }

  @HostListener('document:click')
  closeDatePicker() {
    this.activeDatePicker = null;
  }

  loadCampaigns(pageNumber = this.currentPage) {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getCampaigns(pageNumber, this.pageSize).subscribe({
      next: (response: BaseResponse<PaginatedResult<CampaignDto>>) => {
        if (response.isSuccess && response.data) {
          this.campaignsResult = response.data;
          this.campaigns = response.data.items;
          this.currentPage = response.data.pageNumber;
        } else {
          this.campaigns = [];
          this.campaignsResult = null;
          this.errorMessage = response.message || 'دریافت کمپین‌ها ناموفق بود.';
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'خطا در دریافت کمپین‌ها.';
      }
    });
  }

  startCreateCampaign() {
    this.formSuccessMessage = '';
    this.formErrorMessage = '';
    this.isEditMode = false;
    this.formData = this.getEmptyForm();
    this.isFormModalOpen = true;
  }

  startEditCampaign(campaign: CampaignDto) {
    this.formSuccessMessage = '';
    this.formErrorMessage = '';
    this.isEditMode = true;
    this.formData = { ...campaign };
    this.isFormModalOpen = true;
  }

  closeFormModal() {
    if (this.isSubmitting) {
      return;
    }
    this.isFormModalOpen = false;
  }

  submitCampaign() {
    this.formErrorMessage = '';
    this.formSuccessMessage = '';

    if (!this.formData.name || !this.formData.type || !this.formData.placement || !this.formData.url) {
      this.formErrorMessage = 'نام کمپین، نوع، محل تبلیغ و آدرس URL الزامی است.';
      return;
    }

    this.isSubmitting = true;

    const request = { ...this.formData };

    if (this.isEditMode) {
      this.apiService.updateCampaign(request).subscribe({
        next: (response: BaseResponse<boolean>) => {
          if (response.isSuccess) {
            this.formSuccessMessage = 'کمپین با موفقیت به‌روزرسانی شد.';
            this.isFormModalOpen = false;
            this.loadCampaigns();
          } else {
            this.formErrorMessage = response.message || 'ثبت اطلاعات کمپین ناموفق بود.';
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.isSubmitting = false;
          this.formErrorMessage = 'خطا در ذخیره‌سازی کمپین.';
        }
      });
      return;
    }

    this.apiService.createCampaign(request).subscribe({
      next: (response: BaseResponse<number>) => {
        if (response.isSuccess) {
          this.formSuccessMessage = 'کمپین جدید با موفقیت ثبت شد.';
          this.isFormModalOpen = false;
          this.loadCampaigns();
        } else {
          this.formErrorMessage = response.message || 'ثبت اطلاعات کمپین ناموفق بود.';
        }
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
        this.formErrorMessage = 'خطا در ذخیره‌سازی کمپین.';
      }
    });
  }

  deleteCampaign(campaign: CampaignDto) {
    if (!campaign.id) {
      return;
    }

    const confirmed = window.confirm(`آیا از حذف کمپین «${campaign.name}» مطمئن هستید؟`);
    if (!confirmed) {
      return;
    }

    this.isSubmitting = true;
    this.formErrorMessage = '';
    this.formSuccessMessage = '';

    this.apiService.deleteCampaign(campaign.id).subscribe({
      next: (response: BaseResponse<boolean>) => {
        if (response.isSuccess) {
          this.formSuccessMessage = 'کمپین با موفقیت حذف شد.';
          this.loadCampaigns();
        } else {
          this.formErrorMessage = response.message || 'حذف کمپین ناموفق بود.';
        }
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
        this.formErrorMessage = 'خطا در حذف کمپین.';
      }
    });
  }

  getTypeLabel(value?: string) {
    return this.campaignTypeOptions.find((item) => item.value === value)?.label || value || '---';
  }

  getStatusLabel(value?: string) {
    return this.statusOptions.find((item) => item.value === value)?.label || value || '---';
  }

  getEmptyForm(): CampaignDto {
    return {
      name: '',
      type: '',
      placement: '',
      url: '',
      startDate: '',
      endDate: '',
      budget: undefined,
      status: 'planned',
      description: ''
    };
  }

  normalizeDateInput(value?: string | null) {
    return normalizeJalaliInput(value);
  }

  private resolveDatePickerSeed(value?: string | null) {
    const normalized = normalizeJalaliInput(value);
    const parsed = parseJalaliDate(normalized);
    if (parsed) {
      return parsed;
    }
    if (!value) {
      return null;
    }
    const converted = toJalaliDateString(value);
    return parseJalaliDate(converted);
  }

  openDatePicker(target: DatePickerTarget, currentValue?: string | null) {
    const parsed = this.resolveDatePickerSeed(currentValue ?? '');
    const today = parseJalaliDate(toJalaliDateString(new Date()));
    const fallbackYear = today?.jy ?? 1400;
    const fallbackMonth = today?.jm ?? 1;

    this.datePickerYear = parsed?.jy ?? fallbackYear;
    this.datePickerMonth = parsed?.jm ?? fallbackMonth;
    this.activeDatePicker = target;
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

  onDatePickerMonthChange(value: string | number) {
    this.datePickerMonth = Number(value);
    this.updateDatePickerGrid();
  }

  onDatePickerYearChange(value: string | number) {
    this.datePickerYear = Number(value);
    this.updateDatePickerGrid();
  }

  selectDatePickerDay(day: number) {
    if (!this.activeDatePicker) {
      return;
    }
    const normalized = this.normalizeDateInput(`${this.datePickerYear}/${this.datePickerMonth}/${day}`);
    if (this.activeDatePicker === 'startDate') {
      this.formData.startDate = normalized;
    }
    if (this.activeDatePicker === 'endDate') {
      this.formData.endDate = normalized;
    }
    this.closeDatePicker();
  }

  isDatePickerSelected(day: number) {
    const value = this.getDatePickerValue();
    const parsed = parseJalaliDate(value);
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

  private getDatePickerValue() {
    if (this.activeDatePicker === 'startDate') {
      return this.formData.startDate;
    }
    if (this.activeDatePicker === 'endDate') {
      return this.formData.endDate;
    }
    return '';
  }

  private updateDatePickerGrid() {
    const monthLength = getJalaliMonthLength(this.datePickerYear, this.datePickerMonth);
    const firstDay = toGregorianDate(this.datePickerYear, this.datePickerMonth, 1);
    const startOffset = (firstDay.getDay() + 1) % 7;
    this.datePickerLeadingDays = Array.from({ length: startOffset }, (_, index) => index);
    this.datePickerDays = Array.from({ length: monthLength }, (_, index) => index + 1);
  }
}
