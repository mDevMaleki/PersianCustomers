import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CallRecordDto, ClientDto, PaginatedResult } from '../../models/api.models';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: ClientDto[] = [];
  clientsResult: PaginatedResult<ClientDto> | null = null;
  callRecords: CallRecordDto[] = [];
  callRecordsResult: PaginatedResult<CallRecordDto> | null = null;
  selectedClient: ClientDto | null = null;
  selectedPhone = '';
  errorMessage = '';
  callsErrorMessage = '';
  formErrorMessage = '';
  formSuccessMessage = '';
  isLoadingClients = false;
  isLoadingCalls = false;
  isSubmitting = false;
  isEditMode = false;
  startDate = this.formatDate(this.addDays(new Date(), -7));
  endDate = this.formatDate(new Date());
  formData: ClientDto = this.getEmptyForm();
  dentalServiceOptions = [
    { value: 0, label: 'ایمپلنت' },
    { value: 1, label: 'زیبایی' },
    { value: 2, label: 'درمان' },
    { value: 3, label: 'لمینت' },
    { value: 4, label: 'ترمیمی' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(pageNumber = 1) {
    this.isLoadingClients = true;
    this.errorMessage = '';

    this.api.getClients(pageNumber).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.clientsResult = response.data;
          this.clients = response.data.items;
        } else {
          this.errorMessage = response.message || 'دریافت لیست مشتری‌ها ناموفق بود.';
        }
        this.isLoadingClients = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'خطا در ارتباط با سرور.';
        this.isLoadingClients = false;
      }
    });
  }

  selectClient(client: ClientDto, phoneNumber?: string | null) {
    this.selectedClient = client;
    this.selectedPhone = phoneNumber || client.mobileNumber1 || client.phoneNumber || '';
    this.callRecords = [];
    this.callRecordsResult = null;
    this.callsErrorMessage = '';
  }

  startCreateClient() {
    this.isEditMode = false;
    this.formData = this.getEmptyForm();
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
  }

  startEditClient(client: ClientDto) {
    this.isEditMode = true;
    this.formData = { ...client };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
  }

  submitClient() {
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.isSubmitting = true;

    const request = { ...this.formData };

    const action$ = this.isEditMode ? this.api.updateClient(request) : this.api.createClient(request);

    action$.subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.formSuccessMessage = this.isEditMode
            ? 'اطلاعات مشتری با موفقیت ویرایش شد.'
            : 'مشتری با موفقیت ثبت شد.';
          this.isEditMode = false;
          this.formData = this.getEmptyForm();
          this.loadClients();
        } else {
          this.formErrorMessage = response.message || 'ثبت اطلاعات مشتری ناموفق بود.';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.formErrorMessage = err?.error?.message || 'خطا در ارتباط با سرور.';
        this.isSubmitting = false;
      }
    });
  }

  deleteClient(client: ClientDto) {
    if (!client.id) {
      this.formErrorMessage = 'شناسه مشتری برای حذف پیدا نشد.';
      return;
    }

    const confirmed = window.confirm(`آیا از حذف مشتری ${client.firstName || ''} ${client.lastName || ''} اطمینان دارید؟`);
    if (!confirmed) {
      return;
    }

    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.isSubmitting = true;

    this.api.deleteClient(client.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.formSuccessMessage = 'مشتری با موفقیت حذف شد.';
          if (this.selectedClient?.id === client.id) {
            this.selectedClient = null;
            this.selectedPhone = '';
            this.callRecords = [];
            this.callRecordsResult = null;
          }
          this.loadClients();
        } else {
          this.formErrorMessage = response.message || 'حذف مشتری ناموفق بود.';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.formErrorMessage = err?.error?.message || 'خطا در ارتباط با سرور.';
        this.isSubmitting = false;
      }
    });
  }

  loadCallRecords(pageNumber = 1) {
    if (!this.selectedPhone) {
      this.callsErrorMessage = 'شماره تماس برای جستجو انتخاب نشده است.';
      return;
    }

    this.isLoadingCalls = true;
    this.callsErrorMessage = '';

    this.api.getCallRecords(this.startDate, this.endDate, this.selectedPhone, pageNumber).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.callRecordsResult = response.data;
          this.callRecords = response.data.items;
        } else {
          this.callsErrorMessage = response.message || 'دریافت لیست تماس‌ها ناموفق بود.';
        }
        this.isLoadingCalls = false;
      },
      error: (err) => {
        this.callsErrorMessage = err?.error?.message || 'خطا در دریافت تماس‌ها.';
        this.isLoadingCalls = false;
      }
    });
  }

  private addDays(date: Date, amount: number) {
    const updated = new Date(date);
    updated.setDate(updated.getDate() + amount);
    return updated;
  }

  private formatDate(date: Date) {
    return date.toISOString().split('T')[0];
  }

  private getEmptyForm(): ClientDto {
    return {
      title: '',
      dentalService: 0,
      mobileNumber1: ''
    };
  }
}
