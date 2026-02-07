import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { BaseResponse, CallRecordDto, ClientDto, PaginatedResult } from '../../models/api.models';

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
  isFormModalOpen = false;
  modalActiveTab: 'details' | 'calls' = 'details';
  modalCallRecords: CallRecordDto[] = [];
  modalCallRecordsResult: PaginatedResult<CallRecordDto> | null = null;
  modalSelectedPhone = '';
  modalCallsErrorMessage = '';
  modalIsLoadingCalls = false;
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
    this.resetModalCalls();
    this.isFormModalOpen = true;
  }

  startEditClient(client: ClientDto) {
    this.isEditMode = true;
    this.formData = { ...client };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.resetModalCalls();
    this.isFormModalOpen = true;
  }

  closeFormModal() {
    if (this.isSubmitting) {
      return;
    }
    this.isFormModalOpen = false;
    this.formErrorMessage = '';
    this.resetModalCalls();
  }

  submitClient() {
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.isSubmitting = true;

    const request = { ...this.formData };

    if (this.isEditMode) {
      this.api.updateClient(request).subscribe({
        next: (response: BaseResponse<boolean>) => {
        if (response.isSuccess) {
          this.formSuccessMessage = 'اطلاعات مشتری با موفقیت ویرایش شد.';
          this.isEditMode = false;
          this.formData = this.getEmptyForm();
          this.loadClients();
          this.isFormModalOpen = false;
        } else {
          this.formErrorMessage = response.message || 'ثبت اطلاعات مشتری ناموفق بود.';
        }
          this.isSubmitting = false;
        },
        error: (err: unknown) => {
          this.formErrorMessage = (err as { error?: { message?: string } })?.error?.message || 'خطا در ارتباط با سرور.';
          this.isSubmitting = false;
        }
      });
      return;
    }

    this.api.createClient(request).subscribe({
      next: (response: BaseResponse<number>) => {
        if (response.isSuccess) {
          this.formSuccessMessage = 'مشتری با موفقیت ثبت شد.';
          this.formData = this.getEmptyForm();
          this.loadClients();
          this.isFormModalOpen = false;
        } else {
          this.formErrorMessage = response.message || 'ثبت اطلاعات مشتری ناموفق بود.';
        }
        this.isSubmitting = false;
      },
      error: (err: unknown) => {
        this.formErrorMessage = (err as { error?: { message?: string } })?.error?.message || 'خطا در ارتباط با سرور.';
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

  setModalTab(tab: 'details' | 'calls') {
    this.modalActiveTab = tab;
    if (tab === 'calls') {
      this.prepareModalCalls();
    }
  }

  selectModalPhone(phoneNumber?: string | null) {
    if (!phoneNumber) {
      return;
    }
    this.modalSelectedPhone = phoneNumber;
    this.loadModalCallRecords();
  }

  loadModalCallRecords(pageNumber = 1) {
    if (!this.modalSelectedPhone) {
      this.modalCallsErrorMessage = 'شماره موبایل برای نمایش تماس انتخاب نشده است.';
      return;
    }

    this.modalIsLoadingCalls = true;
    this.modalCallsErrorMessage = '';

    this.api.getCallRecords(this.startDate, this.endDate, this.modalSelectedPhone, pageNumber).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.modalCallRecordsResult = response.data;
          this.modalCallRecords = response.data.items;
        } else {
          this.modalCallsErrorMessage = response.message || 'دریافت لیست تماس‌ها ناموفق بود.';
        }
        this.modalIsLoadingCalls = false;
      },
      error: (err) => {
        this.modalCallsErrorMessage = err?.error?.message || 'خطا در دریافت تماس‌ها.';
        this.modalIsLoadingCalls = false;
      }
    });
  }

  getRecordingUrl(recordingFile?: string | null) {
    if (!recordingFile) {
      return '';
    }

    if (recordingFile.startsWith('http')) {
      return recordingFile;
    }

    const normalized = recordingFile.includes('%') ? recordingFile : encodeURIComponent(recordingFile);
    return `http://193.151.152.32:5050/api/Recordings/stream/${normalized}`;
  }

  private addDays(date: Date, amount: number) {
    const updated = new Date(date);
    updated.setDate(updated.getDate() + amount);
    return updated;
  }

  private formatDate(date: Date) {
    return date.toISOString().split('T')[0];
  }

  private resetModalCalls() {
    this.modalActiveTab = 'details';
    this.modalCallRecords = [];
    this.modalCallRecordsResult = null;
    this.modalSelectedPhone = '';
    this.modalCallsErrorMessage = '';
    this.modalIsLoadingCalls = false;
  }

  private prepareModalCalls() {
    const defaultPhone = this.formData.mobileNumber1 || this.formData.mobileNumber2 || '';
    this.modalSelectedPhone = defaultPhone;
    this.modalCallRecords = [];
    this.modalCallRecordsResult = null;
    this.modalCallsErrorMessage = '';
    if (this.modalSelectedPhone) {
      this.loadModalCallRecords();
    }
  }

  private getEmptyForm(): ClientDto {
    return {
      title: '',
      dentalService: 0,
      mobileNumber1: ''
    };
  }
}
