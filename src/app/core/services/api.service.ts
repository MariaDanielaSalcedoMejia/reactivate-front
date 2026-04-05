import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = `${API_CONFIG.baseUrl}/api`;

  constructor(private http: HttpClient) {}

  get<T>(path: string) {
    return this.http.get<T>(`${this.baseUrl}${path}`).pipe(catchError(this.handleError));
  }

  post<T>(path: string, payload: unknown) {
    return this.http.post<T>(`${this.baseUrl}${path}`, payload).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error?.detail || error.error?.message || error.message || 'Error desconocido';
    return throwError(() => message);
  }
}
