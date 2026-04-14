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

    // Generar análisis detallado
    this.generateHealthAnalysis();

    // Cargar análisis históricos después de un pequeño delay
    setTimeout(() => this.loadDetailedAnalysis(), 500);
  }

  generateHealthAnalysis() {
    // Generar resumen automático si no existe análisis histórico
    const lines: string[] = [];

    // Análisis IMC
    if (this.imc) {
      const imcStatus = this.imcCategoria;
      lines.push(`📊 IMC: Tu índice de masa corporal es ${this.imc.toFixed(1)} (${imcStatus}).`);
    }

    // Análisis FC
    if (this.fcReposo) {
      if (this.fcReposo < 60) {
        lines.push('❤️ Frecuencia Cardíaca: Excelente capacidad cardiovascular. Tu FC en reposo está en nivel atlético.');
      } else if (this.fcReposo <= 80) {
        lines.push('❤️ Frecuencia Cardíaca: Nivel saludable. Mantén el entrenamiento cardiovascular regular.');
      } else {
        lines.push('❤️ Frecuencia Cardíaca: Podrías mejorar tu resistencia cardiovascular con ejercicio regular.');
      }
    }

    // Análisis general
    if (this.score) {
      if (this.score >= 85) {
        lines.push('🔥 Estado General: Atleta en excelente condición. Mantén tu rutina de entrenamiento.');
      } else if (this.score >= 70) {
        lines.push('💪 Estado General: Buen nivel de fitness. Continúa con tus ejercicios actuales.');
      } else if (this.score >= 50) {
        lines.push('⚡ Estado General: Necesitas incrementar tu actividad física para mejorar tu fitness.');
      } else {
        lines.push('⚠️ Estado General: Te recomendamos iniciar un programa de ejercicio gradual.');
      }
    }

    this.healthSummary = lines.join('\n');

    // Generar alertas
    this.generateWarnings();

    // Generar sugerencias
    this.generateSuggestions();
  }

  generateWarnings() {
    this.warnings = [];

    if (this.imc && this.imc > 30) {
      this.warnings.push('Obesidad detectada. Consulta con un profesional de salud.');
    } else if (this.imc && this.imc > 25) {
      this.warnings.push('Sobrepeso. Considera incrementar actividad física.');
    }

    if (this.fcReposo && this.fcReposo > 100) {
      this.warnings.push('FC en reposo elevada. Podría indicar estrés o falta de actividad cardiovascular.');
    }

    if (this.score && this.score < 50) {
      this.warnings.push('Tu nivel de fitness es bajo. Empieza con ejercicios suaves.');
    }
  }

  generateSuggestions() {
    this.suggestions = [];

    // Sugerencias según IMC
    if (this.imc && this.imc < 25) {
      this.suggestions.push('🎯 Mantén tu peso actual. Continúa con una alimentación balanceada.');
    } else if (this.imc && this.imc < 30) {
      this.suggestions.push('🎯 Aumenta tu actividad física a 30 min diarios de cardio moderado.');
    } else {
      this.suggestions.push('🎯 Combina ejercicio cardiovascular con entrenamiento de fuerza 5 veces/semana.');
    }

    // Sugerencias según FC
    if (this.fcReposo && this.fcReposo < 60) {
      this.suggestions.push('💚 Tu corazón está muy fuerte. Varía tus entrenamientos entre cardio y fuerza.');
    } else if (this.fcReposo && this.fcReposo > 80) {
      this.suggestions.push('💚 Incluye al menos 3 sesiones semanales de cardio (caminar, correr, natación).');
    }

    // Sugerencias según score
    if (this.score && this.score >= 85) {
      this.suggestions.push('🏆 Excelente fitness. Considera objetivos más avanzados: maratones, competencias.');
    } else if (this.score && this.score >= 70) {
      this.suggestions.push('🏆 Buen progreso. Prueba nuevos deportes o incrementa intensidad.');
    } else if (this.score && this.score < 50) {
      this.suggestions.push('🏆 Empieza con caminatas de 20-30 min, 3 veces por semana.');
    }

    // Sugerencia general
    this.suggestions.push('📅 Realiza análisis de salud cada mes para seguir tu progreso.');
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
      error: () => {
        // Si no hay historial, continuamos con el análisis generado
      }
    });
  }

  parseAnalysisData() {
    if (!this.lastAnalysis) return;

    // Solo sobrescribir si existe análisis detallado del backend
    if (this.lastAnalysis.health_summary) {
      this.healthSummary = this.lastAnalysis.health_summary;
    }

    try {
      if (this.lastAnalysis.warnings) {
        const warnings = typeof this.lastAnalysis.warnings === 'string'
          ? JSON.parse(this.lastAnalysis.warnings)
          : this.lastAnalysis.warnings;
        if (Array.isArray(warnings) && warnings.length > 0) {
          this.warnings = warnings;
        }
      }
      if (this.lastAnalysis.suggestions) {
        const suggestions = typeof this.lastAnalysis.suggestions === 'string'
          ? JSON.parse(this.lastAnalysis.suggestions)
          : this.lastAnalysis.suggestions;
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          this.suggestions = suggestions;
        }
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

