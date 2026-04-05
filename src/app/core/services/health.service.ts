import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface HealthProfile {
  user_id: number;
  height_cm: number;
  weight_kg: number;
  resting_hr: number;
  imc: number;
  score: number;
  level: string;
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  constructor(private api: ApiService) {}

  getProfile(userId: number): Observable<HealthProfile> {
    return this.api.get<HealthProfile>(`/health/${userId}`);
  }

  saveProfile(userId: number, heightCm: number, weightKg: number, restingHr: number): Observable<HealthProfile> {
    return this.api.post<HealthProfile>(`/health/${userId}`, {
      height_cm: heightCm,
      weight_kg: weightKg,
      resting_hr: restingHr
    });
  }
}
