import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { BaseResponse, CallRecordDto, ClientDto, PaginatedResult } from '../../models/api.models';

type ToothArch = 'upper' | 'lower';

export interface ToothClickPayload {
  id: string;
  label: number;
  arch: ToothArch;
  archLabel: string;
}

interface ToothPosition {
  id: string;
  label: number;
  x: number;
  y: number;
  arch: ToothArch;
  archLabel: string;
}

export interface ToothMeta {
  id: string;          // مثل upper-1
  label: number;       // 1..16
  arch: ToothArch;     // upper/lower
  archLabel: string;   // فک بالا/پایین
}

const TOOTH_PATHS: Record<string, string> = {
  // ---------------- UPPER (1..16) ----------------
  'upper-1': 'M639.143 65.989C639.143 65.989 641.715 84.399 638.375 95.983C637.197 99.1773 635.112 101.958 632.375 103.983C629.894 105.659 627.205 107.004 624.375 107.983C620.743 109.496 619.323 108.345 616.763 102.167C614.772 97.367 613.296 86.918 612.34 76.135C612.714 76.383 639.143 65.989 639.143 65.989Z',
  'upper-2': 'M610.086 77.255C610.086 77.255 592.752 81.791 585.828 83.978C585.55 83.902 589.548 106.697 594.349 115.978C595.036 117.449 596.2 118.645 597.653 119.371C599.105 120.097 600.76 120.311 602.349 119.978C604.495 119.3 606.519 118.288 608.349 116.978C609.909 115.624 613.296 112.305 613.349 107.978C613.507 96.76 610.3 78.658 610.086 77.255Z',
  'upper-3': 'M583.6 85.1C583.6 85.1 588.042 103.667 589.4 116.408C590.164 123.567 587.729 128.994 583.342 131.98C580.829 133.35 578.136 134.359 575.342 134.98C570.422 135.751 566.842 132.605 565.336 126.98C562.555 116.618 560.213 98.5 559.456 91.79C559.779 91.714 583.6 85.1 583.6 85.1Z',
  'upper-4': 'M557.233 92.9C557.233 92.9 559.689 111.173 561.533 125.936C562.621 134.657 560.053 142.154 554.333 143.974C550.242 145.274 542.028 149.589 539.324 148.974C534.841 147.953 532.796 144.638 532.154 138.72C531.268 130.544 530.426 114.92 530.082 97.344C530.256 97.858 557.233 92.9 557.233 92.9Z',
  'upper-5': 'M526.844 97.342C526.844 97.342 529.244 131.742 527.309 145.973C525.499 159.26 505.441 161.233 500.292 161.973C495.143 162.713 491.625 159.917 491.748 149.497C491.872 139.009 492.275 100.668 492.275 100.668C503.85 100.193 515.391 99.0822 526.844 97.342V97.342Z',
  'upper-6': 'M489.728 101.772C489.728 101.772 489.728 138.498 487.068 157.741C485.99 165.532 481.968 170.714 477.278 171.968C472.675 173.255 467.996 174.257 463.27 174.968C457.563 175.786 450.277 169.959 450.261 158.384C450.245 146.724 449.173 104.373 449.173 104.373C449.173 104.373 472.1 104.723 489.728 101.772Z',
  'upper-7': 'M445.125 103.875C445.125 103.875 448.468 152.032 446.566 164.964C444.679 177.791 439.326 183.698 428.86 184.364C418.785 185.166 408.663 185.166 398.588 184.364C388.049 183.423 380.87 177.788 381.298 166.738C381.728 155.611 378.791 122.372 386.084 106.638C386.236 106.514 427.233 106.68 445.125 103.875Z',
  'upper-8': 'M313.915 103.875C313.915 103.875 310.574 152.032 312.475 164.964C314.361 177.791 319.711 183.698 330.17 184.364C340.239 185.166 350.355 185.166 360.424 184.364C370.956 183.423 378.131 177.788 377.704 166.738C377.274 155.611 380.21 122.372 372.921 106.638C372.77 106.514 331.8 106.68 313.915 103.875Z',
  'upper-9': 'M269.339 101.772C269.339 101.772 269.339 138.498 271.997 157.741C273.075 165.532 277.092 170.714 281.781 171.968C286.382 173.255 291.057 174.256 295.781 174.968C301.481 175.786 308.766 169.959 308.781 158.384C308.797 146.724 309.868 104.373 309.868 104.373C309.868 104.373 286.957 104.723 269.339 101.772Z',
  'upper-10': 'M232.245 97.342C232.245 97.342 229.845 131.742 231.781 145.973C233.589 159.26 253.635 161.233 258.781 161.973C263.927 162.713 267.443 159.917 267.32 149.497C267.196 139.009 266.793 100.668 266.793 100.668C255.225 100.192 243.691 99.0821 232.245 97.342V97.342Z',
  'upper-11': 'M201.874 92.9C201.874 92.9 199.42 111.173 197.581 125.936C196.494 134.657 199.06 142.154 204.781 143.974C208.869 145.274 217.081 149.589 219.781 148.974C224.261 147.953 226.305 144.638 226.946 138.72C227.832 130.544 228.673 114.92 229.017 97.344C228.835 97.858 201.874 92.9 201.874 92.9Z',
  'upper-12': 'M175.527 85.1C175.527 85.1 171.088 103.667 169.727 116.408C168.963 123.567 171.397 128.994 175.781 131.98C178.294 133.35 180.987 134.36 183.781 134.98C188.699 135.751 192.273 132.605 193.781 126.98C196.56 116.618 198.901 98.5 199.658 91.79C199.33 91.714 175.527 85.1 175.527 85.1Z',
  'upper-13': 'M149.054 78.255C149.054 78.255 166.377 82.792 173.297 84.978C173.575 84.902 169.579 106.697 164.781 115.978C164.095 117.45 162.931 118.646 161.478 119.372C160.026 120.099 158.37 120.312 156.781 119.978C154.635 119.3 152.61 118.288 150.781 116.978C149.222 115.624 145.838 112.305 145.781 107.978C145.634 96.76 148.835 79.658 149.054 78.255Z',
  'upper-14': 'M120.014 65.989C120.014 65.989 117.443 84.399 120.781 95.983C121.959 99.1773 124.044 101.958 126.781 103.983C129.262 105.66 131.951 107.005 134.781 107.983C138.411 109.496 139.83 108.345 142.389 102.167C144.378 97.367 145.853 86.918 146.808 76.135C146.427 76.383 120.014 65.989 120.014 65.989Z',



  // ---------------- LOWER (1..16) ----------------
  'lower-1': 'M619.452 194.354C614.164 198.954 601.201 217.084 592.215 218.314C592.202 218.669 590.231 182.488 590.791 175.67C591.158 170.58 594.94 164.331 599.644 161.478C604.38 158.642 613.235 158.13 614.361 172.968C615.487 187.806 618.776 192.454 619.452 194.354Z',
  'lower-2': 'M580.685 171.436C585.105 170.193 588.649 175.51 588.893 182.988C589.041 190.451 589.972 221.358 589.952 221.311C580.338 222.8 570.809 224.243 561.365 225.639C561.25 225.671 559.25 191.156 560.391 185.777C560.95 181.311 565.251 176.544 570.411 174.995C575.587 173.455 577.186 172.335 580.685 171.436Z',
  'lower-3': 'M531.93 235.631C531.915 235.641 529.698 200.959 530.691 195.779C531.182 191.373 535.446 186.99 540.683 185.979C545.92 184.968 546.589 184.127 550.164 183.655C554.714 183.014 558.052 188.006 558.124 194.82C557.975 201.311 559.13 231.353 559.134 231.485C550.031 232.88 540.964 234.263 531.934 235.634L531.93 235.631Z',
  'lower-4': 'M498.45 243.569C498.541 243.636 496.633 208.415 497.376 203.026C497.804 198.508 501.932 194.109 507.126 193.297C512.32 192.485 516.897 191.697 520.46 191.377C525.001 190.977 528.373 196.05 528.488 202.789C528.44 209.163 529.635 239.325 529.571 239.472C519.191 240.844 508.817 242.211 498.45 243.572V243.569Z',
  'lower-5': 'M463.05 249.912C463.186 249.697 462.393 213.335 462.943 209.089C463.222 206.682 464.284 204.432 465.965 202.687C467.647 200.942 469.855 199.797 472.25 199.428C477.403 198.647 483.013 197.298 487.141 198.255C491.549 199.267 495.195 206.546 495.398 213.527C495.574 220.303 496.369 244.649 496.286 244.717C485.229 246.445 474.15 248.177 463.05 249.912V249.912Z',
  'lower-6': 'M425.446 257.243C425.558 256.943 425.332 216.334 425.867 211.996C426.442 207.233 430.954 204.931 435.55 203.418C440.942 201.866 446.642 201.729 452.103 203.018C457.517 204.597 460.13 209.769 460.223 216.867C460.347 223.783 460.011 251.857 459.918 251.944C448.451 253.682 436.961 255.449 425.446 257.244V257.243Z',
  'lower-7': 'M381.22 261.95C381.281 261.35 381.02 218.311 381.651 213.955C382.357 208.875 386.506 205.443 392.29 205.701C399.026 206.008 407.253 206.375 412.106 206.555C420.106 206.855 423.071 213.355 423.03 220.963C423.041 228.318 422.288 258.284 422.207 258.446C408.555 259.562 394.893 260.73 381.22 261.95Z',
  'lower-8': 'M378.218 261.95C378.158 261.35 378.418 218.35 377.788 213.999C377.082 208.924 372.936 205.499 367.153 205.753C360.42 206.059 352.196 206.426 347.345 206.606C339.345 206.906 336.385 213.397 336.426 221C336.415 228.349 337.167 258.287 337.248 258.45C350.895 259.564 364.551 260.731 378.218 261.95Z',
  'lower-9': 'M334.01 257.249C333.898 256.949 334.124 216.376 333.59 212.042C333.015 207.283 328.504 204.983 323.91 203.471C318.52 201.921 312.822 201.783 307.364 203.071C301.952 204.649 299.34 209.816 299.247 216.907C299.123 223.817 299.459 251.867 299.547 251.954C311.007 253.691 322.493 255.454 334.006 257.245L334.01 257.249Z',
  'lower-10': 'M296.422 249.923C296.285 249.708 297.078 213.38 296.528 209.137C296.248 206.732 295.187 204.485 293.507 202.742C291.827 200.998 289.621 199.855 287.228 199.486C282.076 198.705 276.469 197.357 272.343 198.313C267.936 199.325 264.292 206.597 264.088 213.571C263.913 220.341 263.118 244.665 263.201 244.733C274.254 246.459 285.328 248.189 296.425 249.923H296.422Z',
  'lower-11': 'M261.035 243.586C260.944 243.653 262.851 208.464 262.109 203.08C261.681 198.567 257.554 194.171 252.362 193.36C247.17 192.549 242.595 191.76 239.034 191.442C234.494 191.042 231.123 196.111 231.009 202.842C231.057 209.209 229.863 239.342 229.926 239.49C240.302 240.861 250.672 242.226 261.035 243.584V243.586Z',
  'lower-12': 'M227.568 235.655C227.583 235.665 229.799 201.015 228.807 195.84C228.315 191.44 224.053 187.059 218.818 186.04C213.583 185.021 212.918 184.19 209.341 183.719C204.794 183.079 201.456 188.066 201.384 194.874C201.533 201.359 200.384 231.374 200.374 231.505C209.475 232.898 218.539 234.279 227.568 235.65V235.655Z',
  'lower-13': 'M198.144 225.673C198.26 225.704 200.259 191.221 199.118 185.847C198.559 181.385 194.26 176.622 189.102 175.075C183.928 173.536 182.33 172.417 178.832 171.52C174.414 170.277 170.871 175.59 170.632 183.061C170.484 190.516 169.553 221.395 169.573 221.349C179.183 222.836 188.708 224.278 198.148 225.673H198.144Z',
  'lower-14': 'M140.081 194.4C144.841 198.979 158.325 217.128 167.307 218.357C167.32 218.712 169.29 182.564 168.731 175.757C168.363 170.67 164.583 164.428 159.88 161.577C155.147 158.744 146.295 158.232 145.17 173.056C144.045 187.88 140.986 193.044 140.081 194.4Z',

 
};

export const TOOTH_META: ToothMeta[] = [
  // ✅ فک بالا (۱ تا ۱۶)
  { id: 'upper-1', label: 1, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-2', label: 2, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-3', label: 3, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-4', label: 4, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-5', label: 5, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-6', label: 6, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-7', label: 7, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-8', label: 8, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-9', label: 9, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-10', label: 10, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-11', label: 11, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-12', label: 12, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-13', label: 13, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-14', label: 14, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-15', label: 15, arch: 'upper', archLabel: 'فک بالا' },
  { id: 'upper-16', label: 16, arch: 'upper', archLabel: 'فک بالا' },

  // ✅ فک پایین (۱ تا ۱۶)
  { id: 'lower-1', label: 1, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-2', label: 2, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-3', label: 3, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-4', label: 4, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-5', label: 5, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-6', label: 6, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-7', label: 7, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-8', label: 8, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-9', label: 9, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-10', label: 10, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-11', label: 11, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-12', label: 12, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-13', label: 13, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-14', label: 14, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-15', label: 15, arch: 'lower', archLabel: 'فک پایین' },
  { id: 'lower-16', label: 16, arch: 'lower', archLabel: 'فک پایین' },
];




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

  // Teeth
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
  toothPaths = TOOTH_PATHS;

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

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.loadClients();
  }


  TOOTH_META = TOOTH_META;
  TOOTH_PATHS = TOOTH_PATHS;

  // فقط اونایی که واقعاً path دارند (تا اگر هنوز کامل نکردی خطا نده)
  get teethToRender(): ToothMeta[] {
    return this.TOOTH_META.filter(t => !!this.TOOTH_PATHS[t.id]);
  }

  trackByToothId(_: number, item: ToothMeta) {
    return item.id;
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

  /**
   * ✅ FIX اصلی:
   * در template شما به toggleTooth یک آبجکت بدون x/y می‌فرستید.
   * پس اینجا باید ToothClickPayload (یا Union) بگیریم، نه ToothPosition.
   */
  toggleTooth(tooth: ToothClickPayload | ToothPosition) {
    const toothId = tooth.id;

    if (this.selectedTeethIds.includes(toothId)) {
      this.selectedTeethIds = this.selectedTeethIds.filter((id) => id !== toothId);
      delete this.treatmentToothServices[toothId];
    } else {
      this.selectedTeethIds = [...this.selectedTeethIds, toothId];
      this.ensureToothService(toothId);
    }

    this.persistTreatmentPlan();
  }

  isToothSelected(toothId: string) {
    return this.selectedTeethIds.includes(toothId);
  }

  getToothPath(toothId: string) {
    return this.toothPaths[toothId];
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
    return Math.max(this.treatmentTotal - this.treatmentPrepaymentAmount - this.totalChequeAmount, 0);
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
