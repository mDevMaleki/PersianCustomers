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
  modalActiveTab: 'details' | 'calls' | 'tasks' | 'appointments' | 'treatment' = 'details';
  modalCallRecords: CallRecordDto[] = [];
  modalCallRecordsResult: PaginatedResult<CallRecordDto> | null = null;
  modalSelectedPhone = '';
  modalCallsErrorMessage = '';
  modalIsLoadingCalls = false;
  modalTasks: ClientTask[] = [];
  modalAppointments: ClientAppointment[] = [];
  treatmentUpperTeeth: ToothPosition[] = this.createTeethRow('upper', 112);
  treatmentLowerTeeth: ToothPosition[] = this.createTeethRow('lower', 204);
  selectedTeethIds: string[] = [];
  treatmentPlanNote = '';
  treatmentPrepaymentAmount = 0;
  treatmentCheques: TreatmentCheque[] = [];
  newChequeDate = '';
  newChequeAmount = 0;
  newChequeNumber = '';
  newChequeOwner = '';
  treatmentToothServices: Record<string, TreatmentToothService> = {};
  installmentPlanOptions: InstallmentPlanOption[] = [
    { months: 2, label: '۲ ماهه' },
    { months: 6, label: '۶ ماهه' },
    { months: 12, label: '۱۲ ماهه' }
  ];
  selectedInstallmentMonths = 6;
  private treatmentTeeth: ToothPosition[] = [...this.treatmentUpperTeeth, ...this.treatmentLowerTeeth];
  taskForm: TaskFormState = this.getEmptyTaskForm();
  appointmentForm: AppointmentFormState = this.getEmptyAppointmentForm();
  taskErrorMessage = '';
  taskSuccessMessage = '';
  appointmentErrorMessage = '';
  appointmentSuccessMessage = '';
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
  treatmentServiceOptions: TreatmentServiceOption[] = [
    { value: 0, label: 'ایمپلنت', defaultPrice: 12000000 },
    { value: 1, label: 'زیبایی', defaultPrice: 8000000 },
    { value: 2, label: 'درمان', defaultPrice: 5000000 },
    { value: 3, label: 'لمینت', defaultPrice: 9000000 },
    { value: 4, label: 'ترمیمی', defaultPrice: 3000000 }
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
    this.resetModalTasks();
    this.resetModalAppointments();
    this.resetModalTreatment();
    this.isFormModalOpen = true;
  }

  startEditClient(client: ClientDto) {
    this.isEditMode = true;
    this.formData = { ...client };
    this.formErrorMessage = '';
    this.formSuccessMessage = '';
    this.resetModalCalls();
    this.loadTasksForClient(client.id);
    this.loadAppointmentsForClient(client.id);
    this.loadTreatmentPlanForClient(client.id);
    this.isFormModalOpen = true;
  }

  closeFormModal() {
    if (this.isSubmitting) {
      return;
    }
    this.isFormModalOpen = false;
    this.formErrorMessage = '';
    this.resetModalCalls();
    this.resetModalTasks();
    this.resetModalAppointments();
    this.resetModalTreatment();
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

  setModalTab(tab: 'details' | 'calls' | 'tasks' | 'appointments' | 'treatment') {
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

  addTask() {
    this.taskErrorMessage = '';
    this.taskSuccessMessage = '';

    if (!this.formData.id) {
      this.taskErrorMessage = 'برای ثبت پیگیری ابتدا باید مشتری ذخیره شود.';
      return;
    }

    if (!this.taskForm.date || !this.taskForm.time || !this.taskForm.subject) {
      this.taskErrorMessage = 'تاریخ، ساعت و موضوع پیگیری را وارد کنید.';
      return;
    }

    const task: ClientTask = {
      id: this.generateTaskId(),
      date: this.taskForm.date,
      time: this.taskForm.time,
      subject: this.taskForm.subject,
      description: this.taskForm.description,
      isDone: false,
      createdAt: new Date().toISOString()
    };

    this.modalTasks = [task, ...this.modalTasks];
    this.sortModalTasks();
    this.saveTasksToStorage(this.formData.id, this.modalTasks);
    this.taskForm = this.getEmptyTaskForm();
    this.taskSuccessMessage = 'پیگیری با موفقیت ثبت شد.';
  }

  resetTaskForm() {
    this.taskForm = this.getEmptyTaskForm();
    this.taskErrorMessage = '';
    this.taskSuccessMessage = '';
  }

  addAppointment() {
    this.appointmentErrorMessage = '';
    this.appointmentSuccessMessage = '';

    if (!this.formData.id) {
      this.appointmentErrorMessage = 'برای ثبت نوبت ابتدا باید مشتری ذخیره شود.';
      return;
    }

    if (!this.appointmentForm.date || !this.appointmentForm.time || !this.appointmentForm.service) {
      this.appointmentErrorMessage = 'تاریخ، ساعت و نوع نوبت را وارد کنید.';
      return;
    }

    const appointment: ClientAppointment = {
      id: this.generateAppointmentId(),
      date: this.appointmentForm.date,
      time: this.appointmentForm.time,
      service: this.appointmentForm.service,
      notes: this.appointmentForm.notes,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    this.modalAppointments = [appointment, ...this.modalAppointments];
    this.sortModalAppointments();
    this.saveAppointmentsToStorage(this.formData.id, this.modalAppointments);
    this.appointmentForm = this.getEmptyAppointmentForm();
    this.appointmentSuccessMessage = 'نوبت با موفقیت ثبت شد.';
  }

  resetAppointmentForm() {
    this.appointmentForm = this.getEmptyAppointmentForm();
    this.appointmentErrorMessage = '';
    this.appointmentSuccessMessage = '';
  }

  updateAppointmentStatus(appointment: ClientAppointment, status: AppointmentStatus) {
    appointment.status = status;
    if (this.formData.id) {
      this.saveAppointmentsToStorage(this.formData.id, this.modalAppointments);
    }
  }

  deleteAppointment(appointment: ClientAppointment) {
    this.modalAppointments = this.modalAppointments.filter((item) => item.id !== appointment.id);
    if (this.formData.id) {
      this.saveAppointmentsToStorage(this.formData.id, this.modalAppointments);
    }
  }

  canAddAppointment() {
    return !!this.formData.id && !!this.appointmentForm.date && !!this.appointmentForm.time && !!this.appointmentForm.service;
  }

  toggleTaskDone(task: ClientTask) {
    task.isDone = !task.isDone;
    if (this.formData.id) {
      this.saveTasksToStorage(this.formData.id, this.modalTasks);
    }
  }

  deleteTask(task: ClientTask) {
    this.modalTasks = this.modalTasks.filter((item) => item.id !== task.id);
    if (this.formData.id) {
      this.saveTasksToStorage(this.formData.id, this.modalTasks);
    }
  }

  canAddTask() {
    return !!this.formData.id && !!this.taskForm.date && !!this.taskForm.time && !!this.taskForm.subject;
  }

  toggleTooth(tooth: ToothPosition) {
    if (this.selectedTeethIds.includes(tooth.id)) {
      this.selectedTeethIds = this.selectedTeethIds.filter((id) => id !== tooth.id);
      delete this.treatmentToothServices[tooth.id];
    } else {
      this.selectedTeethIds = [...this.selectedTeethIds, tooth.id];
      this.ensureToothService(tooth.id);
    }
    this.persistTreatmentPlan();
  }

  isToothSelected(toothId: string) {
    return this.selectedTeethIds.includes(toothId);
  }

  clearTreatmentSelection() {
    this.selectedTeethIds = [];
    this.treatmentToothServices = {};
    this.persistTreatmentPlan();
  }

  persistTreatmentPlan() {
    if (!this.formData.id) {
      return;
    }
    this.saveTreatmentPlanToStorage(this.formData.id);
  }

  get selectedTreatmentTeeth() {
    return this.treatmentTeeth.filter((tooth) => this.selectedTeethIds.includes(tooth.id));
  }

  get treatmentTotal() {
    return this.selectedTeethIds.reduce((sum, toothId) => {
      const service = this.treatmentToothServices[toothId];
      return sum + (service?.price ?? 0);
    }, 0);
  }

  get installmentMonthlyPayment() {
    if (!this.selectedInstallmentMonths) {
      return 0;
    }
    return Math.round(this.remainingBalance / this.selectedInstallmentMonths);
  }

  get remainingBalance() {
    return Math.max(
      this.treatmentTotal - this.treatmentPrepaymentAmount - this.totalChequeAmount,
      0
    );
  }

  get totalChequeAmount() {
    return this.treatmentCheques.reduce((sum, cheque) => sum + (cheque.amount ?? 0), 0);
  }

  getPersianNumber(value: number) {
    return new Intl.NumberFormat('fa-IR').format(value);
  }

  formatPrice(value: number) {
    return new Intl.NumberFormat('fa-IR').format(value ?? 0);
  }

  getToothService(toothId: string) {
    this.ensureToothService(toothId);
    return this.treatmentToothServices[toothId];
  }

  updateToothService(toothId: string, serviceValue: number) {
    const option = this.treatmentServiceOptions.find((item) => item.value === serviceValue);
    const current = this.treatmentToothServices[toothId];
    this.treatmentToothServices = {
      ...this.treatmentToothServices,
      [toothId]: {
        serviceValue,
        price: option?.defaultPrice ?? current?.price ?? 0
      }
    };
    this.persistTreatmentPlan();
  }

  updateToothPrice(toothId: string, price: number) {
    const numericPrice = Number(price);
    const current = this.treatmentToothServices[toothId] ?? this.createDefaultToothService();
    this.treatmentToothServices = {
      ...this.treatmentToothServices,
      [toothId]: {
        ...current,
        price: Number.isFinite(numericPrice) ? Math.max(0, numericPrice) : 0
      }
    };
    this.persistTreatmentPlan();
  }

  updateInstallmentPlan(months: number) {
    this.selectedInstallmentMonths = Number(months) || 0;
    this.persistTreatmentPlan();
  }

  updatePrepaymentAmount(value: number) {
    const numericValue = Number(value);
    this.treatmentPrepaymentAmount = Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
    this.persistTreatmentPlan();
  }

  updateChequeAmount(value: number) {
    const numericValue = Number(value);
    this.newChequeAmount = Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
  }

  addCheque() {
    const trimmedNumber = this.newChequeNumber.trim();
    const trimmedOwner = this.newChequeOwner.trim();
    if (!this.newChequeDate && !trimmedNumber && !trimmedOwner && !this.newChequeAmount) {
      return;
    }
    this.treatmentCheques = [
      ...this.treatmentCheques,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        date: this.newChequeDate,
        amount: this.newChequeAmount,
        number: trimmedNumber,
        owner: trimmedOwner
      }
    ];
    this.newChequeDate = '';
    this.newChequeAmount = 0;
    this.newChequeNumber = '';
    this.newChequeOwner = '';
    this.persistTreatmentPlan();
  }

  removeCheque(chequeId: string) {
    this.treatmentCheques = this.treatmentCheques.filter((cheque) => cheque.id !== chequeId);
    this.persistTreatmentPlan();
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

  private resetModalTasks() {
    this.modalTasks = [];
    this.taskForm = this.getEmptyTaskForm();
    this.taskErrorMessage = '';
    this.taskSuccessMessage = '';
  }

  private resetModalAppointments() {
    this.modalAppointments = [];
    this.appointmentForm = this.getEmptyAppointmentForm();
    this.appointmentErrorMessage = '';
    this.appointmentSuccessMessage = '';
  }

  private resetModalTreatment() {
    this.selectedTeethIds = [];
    this.treatmentPlanNote = '';
    this.treatmentPrepaymentAmount = 0;
    this.treatmentCheques = [];
    this.newChequeDate = '';
    this.newChequeAmount = 0;
    this.newChequeNumber = '';
    this.newChequeOwner = '';
    this.treatmentToothServices = {};
    this.selectedInstallmentMonths = 6;
  }

  private loadTasksForClient(clientId?: number) {
    if (!clientId) {
      this.resetModalTasks();
      return;
    }

    try {
      const stored = localStorage.getItem(this.getTaskStorageKey(clientId));
      this.modalTasks = stored ? (JSON.parse(stored) as ClientTask[]) : [];
    } catch {
      this.modalTasks = [];
    }
    this.sortModalTasks();
  }

  private saveTasksToStorage(clientId: number, tasks: ClientTask[]) {
    localStorage.setItem(this.getTaskStorageKey(clientId), JSON.stringify(tasks));
  }

  private loadAppointmentsForClient(clientId?: number) {
    if (!clientId) {
      this.resetModalAppointments();
      return;
    }

    try {
      const stored = localStorage.getItem(this.getAppointmentStorageKey(clientId));
      this.modalAppointments = stored ? (JSON.parse(stored) as ClientAppointment[]) : [];
    } catch {
      this.modalAppointments = [];
    }
    this.sortModalAppointments();
  }

  private saveAppointmentsToStorage(clientId: number, appointments: ClientAppointment[]) {
    localStorage.setItem(this.getAppointmentStorageKey(clientId), JSON.stringify(appointments));
  }

  private loadTreatmentPlanForClient(clientId?: number) {
    if (!clientId) {
      this.resetModalTreatment();
      return;
    }

    try {
      const stored = localStorage.getItem(this.getTreatmentStorageKey(clientId));
      if (stored) {
        const parsed = JSON.parse(stored) as TreatmentPlanStorage;
        this.selectedTeethIds = parsed.selectedTeethIds ?? [];
        this.treatmentPlanNote = parsed.note ?? '';
        this.treatmentPrepaymentAmount = parsed.prepaymentAmount ?? 0;
        if (parsed.cheques?.length) {
          this.treatmentCheques = parsed.cheques;
        } else if (parsed.chequeDate || parsed.chequeNumber || parsed.chequeOwner || parsed.chequeAmount) {
          this.treatmentCheques = [
            {
              id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
              date: parsed.chequeDate ?? '',
              amount: parsed.chequeAmount ?? 0,
              number: parsed.chequeNumber ?? '',
              owner: parsed.chequeOwner ?? ''
            }
          ];
        } else {
          this.treatmentCheques = [];
        }
        this.treatmentToothServices = parsed.toothServices ?? {};
        this.selectedInstallmentMonths = parsed.installmentMonths ?? 6;
        this.cleanupTreatmentServices();
        this.ensureSelectedTeethServices();
        return;
      }
    } catch {
      // ignore
    }
    this.resetModalTreatment();
  }

  private saveTreatmentPlanToStorage(clientId: number) {
    const payload: TreatmentPlanStorage = {
      selectedTeethIds: this.selectedTeethIds,
      note: this.treatmentPlanNote,
      prepaymentAmount: this.treatmentPrepaymentAmount,
      cheques: this.treatmentCheques,
      toothServices: this.treatmentToothServices,
      installmentMonths: this.selectedInstallmentMonths
    };
    localStorage.setItem(this.getTreatmentStorageKey(clientId), JSON.stringify(payload));
  }

  private sortModalTasks() {
    this.modalTasks = [...this.modalTasks].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return dateA - dateB;
    });
  }

  private getTaskStorageKey(clientId: number) {
    return `client_tasks_${clientId}`;
  }

  private sortModalAppointments() {
    this.modalAppointments = [...this.modalAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return dateA - dateB;
    });
  }

  private getAppointmentStorageKey(clientId: number) {
    return `client_appointments_${clientId}`;
  }

  private getTreatmentStorageKey(clientId: number) {
    return `client_treatment_${clientId}`;
  }

  private getEmptyTaskForm(): TaskFormState {
    return {
      date: '',
      time: '',
      subject: '',
      description: ''
    };
  }

  private getEmptyAppointmentForm(): AppointmentFormState {
    return {
      date: '',
      time: '',
      service: '',
      notes: ''
    };
  }

  private generateTaskId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  private generateAppointmentId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

  private createTeethRow(arch: ToothArch, y: number): ToothPosition[] {
    const labels = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8];
    const startX = 130;
    const step = 30;
    return labels.map((label, index) => ({
      id: `${arch}-${index + 1}`,
      label,
      x: startX + index * step,
      y,
      arch,
      archLabel: arch === 'upper' ? 'بالا' : 'پایین'
    }));
  }

  private ensureToothService(toothId: string) {
    if (!this.treatmentToothServices[toothId]) {
      this.treatmentToothServices = {
        ...this.treatmentToothServices,
        [toothId]: this.createDefaultToothService()
      };
    }
  }

  private createDefaultToothService(): TreatmentToothService {
    const defaultOption = this.treatmentServiceOptions[0];
    return {
      serviceValue: defaultOption?.value ?? 0,
      price: defaultOption?.defaultPrice ?? 0
    };
  }

  private cleanupTreatmentServices() {
    const allowedIds = new Set(this.selectedTeethIds);
    this.treatmentToothServices = Object.entries(this.treatmentToothServices).reduce<Record<string, TreatmentToothService>>(
      (acc, [toothId, service]) => {
        if (allowedIds.has(toothId)) {
          acc[toothId] = service;
        }
        return acc;
      },
      {}
    );
  }

  private ensureSelectedTeethServices() {
    this.selectedTeethIds.forEach((toothId) => this.ensureToothService(toothId));
  }
}

interface ClientTask {
  id: string;
  date: string;
  time: string;
  subject: string;
  description: string;
  isDone: boolean;
  createdAt: string;
}

interface TaskFormState {
  date: string;
  time: string;
  subject: string;
  description: string;
}

type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'canceled';

interface ClientAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
}

interface AppointmentFormState {
  date: string;
  time: string;
  service: string;
  notes: string;
}

type ToothArch = 'upper' | 'lower';

interface ToothPosition {
  id: string;
  label: number;
  x: number;
  y: number;
  arch: ToothArch;
  archLabel: string;
}

interface TreatmentPlanStorage {
  selectedTeethIds: string[];
  note: string;
  prepaymentAmount: number;
  cheques: TreatmentCheque[];
  chequeDate?: string;
  chequeAmount?: number;
  chequeNumber?: string;
  chequeOwner?: string;
  toothServices: Record<string, TreatmentToothService>;
  installmentMonths: number;
}

interface TreatmentCheque {
  id: string;
  date: string;
  amount: number;
  number: string;
  owner: string;
}

interface TreatmentServiceOption {
  value: number;
  label: string;
  defaultPrice: number;
}

interface TreatmentToothService {
  serviceValue: number;
  price: number;
}

interface InstallmentPlanOption {
  months: number;
  label: string;
}
