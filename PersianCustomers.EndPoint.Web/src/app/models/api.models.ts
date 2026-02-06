export interface BaseResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expirationDate: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ClientDto {
  id?: number;
  firstName?: string;
  lastName?: string;
  title: string;
  birthDay?: string;
  dentalService: number;
  description?: string;
  email?: string;
  phoneNumber?: string;
  mobileNumber1: string;
  mobileNumber2?: string;
  address?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface CallRecordDto {
  clid: string;
  src: string;
  dst: string;
  dcontext: string;
  channel: string;
  dstChannel: string;
  lastApp: string;
  lastData: string;
  callDate: string;
  duration: number;
  billSec: number;
  disposition: string;
  amaFlags: number;
  accountCode: string;
  uniqueId: string;
  userField: string;
  did: string;
  recordingFile: string;
  cnum: string;
  cnam: string;
  outboundCnum: string;
  outboundCnam: string;
  dstCnam: string;
  linkedId: string;
  peerAccount: string;
  sequence: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  nationalCode?: string;
  birthDate?: string;
  address?: string;
}
