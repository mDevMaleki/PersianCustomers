import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthResponse, UserInfo } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'persianCustomers.accessToken';
  private readonly refreshTokenKey = 'persianCustomers.refreshToken';
  private readonly userKey = 'persianCustomers.user';
  private readonly userSubject = new BehaviorSubject<UserInfo | null>(this.getStoredUser());

  readonly user$ = this.userSubject.asObservable();

  storeAuth(response: AuthResponse) {
    localStorage.setItem(this.tokenKey, response.accessToken);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.userSubject.next(response.user);
  }

  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUser(): UserInfo | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UserInfo;
    } catch {
      return null;
    }
  }
}
