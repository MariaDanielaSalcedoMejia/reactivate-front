import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface UserResponse {
  id: number;
  name: string;
  age: number;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userStorageKey = 'userData';
  private readonly emailStorageKey = 'user';

  constructor(private api: ApiService) {}

  login(email: string, password: string): Observable<UserResponse> {
    return this.api.post<UserResponse>('/auth/login', { email, password }).pipe(
      tap((user) => this.saveUser(user))
    );
  }

  register(name: string, age: number, email: string, password: string): Observable<UserResponse> {
    return this.api.post<UserResponse>('/auth/register', { name, age, email, password }).pipe(
      tap((user) => this.saveUser(user))
    );
  }

  me(): Observable<UserResponse> {
    const email = this.getEmail();
    if (!email) {
      throw new Error('Usuario no autenticado');
    }
    return this.api.get<UserResponse>(`/auth/me?email=${encodeURIComponent(email)}`);
  }

  isAuthenticated(): boolean {
    return !!this.getEmail();
  }

  getUser(): UserResponse | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(this.userStorageKey);
    return data ? JSON.parse(data) as UserResponse : null;
  }

  getEmail(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.emailStorageKey);
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.emailStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }

  private saveUser(user: UserResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.emailStorageKey, user.email);
    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
  }
}
