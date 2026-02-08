import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { BaseResponse, CampaignDto, PaginatedResult } from '../../models/api.models';

interface SelectOption {
  value: string;
  label: string;
}

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
}
