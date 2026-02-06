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
  isLoadingClients = false;
  isLoadingCalls = false;
  startDate = this.formatDate(this.addDays(new Date(), -7));
  endDate = this.formatDate(new Date());

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
}
