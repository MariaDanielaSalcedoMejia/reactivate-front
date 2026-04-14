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

export interface HealthAnalysis {
  id: number;
  user_id: number;
  height_cm: number;
  weight_kg: number;
  resting_hr: number;
  age: number | null;
  imc: number;
  imc_category: string;
  score: number;
  level: string;
  recommendation: string;
  max_hr: number | null;
  heart_reserve: number | null;
  recovery_zone_min: number | null;
  recovery_zone_max: number | null;
  aerobic_zone_min: number | null;
  aerobic_zone_max: number | null;
  performance_zone_min: number | null;
  performance_zone_max: number | null;
  health_summary: string | null;
  warnings: string | null;
  suggestions: string | null;
  created_at: string;
}

export interface HealthHistory {
  id: number;
  created_at: string;
  imc: number;
  imc_category: string;
  score: number;
  level: string;
  health_summary: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  constructor(private api: ApiService) {}

  getProfile(userId: number): Observable<HealthProfile> {
    return this.api.get<HealthProfile>(`/health/${userId}`);
  }

  saveProfile(userId: number, heightCm: number, weightKg: number, restingHr: number, age?: number): Observable<HealthProfile> {
    const payload: any = {
      height_cm: heightCm,
      weight_kg: weightKg,
      resting_hr: restingHr
    };
    if (age !== undefined && age !== null) {
      payload.age = age;
    }
    return this.api.post<HealthProfile>(`/health/${userId}`, payload);
  }

  // Nuevos métodos para historial
  getAnalysisHistory(userId: number): Observable<HealthAnalysis[]> {
    return this.api.get<HealthAnalysis[]>(`/health/${userId}/history`);
  }

  getHistorySummary(userId: number): Observable<HealthHistory[]> {
    return this.api.get<HealthHistory[]>(`/health/${userId}/history-summary`);
  }

  getAnalysisById(analysisId: number): Observable<HealthAnalysis> {
    return this.api.get<HealthAnalysis>(`/health/analysis/${analysisId}`);
  }
}

