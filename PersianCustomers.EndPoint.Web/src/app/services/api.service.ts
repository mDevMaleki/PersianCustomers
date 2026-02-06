import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AuthResponse,
  BaseResponse,
  CallRecordDto,
  ClientDto,
  LoginRequest,
  PaginatedResult,
  RegisterRequest
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  login(request: LoginRequest) {
    return this.http.post<BaseResponse<AuthResponse>>(`${this.baseUrl}/Auth/login`, request);
  }

  register(request: RegisterRequest) {
    return this.http.post<BaseResponse<AuthResponse>>(`${this.baseUrl}/Auth/register`, request);
  }

  getClients(pageNumber = 1, pageSize = 10) {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<BaseResponse<PaginatedResult<ClientDto>>>(`${this.baseUrl}/Client`, { params });
  }

  getCallRecords(startDate: string, endDate: string, phoneNumber: string, pageNumber = 1, pageSize = 10) {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('phoneNumber', phoneNumber)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<BaseResponse<PaginatedResult<CallRecordDto>>>(`${this.baseUrl}/Voip`, { params });
  }

  createClient(request: ClientDto) {
    return this.http.post<BaseResponse<number>>(`${this.baseUrl}/Client`, request);
  }

  updateClient(request: ClientDto) {
    return this.http.put<BaseResponse<boolean>>(`${this.baseUrl}/Client`, request);
  }

  deleteClient(id: number) {
    return this.http.delete<BaseResponse<boolean>>(`${this.baseUrl}/Client/${id}`);
  }
}
