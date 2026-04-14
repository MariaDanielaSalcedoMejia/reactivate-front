import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService, HealthProfile, HealthAnalysis } from '../../../core/services/health.service';
import { AuthService, UserResponse } from '../../../core/services/auth.service';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent {
  user: UserResponse | null = null;
  edad: number | null = null;
  peso: number | null = null;
  altura: number | null = null;
  fcReposo: number | null = null;

  imc: number | null = null;
  imcCategoria = '';
  fcMax: number | null = null;
  reserva: number | null = null;

  zonas: any[] = [];

  recomendacion = '';
  score = 0;
  nivel = '';
  error = '';

  // Nuevas propiedades para análisis detallado
  healthSummary = '';
  warnings: string[] = [];
  suggestions: string[] = [];
  lastAnalysis: HealthAnalysis | null = null;

  // Propiedades para historial
  showHistory = false;
  analysisHistory: HealthAnalysis[] = [];

  constructor(
    private healthService: HealthService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    if (this.user) {
      this.loadProfile();
      this.loadHistory();
    }
  }

  loadProfile() {
    if (!this.user) return;
    this.healthService.getProfile(this.user.id).subscribe({
      next: (profile) => this.applyProfile(profile),
      error: () => {
        // Si no hay perfil, lo dejamos vacío para que el usuario lo registre.
      }
    });
  }

  loadHistory() {
    if (!this.user) return;
    this.healthService.getAnalysisHistory(this.user.id).subscribe({
      next: (history) => {
        this.analysisHistory = history;
      },
      error: () => {
        // Sin historial aún
      }
    });
  }

  calcular() {
    this.error = '';

    if (!this.user) {
      this.error = 'Debes iniciar sesión para guardar tu perfil de salud.';
      return;
    }

    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      this.error = 'Completa todos los campos';
      return;
    }

    this.healthService.saveProfile(this.user.id, this.altura, this.peso, this.fcReposo, this.edad).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loadHistory(); // Recargar historial después de guardar
      },
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible guardar el perfil'
    });
  }

  applyProfile(profile: HealthProfile) {
    this.altura = profile.height_cm;
    this.peso = profile.weight_kg;
    this.fcReposo = profile.resting_hr;
    this.imc = profile.imc;
    this.score = profile.score;
    this.nivel = profile.level;
    this.recomendacion = profile.recommendation;
    this.fcMax = this.edad ? 220 - this.edad : null;
    this.reserva = this.fcMax && this.fcReposo ? this.fcMax - this.fcReposo : null;
    this.imcCategoria = this.getImcCategoria(profile.imc);
    this.zonas = this.buildZones(this.fcReposo ?? 0, this.reserva ?? 0);

    // Cargar análisis detallado si existe
    this.loadDetailedAnalysis();
  }

  loadDetailedAnalysis() {
    if (!this.user) return;
    this.healthService.getAnalysisHistory(this.user.id).subscribe({
      next: (history) => {
        if (history.length > 0) {
          this.lastAnalysis = history[0]; // El más reciente
          this.parseAnalysisData();
        }
      },
      error: () => {}
    });
  }

  parseAnalysisData() {
    if (!this.lastAnalysis) return;

    this.healthSummary = this.lastAnalysis.health_summary || this.recomendacion;

    try {
      if (this.lastAnalysis.warnings) {
        this.warnings = typeof this.lastAnalysis.warnings === 'string'
          ? JSON.parse(this.lastAnalysis.warnings)
          : this.lastAnalysis.warnings;
      }
      if (this.lastAnalysis.suggestions) {
        this.suggestions = typeof this.lastAnalysis.suggestions === 'string'
          ? JSON.parse(this.lastAnalysis.suggestions)
          : this.lastAnalysis.suggestions;
      }
    } catch (e) {
      console.error('Error parsing analysis data:', e);
    }
  }

  getImcCategoria(imc: number) {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Óptimo';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  buildZones(fcReposo: number, reserva: number) {
    return [
      { nombre: 'Recuperación', min: fcReposo + reserva * 0.5, max: fcReposo + reserva * 0.6, porcentaje: 50 },
      { nombre: 'Aeróbica', min: fcReposo + reserva * 0.6, max: fcReposo + reserva * 0.7, porcentaje: 65 },
      { nombre: 'Rendimiento', min: fcReposo + reserva * 0.7, max: fcReposo + reserva * 0.85, porcentaje: 80 }
    ].map(z => ({
      ...z,
      min: Math.round(z.min),
      max: Math.round(z.max)
    }));
  }

  get mensajeFcReposo(): string {
    if (!this.fcReposo) return '';
    if (this.fcReposo < 60) return 'Excelente capacidad cardiovascular 🔥';
    if (this.fcReposo <= 80) return 'Nivel saludable 👍';
    return 'Podrías mejorar tu resistencia ⚡';
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }

  getDateFormat(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewAnalysisDetail(analysis: HealthAnalysis) {
    this.lastAnalysis = analysis;
    this.parseAnalysisData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#4CAF50';  // Verde
    if (score >= 70) return '#2196F3';  // Azul
    if (score >= 50) return '#FF9800';  // Naranja
    return '#f44336';                    // Rojo
  }
}

