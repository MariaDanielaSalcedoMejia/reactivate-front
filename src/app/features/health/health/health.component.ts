import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HealthService, HealthProfile, HealthAnalysis } from '../../../core/services/health.service';
import { AuthService, UserResponse } from '../../../core/services/auth.service';

/**
 * Interfaz para las zonas de entrenamiento basadas en frecuencia cardíaca
 */
interface TrainingZone {
  nombre: string;
  intensidad: string;
  min: number;
  max: number;
  porcentaje: number;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit, OnDestroy {
  // ==================== PROPIEDADES DE USUARIO ====================
  user: UserResponse | null = null;

  // ==================== DATOS DE ENTRADA ====================
  edad: number | null = null;
  peso: number | null = null;
  altura: number | null = null;
  fcReposo: number | null = null;

  // ==================== DATOS CALCULADOS ====================
  imc: number | null = null;
  imcCategoria: string = '';
  fcMax: number | null = null;
  reserva: number | null = null;
  zonas: TrainingZone[] = [];

  // ==================== ANÁLISIS Y RESULTADOS ====================
  recomendacion: string = '';
  score: number = 0;
  nivel: string = '';
  error: string = '';
  healthSummary: string = '';
  warnings: string[] = [];
  suggestions: string[] = [];
  lastAnalysis: HealthAnalysis | null = null;

  // ==================== HISTORIAL ====================
  showHistory: boolean = false;
  analysisHistory: HealthAnalysis[] = [];

  // ==================== RxJS ====================
  private destroy$ = new Subject<void>();

  constructor(
    private healthService: HealthService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user) {
      this.loadProfile();
      this.loadHistory();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CARGA DE DATOS ====================

  /**
   * Carga el perfil de salud del usuario desde el backend
   */
  loadProfile(): void {
    if (!this.user) return;

    this.healthService
      .getProfile(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => this.applyProfile(profile),
        error: (err) => {
          console.warn('No hay perfil anterior registrado', err);
        }
      });
  }

  /**
   * Carga el historial de análisis del usuario
   */
  loadHistory(): void {
    if (!this.user) return;

    this.healthService
      .getAnalysisHistory(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.analysisHistory = history;
        },
        error: (err) => {
          console.warn('Sin historial de análisis', err);
        }
      });
  }

  // ==================== CÁLCULO Y GUARDADO ====================

  /**
   * Valida y guarda el perfil de salud del usuario
   */
  calcular(): void {
    this.error = '';

    if (!this.user) {
      this.error = 'Debes iniciar sesión para guardar tu perfil de salud.';
      console.warn('🚫 No hay usuario logueado');
      return;
    }

    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      this.error = 'Completa todos los campos';
      console.warn('🚫 Campos incompletos:', {
        edad: this.edad,
        peso: this.peso,
        altura: this.altura,
        fcReposo: this.fcReposo
      });
      return;
    }

    console.log('📤 Enviando datos de salud...', {
      userId: this.user.id,
      altura: this.altura,
      peso: this.peso,
      fcReposo: this.fcReposo,
      edad: this.edad
    });

    this.healthService
      .saveProfile(this.user.id, this.altura, this.peso, this.fcReposo, this.edad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          console.log('✅ Datos guardados exitosamente:', profile);
          this.applyProfile(profile);
          this.loadHistory();
        },
        error: (err) => {
          console.error('❌ Error al guardar:', err);
          this.error =
            typeof err === 'string'
              ? err
              : 'Error al guardar el perfil de salud. Por favor intenta nuevamente.';
        }
      });
  }

  /**
   * Aplica el perfil de salud a las propiedades del componente
   */
  applyProfile(profile: HealthProfile): void {
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

    this.generateHealthAnalysis();
    setTimeout(() => this.loadDetailedAnalysis(), 500);
  }

  // ==================== ANÁLISIS Y GENERACIÓN ====================

  /**
   * Genera un análisis automático basado en los datos ingresados
   */
  generateHealthAnalysis(): void {
    const lines: string[] = [];

    if (this.imc) {
      const imcStatus = this.imcCategoria;
      lines.push(
        `📊 IMC: Tu índice de masa corporal es ${this.imc.toFixed(1)} (${imcStatus}).`
      );
    }

    if (this.fcReposo) {
      if (this.fcReposo < 60) {
        lines.push(
          '❤️ Frecuencia Cardíaca: Excelente capacidad cardiovascular. Tu FC en reposo está en nivel atlético.'
        );
      } else if (this.fcReposo <= 80) {
        lines.push(
          '❤️ Frecuencia Cardíaca: Nivel saludable. Mantén el entrenamiento cardiovascular regular.'
        );
      } else {
        lines.push(
          '❤️ Frecuencia Cardíaca: Podrías mejorar tu resistencia cardiovascular con ejercicio regular.'
        );
      }
    }

    if (this.score) {
      if (this.score >= 85) {
        lines.push(
          '🔥 Estado General: Atleta en excelente condición. Mantén tu rutina de entrenamiento.'
        );
      } else if (this.score >= 70) {
        lines.push('💪 Estado General: Buen nivel de fitness. Continúa con tus ejercicios actuales.');
      } else if (this.score >= 50) {
        lines.push(
          '⚡ Estado General: Necesitas incrementar tu actividad física para mejorar tu fitness.'
        );
      } else {
        lines.push(
          '⚠️ Estado General: Te recomendamos iniciar un programa de ejercicio gradual.'
        );
      }
    }

    this.healthSummary = lines.join('\n');
    this.generateWarnings();
    this.generateSuggestions();
  }

  /**
   * Genera alertas basadas en los valores de salud
   */
  generateWarnings(): void {
    this.warnings = [];

    if (this.imc && this.imc > 30) {
      this.warnings.push('Obesidad detectada. Consulta con un profesional de salud.');
    } else if (this.imc && this.imc > 25) {
      this.warnings.push('Sobrepeso. Considera incrementar actividad física.');
    }

    if (this.fcReposo && this.fcReposo > 100) {
      this.warnings.push(
        'FC en reposo elevada. Podría indicar estrés o falta de actividad cardiovascular.'
      );
    }

    if (this.score && this.score < 50) {
      this.warnings.push('Tu nivel de fitness es bajo. Empieza con ejercicios suaves.');
    }
  }

  /**
   * Genera sugerencias personalizadas basadas en los datos de salud
   */
  generateSuggestions(): void {
    this.suggestions = [];

    if (this.imc && this.imc < 25) {
      this.suggestions.push(
        '🎯 Mantén tu peso actual. Continúa con una alimentación balanceada.'
      );
    } else if (this.imc && this.imc < 30) {
      this.suggestions.push(
        '🎯 Aumenta tu actividad física a 30 min diarios de cardio moderado.'
      );
    } else {
      this.suggestions.push(
        '🎯 Combina ejercicio cardiovascular con entrenamiento de fuerza 5 veces/semana.'
      );
    }

    if (this.fcReposo && this.fcReposo < 60) {
      this.suggestions.push(
        '💚 Tu corazón está muy fuerte. Varía tus entrenamientos entre cardio y fuerza.'
      );
    } else if (this.fcReposo && this.fcReposo > 80) {
      this.suggestions.push(
        '💚 Incluye al menos 3 sesiones semanales de cardio (caminar, correr, natación).'
      );
    }

    if (this.score && this.score >= 85) {
      this.suggestions.push(
        '🏆 Excelente fitness. Considera objetivos más avanzados: maratones, competencias.'
      );
    } else if (this.score && this.score >= 70) {
      this.suggestions.push('🏆 Buen progreso. Prueba nuevos deportes o incrementa intensidad.');
    } else if (this.score && this.score < 50) {
      this.suggestions.push('🏆 Empieza con caminatas de 20-30 min, 3 veces por semana.');
    }

    this.suggestions.push('📅 Realiza análisis de salud cada mes para seguir tu progreso.');
  }

  // ==================== ANÁLISIS DETALLADO ====================

  /**
   * Carga el análisis detallado del backend
   */
  loadDetailedAnalysis(): void {
    if (!this.user) return;

    this.healthService
      .getAnalysisHistory(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          if (history.length > 0) {
            this.lastAnalysis = history[0];
            this.parseAnalysisData();
          }
        },
        error: (err) => {
          console.warn('Error cargando análisis detallado', err);
        }
      });
  }

  /**
   * Parsea los datos del análisis del backend
   */
  parseAnalysisData(): void {
    if (!this.lastAnalysis) return;

    if (this.lastAnalysis.health_summary) {
      this.healthSummary = this.lastAnalysis.health_summary;
    }

    try {
      if (this.lastAnalysis.warnings) {
        const warnings = this.getWarningsArray();
        if (warnings.length > 0) {
          this.warnings = warnings;
        }
      }

      if (this.lastAnalysis.suggestions) {
        const suggestions = this.getSuggestionsArray();
        if (suggestions.length > 0) {
          this.suggestions = suggestions;
        }
      }
    } catch (e) {
      console.error('Error parsing analysis data:', e);
    }

    this.printDetailedAnalysis(this.lastAnalysis);
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtiene la categoría del IMC según el valor
   */
  getImcCategoria(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Óptimo';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  /**
   * Obtiene la clase CSS para el IMC
   */
  getImcClass(imc: number): string {
    if (imc < 18.5) return 'bajo';
    if (imc < 25) return 'optimo';
    if (imc < 30) return 'sobrepeso';
    return 'obesidad';
  }

  /**
   * Construye las zonas de entrenamiento basadas en FC de reposo y reserva
   */
  buildZones(fcReposo: number, reserva: number): TrainingZone[] {
    const recovery: TrainingZone = {
      nombre: 'Recuperación',
      intensidad: '50%',
      min: Math.round(fcReposo + reserva * 0.5),
      max: Math.round(fcReposo + reserva * 0.6),
      porcentaje: 50,
      color: '#4CAF50',
      descripcion: 'Actividad ligera, ideal para días de descanso activo'
    };

    const aerobic: TrainingZone = {
      nombre: 'Aeróbica',
      intensidad: '65%',
      min: Math.round(fcReposo + reserva * 0.6),
      max: Math.round(fcReposo + reserva * 0.7),
      porcentaje: 65,
      color: '#2196F3',
      descripcion: 'Resistencia cardiovascular, entrenamientos moderados'
    };

    const performance: TrainingZone = {
      nombre: 'Rendimiento',
      intensidad: '80%',
      min: Math.round(fcReposo + reserva * 0.7),
      max: Math.round(fcReposo + reserva * 0.85),
      porcentaje: 80,
      color: '#FF9800',
      descripcion: 'Entrenamientos intensos y competiciones'
    };

    return [recovery, aerobic, performance];
  }

  /**
   * Obtiene el color según el score
   */
  getScoreColor(score: number): string {
    if (score >= 85) return '#4CAF50'; // Verde
    if (score >= 70) return '#2196F3'; // Azul
    if (score >= 50) return '#FF9800'; // Naranja
    return '#f44336'; // Rojo
  }

  /**
   * Genera la trayectoria SVG para el gráfico del score
   */
  getScorePath(): string {
    const radius = 50;
    const angle = (this.score / 100) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 75 + radius * Math.cos(rad);
    const y = 75 + radius * Math.sin(rad);
    const largeArc = this.score > 50 ? 1 : 0;

    return `M 75,25 A 50,50 0 ${largeArc} 1 ${x},${y}`;
  }

  /**
   * Obtiene la clase CSS para el nivel
   */
  getNivelClass(nivel: string): string {
    if (nivel.includes('Atleta')) return 'atleta';
    if (nivel.includes('Buen')) return 'bien';
    if (nivel.includes('Mejorable')) return 'mejorable';
    return 'bajo';
  }

  /**
   * Getter para el mensaje de FC en reposo
   */
  get mensajeFcReposo(): string {
    if (!this.fcReposo) return '';
    if (this.fcReposo < 60) return 'Excelente capacidad cardiovascular 🔥';
    if (this.fcReposo <= 80) return 'Nivel saludable 👍';
    return 'Podrías mejorar tu resistencia ⚡';
  }

  /**
   * Alterna la visibilidad del historial
   */
  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  /**
   * Formatea una fecha en formato es-ES
   */
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

  /**
   * Visualiza los detalles de un análisis específico
   */
  viewAnalysisDetail(analysis: HealthAnalysis): void {
    this.lastAnalysis = analysis;
    this.parseAnalysisData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== PARSEO DE DATOS DEL BACKEND ====================

  /**
   * Obtiene el array de alertas parseando JSON si es necesario
   */
  getWarningsArray(): string[] {
    if (!this.lastAnalysis || !this.lastAnalysis.warnings) return [];

    try {
      const warnings =
        typeof this.lastAnalysis.warnings === 'string'
          ? JSON.parse(this.lastAnalysis.warnings)
          : this.lastAnalysis.warnings;

      return Array.isArray(warnings) ? warnings : [];
    } catch (e) {
      console.error('Error parsing warnings:', e);
      return [];
    }
  }

  /**
   * Obtiene el array de sugerencias parseando JSON si es necesario
   */
  getSuggestionsArray(): string[] {
    if (!this.lastAnalysis || !this.lastAnalysis.suggestions) return [];

    try {
      const suggestions =
        typeof this.lastAnalysis.suggestions === 'string'
          ? JSON.parse(this.lastAnalysis.suggestions)
          : this.lastAnalysis.suggestions;

      return Array.isArray(suggestions) ? suggestions : [];
    } catch (e) {
      console.error('Error parsing suggestions:', e);
      return [];
    }
  }

  // ==================== LOGGING ====================

  /**
   * Imprime en consola el análisis detallado
   */
  printDetailedAnalysis(analysis: HealthAnalysis): void {
    console.group(
      '%c🏥 ANÁLISIS DE SALUD DETALLADO',
      'color: #E91E63; font-size: 14px; font-weight: bold;'
    );

    // Información Personal
    console.group('%c👤 INFORMACIÓN PERSONAL', 'color: #00BCD4; font-weight: bold;');
    console.log('Altura:', analysis.height_cm, 'cm');
    console.log('Peso:', analysis.weight_kg, 'kg');
    console.log('Edad:', analysis.age, 'años');
    console.log('FC en reposo:', analysis.resting_hr, 'bpm');
    console.groupEnd();

    // Índices de Salud
    console.group('%c💪 ÍNDICES DE SALUD', 'color: #8BC34A; font-weight: bold;');
    console.log('IMC:', analysis.imc.toFixed(2), `(${analysis.imc_category})`);
    console.log('Score de Salud:', analysis.score, '/100');
    console.log('Nivel:', analysis.level);
    console.groupEnd();

    // Frecuencia Cardíaca
    console.group('%c❤️ FRECUENCIA CARDÍACA', 'color: #f44336; font-weight: bold;');
    console.log('FC Máxima:', analysis.max_hr, 'bpm');
    console.log('Reserva Cardíaca:', analysis.heart_reserve, 'bpm');
    console.table({
      'Recuperación (50%)': `${analysis.recovery_zone_min} - ${analysis.recovery_zone_max} bpm`,
      'Aeróbica (65%)': `${analysis.aerobic_zone_min} - ${analysis.aerobic_zone_max} bpm`,
      'Rendimiento (80%)': `${analysis.performance_zone_min} - ${analysis.performance_zone_max} bpm`
    });
    console.groupEnd();

    // Resumen de Salud
    console.group('%c📋 RESUMEN DE SALUD', 'color: #FF6F00; font-weight: bold;');
    console.log(analysis.health_summary);
    console.groupEnd();

    // Alertas
    if (analysis.warnings) {
      console.group('%c⚠️ ALERTAS', 'color: #FF5722; font-weight: bold;');
      try {
        const warnings = this.getWarningsArray();
        warnings.forEach((warning, index) => {
          console.warn(`[${index + 1}]`, warning);
        });
      } catch (e) {
        console.warn('Error showing warnings:', analysis.warnings);
      }
      console.groupEnd();
    }

    // Sugerencias
    if (analysis.suggestions) {
      console.group(
        '%c💡 SUGERENCIAS Y RECOMENDACIONES',
        'color: #4CAF50; font-weight: bold;'
      );
      try {
        const suggestions = this.getSuggestionsArray();
        suggestions.forEach((suggestion, index) => {
          console.log(`[${index + 1}]`, suggestion);
        });
      } catch (e) {
        console.log('Error showing suggestions:', analysis.suggestions);
      }
      console.groupEnd();
    }

    console.log(
      '%c📅 Análisis realizado:',
      'color: #607D8B; font-weight: bold;',
      this.getDateFormat(analysis.created_at)
    );
    console.groupEnd();
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HealthService, HealthProfile, HealthAnalysis } from '../../../core/services/health.service';
import { AuthService, UserResponse } from '../../../core/services/auth.service';

/**
 * Interfaz para las zonas de entrenamiento basadas en frecuencia cardíaca
 */
interface TrainingZone {
  nombre: string;
  intensidad: string;
  min: number;
  max: number;
  porcentaje: number;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit, OnDestroy {
  // ==================== PROPIEDADES DE USUARIO ====================
  user: UserResponse | null = null;

  // ==================== DATOS DE ENTRADA ====================
  edad: number | null = null;
  peso: number | null = null;
  altura: number | null = null;
  fcReposo: number | null = null;

  // ==================== DATOS CALCULADOS ====================
  imc: number | null = null;
  imcCategoria: string = '';
  fcMax: number | null = null;
  reserva: number | null = null;
  zonas: TrainingZone[] = [];

  // ==================== ANÁLISIS Y RESULTADOS ====================
  recomendacion: string = '';
  score: number = 0;
  nivel: string = '';
  error: string = '';
  healthSummary: string = '';
  warnings: string[] = [];
  suggestions: string[] = [];
  lastAnalysis: HealthAnalysis | null = null;

  // ==================== HISTORIAL ====================
  showHistory: boolean = false;
  analysisHistory: HealthAnalysis[] = [];

  // ==================== RxJS ====================
  private destroy$ = new Subject<void>();

  constructor(
    private healthService: HealthService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user) {
      this.loadProfile();
      this.loadHistory();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CARGA DE DATOS ====================

  /**
   * Carga el perfil de salud del usuario desde el backend
   */
  loadProfile(): void {
    if (!this.user) return;

    this.healthService
      .getProfile(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => this.applyProfile(profile),
        error: (err) => {
          console.warn('No hay perfil anterior registrado', err);
        }
      });
  }

  /**
   * Carga el historial de análisis del usuario
   */
  loadHistory(): void {
    if (!this.user) return;

    this.healthService
      .getAnalysisHistory(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.analysisHistory = history;
        },
        error: (err) => {
          console.warn('Sin historial de análisis', err);
        }
      });
  }

  // ==================== CÁLCULO Y GUARDADO ====================

  /**
   * Valida y guarda el perfil de salud del usuario
   */
  calcular(): void {
    this.error = '';

    if (!this.user) {
      this.error = 'Debes iniciar sesión para guardar tu perfil de salud.';
      console.warn('🚫 No hay usuario logueado');
      return;
    }

    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      this.error = 'Completa todos los campos';
      console.warn('🚫 Campos incompletos:', {
        edad: this.edad,
        peso: this.peso,
        altura: this.altura,
        fcReposo: this.fcReposo
      });
      return;
    }

    console.log('📤 Enviando datos de salud...', {
      userId: this.user.id,
      altura: this.altura,
      peso: this.peso,
      fcReposo: this.fcReposo,
      edad: this.edad
    });

    this.healthService
      .saveProfile(this.user.id, this.altura, this.peso, this.fcReposo, this.edad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          console.log('✅ Datos guardados exitosamente:', profile);
          this.applyProfile(profile);
          this.loadHistory();
        },
        error: (err) => {
          console.error('❌ Error al guardar:', err);
          this.error =
            typeof err === 'string'
              ? err
              : 'Error al guardar el perfil de salud. Por favor intenta nuevamente.';
        }
      });
  }

  /**
   * Aplica el perfil de salud a las propiedades del componente
   */
  applyProfile(profile: HealthProfile): void {
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

    this.generateHealthAnalysis();
    setTimeout(() => this.loadDetailedAnalysis(), 500);
  }

  // ==================== ANÁLISIS Y GENERACIÓN ====================

  /**
   * Genera un análisis automático basado en los datos ingresados
   */
  generateHealthAnalysis(): void {
    const lines: string[] = [];

    if (this.imc) {
      const imcStatus = this.imcCategoria;
      lines.push(
        `📊 IMC: Tu índice de masa corporal es ${this.imc.toFixed(1)} (${imcStatus}).`
      );
    }

    if (this.fcReposo) {
      if (this.fcReposo < 60) {
        lines.push(
          '❤️ Frecuencia Cardíaca: Excelente capacidad cardiovascular. Tu FC en reposo está en nivel atlético.'
        );
      } else if (this.fcReposo <= 80) {
        lines.push(
          '❤️ Frecuencia Cardíaca: Nivel saludable. Mantén el entrenamiento cardiovascular regular.'
        );
      } else {
        lines.push(
          '❤️ Frecuencia Cardíaca: Podrías mejorar tu resistencia cardiovascular con ejercicio regular.'
        );
      }
    }

    if (this.score) {
      if (this.score >= 85) {
        lines.push(
          '🔥 Estado General: Atleta en excelente condición. Mantén tu rutina de entrenamiento.'
        );
      } else if (this.score >= 70) {
        lines.push('💪 Estado General: Buen nivel de fitness. Continúa con tus ejercicios actuales.');
      } else if (this.score >= 50) {
        lines.push(
          '⚡ Estado General: Necesitas incrementar tu actividad física para mejorar tu fitness.'
        );
      } else {
        lines.push(
          '⚠️ Estado General: Te recomendamos iniciar un programa de ejercicio gradual.'
        );
      }
    }

    this.healthSummary = lines.join('\n');
    this.generateWarnings();
    this.generateSuggestions();
  }

  /**
   * Genera alertas basadas en los valores de salud
   */
  generateWarnings(): void {
    this.warnings = [];

    if (this.imc && this.imc > 30) {
      this.warnings.push('Obesidad detectada. Consulta con un profesional de salud.');
    } else if (this.imc && this.imc > 25) {
      this.warnings.push('Sobrepeso. Considera incrementar actividad física.');
    }

    if (this.fcReposo && this.fcReposo > 100) {
      this.warnings.push(
        'FC en reposo elevada. Podría indicar estrés o falta de actividad cardiovascular.'
      );
    }

    if (this.score && this.score < 50) {
      this.warnings.push('Tu nivel de fitness es bajo. Empieza con ejercicios suaves.');
    }
  }

  /**
   * Genera sugerencias personalizadas basadas en los datos de salud
   */
  generateSuggestions(): void {
    this.suggestions = [];

    if (this.imc && this.imc < 25) {
      this.suggestions.push(
        '🎯 Mantén tu peso actual. Continúa con una alimentación balanceada.'
      );
    } else if (this.imc && this.imc < 30) {
      this.suggestions.push(
        '🎯 Aumenta tu actividad física a 30 min diarios de cardio moderado.'
      );
    } else {
      this.suggestions.push(
        '🎯 Combina ejercicio cardiovascular con entrenamiento de fuerza 5 veces/semana.'
      );
    }

    if (this.fcReposo && this.fcReposo < 60) {
      this.suggestions.push(
        '💚 Tu corazón está muy fuerte. Varía tus entrenamientos entre cardio y fuerza.'
      );
    } else if (this.fcReposo && this.fcReposo > 80) {
      this.suggestions.push(
        '💚 Incluye al menos 3 sesiones semanales de cardio (caminar, correr, natación).'
      );
    }

    if (this.score && this.score >= 85) {
      this.suggestions.push(
        '🏆 Excelente fitness. Considera objetivos más avanzados: maratones, competencias.'
      );
    } else if (this.score && this.score >= 70) {
      this.suggestions.push('🏆 Buen progreso. Prueba nuevos deportes o incrementa intensidad.');
    } else if (this.score && this.score < 50) {
      this.suggestions.push('🏆 Empieza con caminatas de 20-30 min, 3 veces por semana.');
    }

    this.suggestions.push('📅 Realiza análisis de salud cada mes para seguir tu progreso.');
  }

  // ==================== ANÁLISIS DETALLADO ====================

  /**
   * Carga el análisis detallado del backend
   */
  loadDetailedAnalysis(): void {
    if (!this.user) return;

    this.healthService
      .getAnalysisHistory(this.user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          if (history.length > 0) {
            this.lastAnalysis = history[0];
            this.parseAnalysisData();
          }
        },
        error: (err) => {
          console.warn('Error cargando análisis detallado', err);
        }
      });
  }

  /**
   * Parsea los datos del análisis del backend
   */
  parseAnalysisData(): void {
    if (!this.lastAnalysis) return;

    if (this.lastAnalysis.health_summary) {
      this.healthSummary = this.lastAnalysis.health_summary;
    }

    try {
      if (this.lastAnalysis.warnings) {
        const warnings = this.getWarningsArray();
        if (warnings.length > 0) {
          this.warnings = warnings;
        }
      }

      if (this.lastAnalysis.suggestions) {
        const suggestions = this.getSuggestionsArray();
        if (suggestions.length > 0) {
          this.suggestions = suggestions;
        }
      }
    } catch (e) {
      console.error('Error parsing analysis data:', e);
    }

    this.printDetailedAnalysis(this.lastAnalysis);
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtiene la categoría del IMC según el valor
   */
  getImcCategoria(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Óptimo';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  /**
   * Obtiene la clase CSS para el IMC
   */
  getImcClass(imc: number): string {
    if (imc < 18.5) return 'bajo';
    if (imc < 25) return 'optimo';
    if (imc < 30) return 'sobrepeso';
    return 'obesidad';
  }

  /**
   * Construye las zonas de entrenamiento basadas en FC de reposo y reserva
   */
  buildZones(fcReposo: number, reserva: number): TrainingZone[] {
    const recovery: TrainingZone = {
      nombre: 'Recuperación',
      intensidad: '50%',
      min: Math.round(fcReposo + reserva * 0.5),
      max: Math.round(fcReposo + reserva * 0.6),
      porcentaje: 50,
      color: '#4CAF50',
      descripcion: 'Actividad ligera, ideal para días de descanso activo'
    };

    const aerobic: TrainingZone = {
      nombre: 'Aeróbica',
      intensidad: '65%',
      min: Math.round(fcReposo + reserva * 0.6),
      max: Math.round(fcReposo + reserva * 0.7),
      porcentaje: 65,
      color: '#2196F3',
      descripcion: 'Resistencia cardiovascular, entrenamientos moderados'
    };

    const performance: TrainingZone = {
      nombre: 'Rendimiento',
      intensidad: '80%',
      min: Math.round(fcReposo + reserva * 0.7),
      max: Math.round(fcReposo + reserva * 0.85),
      porcentaje: 80,
      color: '#FF9800',
      descripcion: 'Entrenamientos intensos y competiciones'
    };

    return [recovery, aerobic, performance];
  }

  /**
   * Obtiene el color según el score
   */
  getScoreColor(score: number): string {
    if (score >= 85) return '#4CAF50'; // Verde
    if (score >= 70) return '#2196F3'; // Azul
    if (score >= 50) return '#FF9800'; // Naranja
    return '#f44336'; // Rojo
  }

  /**
   * Genera la trayectoria SVG para el gráfico del score
   */
  getScorePath(): string {
    const radius = 50;
    const angle = (this.score / 100) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 75 + radius * Math.cos(rad);
    const y = 75 + radius * Math.sin(rad);
    const largeArc = this.score > 50 ? 1 : 0;

    return `M 75,25 A 50,50 0 ${largeArc} 1 ${x},${y}`;
  }

  /**
   * Obtiene la clase CSS para el nivel
   */
  getNivelClass(nivel: string): string {
    if (nivel.includes('Atleta')) return 'atleta';
    if (nivel.includes('Buen')) return 'bien';
    if (nivel.includes('Mejorable')) return 'mejorable';
    return 'bajo';
  }

  /**
   * Getter para el mensaje de FC en reposo
   */
  get mensajeFcReposo(): string {
    if (!this.fcReposo) return '';
    if (this.fcReposo < 60) return 'Excelente capacidad cardiovascular 🔥';
    if (this.fcReposo <= 80) return 'Nivel saludable 👍';
    return 'Podrías mejorar tu resistencia ⚡';
  }

  /**
   * Alterna la visibilidad del historial
   */
  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  /**
   * Formatea una fecha en formato es-ES
   */
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

  /**
   * Visualiza los detalles de un análisis específico
   */
  viewAnalysisDetail(analysis: HealthAnalysis): void {
    this.lastAnalysis = analysis;
    this.parseAnalysisData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== PARSEO DE DATOS DEL BACKEND ====================

  /**
   * Obtiene el array de alertas parseando JSON si es necesario
   */
  getWarningsArray(): string[] {
    if (!this.lastAnalysis || !this.lastAnalysis.warnings) return [];

    try {
      const warnings =
        typeof this.lastAnalysis.warnings === 'string'
          ? JSON.parse(this.lastAnalysis.warnings)
          : this.lastAnalysis.warnings;

      return Array.isArray(warnings) ? warnings : [];
    } catch (e) {
      console.error('Error parsing warnings:', e);
      return [];
    }
  }

  /**
   * Obtiene el array de sugerencias parseando JSON si es necesario
   */
  getSuggestionsArray(): string[] {
    if (!this.lastAnalysis || !this.lastAnalysis.suggestions) return [];

    try {
      const suggestions =
        typeof this.lastAnalysis.suggestions === 'string'
          ? JSON.parse(this.lastAnalysis.suggestions)
          : this.lastAnalysis.suggestions;

      return Array.isArray(suggestions) ? suggestions : [];
    } catch (e) {
      console.error('Error parsing suggestions:', e);
      return [];
    }
  }

  // ==================== LOGGING ====================

  /**
   * Imprime en consola el análisis detallado
   */
  printDetailedAnalysis(analysis: HealthAnalysis): void {
    console.group(
      '%c🏥 ANÁLISIS DE SALUD DETALLADO',
      'color: #E91E63; font-size: 14px; font-weight: bold;'
    );

    // Información Personal
    console.group('%c👤 INFORMACIÓN PERSONAL', 'color: #00BCD4; font-weight: bold;');
    console.log('Altura:', analysis.height_cm, 'cm');
    console.log('Peso:', analysis.weight_kg, 'kg');
    console.log('Edad:', analysis.age, 'años');
    console.log('FC en reposo:', analysis.resting_hr, 'bpm');
    console.groupEnd();

    // Índices de Salud
    console.group('%c💪 ÍNDICES DE SALUD', 'color: #8BC34A; font-weight: bold;');
    console.log('IMC:', analysis.imc.toFixed(2), `(${analysis.imc_category})`);
    console.log('Score de Salud:', analysis.score, '/100');
    console.log('Nivel:', analysis.level);
    console.groupEnd();

    // Frecuencia Cardíaca
    console.group('%c❤️ FRECUENCIA CARDÍACA', 'color: #f44336; font-weight: bold;');
    console.log('FC Máxima:', analysis.max_hr, 'bpm');
    console.log('Reserva Cardíaca:', analysis.heart_reserve, 'bpm');
    console.table({
      'Recuperación (50%)': `${analysis.recovery_zone_min} - ${analysis.recovery_zone_max} bpm`,
      'Aeróbica (65%)': `${analysis.aerobic_zone_min} - ${analysis.aerobic_zone_max} bpm`,
      'Rendimiento (80%)': `${analysis.performance_zone_min} - ${analysis.performance_zone_max} bpm`
    });
    console.groupEnd();

    // Resumen de Salud
    console.group('%c📋 RESUMEN DE SALUD', 'color: #FF6F00; font-weight: bold;');
    console.log(analysis.health_summary);
    console.groupEnd();

    // Alertas
    if (analysis.warnings) {
      console.group('%c⚠️ ALERTAS', 'color: #FF5722; font-weight: bold;');
      try {
        const warnings = this.getWarningsArray();
        warnings.forEach((warning, index) => {
          console.warn(`[${index + 1}]`, warning);
        });
      } catch (e) {
        console.warn('Error showing warnings:', analysis.warnings);
      }
      console.groupEnd();
    }

    // Sugerencias
    if (analysis.suggestions) {
      console.group(
        '%c💡 SUGERENCIAS Y RECOMENDACIONES',
        'color: #4CAF50; font-weight: bold;'
      );
      try {
        const suggestions = this.getSuggestionsArray();
        suggestions.forEach((suggestion, index) => {
          console.log(`[${index + 1}]`, suggestion);
        });
      } catch (e) {
        console.log('Error showing suggestions:', analysis.suggestions);
      }
      console.groupEnd();
    }

    console.log(
      '%c📅 Análisis realizado:',
      'color: #607D8B; font-weight: bold;',
      this.getDateFormat(analysis.created_at)
    );
    console.groupEnd();
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HealthService, HealthProfile, HealthAnalysis } from '../../../core/services/health.service';
import { AuthService, UserResponse } from '../../../core/services/auth.service';

interface TrainingZone {
  nombre: string;
  intensidad: string;
  min: number;
  max: number;
  porcentaje: number;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent implements OnInit, OnDestroy {
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
      console.warn('🚫 No hay usuario logueado');
      return;
    }

    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      this.error = 'Completa todos los campos';
      console.warn('🚫 Campos incompletos:', { edad: this.edad, peso: this.peso, altura: this.altura, fcReposo: this.fcReposo });
      return;
    }

    console.log('📤 Enviando datos de salud...', {
      userId: this.user.id,
      altura: this.altura,
      peso: this.peso,
      fcReposo: this.fcReposo,
      edad: this.edad
    });

    this.healthService.saveProfile(this.user.id, this.altura, this.peso, this.fcReposo, this.edad).subscribe({
      next: (profile) => {
        console.log('✅ Datos guardados exitosamente:', profile);
        this.applyProfile(profile);
        this.loadHistory(); // Recargar historial después de guardar
      },
      error: (err) => {
        console.error('❌ Error al guardar:', err);
        this.error = typeof err === 'string' ? err : 'Error al guardar el perfil de salud. Por favor intenta nuevamente.';
      }
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

    // Mostrar análisis completo en consola
    this.printDetailedAnalysis(this.lastAnalysis);
  }

  getImcCategoria(imc: number) {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Óptimo';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  buildZones(fcReposo: number, reserva: number) {
    const recovery = {
      nombre: 'Recuperación',
      intensidad: '50%',
      min: Math.round(fcReposo + reserva * 0.5),
      max: Math.round(fcReposo + reserva * 0.6),
      porcentaje: 50,
      color: '#4CAF50',
      descripcion: 'Actividad ligera, ideal para días de descanso activo'
    };
    const aerobic = {
      nombre: 'Aeróbica',
      intensidad: '65%',
      min: Math.round(fcReposo + reserva * 0.6),
      max: Math.round(fcReposo + reserva * 0.7),
      porcentaje: 65,
      color: '#2196F3',
      descripcion: 'Resistencia cardiovascular, entrenamientos moderados'
    };
    const performance = {
      nombre: 'Rendimiento',
      intensidad: '80%',
      min: Math.round(fcReposo + reserva * 0.7),
      max: Math.round(fcReposo + reserva * 0.85),
      porcentaje: 80,
      color: '#FF9800',
      descripcion: 'Entrenamientos intensos y competiciones'
    };

    return [recovery, aerobic, performance];
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

  getNivelClass(nivel: string): string {
    if (nivel.includes('Atleta')) return 'atleta';
    if (nivel.includes('Buen')) return 'bien';
    if (nivel.includes('Mejorable')) return 'mejorable';
    return 'bajo';
  }

  // ==================== MÉTODOS AUXILIARES PARA PARSEAR DATOS ====================

  getWarningsArray(): string[] {
    if (!this.lastAnalysis || !this.lastAnalysis.warnings) return [];
    try {
      const warnings = typeof this.lastAnalysis.warnings === 'string'
        ? JSON.parse(this.lastAnalysis.warnings)
        : this.lastAnalysis.warnings;
      return Array.isArray(warnings) ? warnings : [];
    } catch (e) {
      console.error('Error parsing warnings:', e);
      return [];
    }
  }

  getSuggestionsArray(): string[] {
    if (!this.lastAnalysis || !this.lastAnalysis.suggestions) return [];
    try {
      const suggestions = typeof this.lastAnalysis.suggestions === 'string'
        ? JSON.parse(this.lastAnalysis.suggestions)
        : this.lastAnalysis.suggestions;
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (e) {
      console.error('Error parsing suggestions:', e);
      return [];
    }
  }

  getImcClass(imc: number): string {
    if (imc < 18.5) return 'bajo';
    if (imc < 25) return 'optimo';
    if (imc < 30) return 'sobrepeso';
    return 'obesidad';
  }

  getScorePath(): string {
    // Crea una trayectoria SVG para el arco del score
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (this.score / 100) * circumference;

    const angle = (this.score / 100) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 75 + radius * Math.cos(rad);
    const y = 75 + radius * Math.sin(rad);

    const largeArc = this.score > 50 ? 1 : 0;
    return `M 75,25 A 50,50 0 ${largeArc} 1 ${x},${y}`;
  }

  printDetailedAnalysis(analysis: HealthAnalysis) {
    console.group('%c🏥 ANÁLISIS DE SALUD DETALLADO', 'color: #E91E63; font-size: 14px; font-weight: bold;');

    console.group('%c👤 INFORMACIÓN PERSONAL', 'color: #00BCD4; font-weight: bold;');
    console.log('Altura:', analysis.height_cm, 'cm');
    console.log('Peso:', analysis.weight_kg, 'kg');
    console.log('Edad:', analysis.age, 'años');
    console.log('FC en reposo:', analysis.resting_hr, 'bpm');
    console.groupEnd();

    console.group('%c💪 ÍNDICES DE SALUD', 'color: #8BC34A; font-weight: bold;');
    console.log('IMC:', analysis.imc.toFixed(2), '(' + analysis.imc_category + ')');
    console.log('Score de Salud:', analysis.score, '/100');
    console.log('Nivel:', analysis.level);
    console.groupEnd();

    console.group('%c❤️ FRECUENCIA CARDÍACA', 'color: #f44336; font-weight: bold;');
    console.log('FC Máxima:', analysis.max_hr, 'bpm');
    console.log('Reserva Cardíaca:', analysis.heart_reserve, 'bpm');
    console.table({
      'Recuperación (50%)': analysis.recovery_zone_min + ' - ' + analysis.recovery_zone_max + ' bpm',
      'Aeróbica (65%)': analysis.aerobic_zone_min + ' - ' + analysis.aerobic_zone_max + ' bpm',
      'Rendimiento (80%)': analysis.performance_zone_min + ' - ' + analysis.performance_zone_max + ' bpm'
    });
    console.groupEnd();

    console.group('%c📋 RESUMEN DE SALUD', 'color: #FF6F00; font-weight: bold;');
    console.log(analysis.health_summary);
    console.groupEnd();

    if (analysis.warnings) {
      console.group('%c⚠️ ALERTAS', 'color: #FF5722; font-weight: bold;');
      try {
        const warnings = this.getWarningsArray();
        warnings.forEach((warning, index) => {
          console.warn(`[${index + 1}]`, warning);
        });
      } catch (e) {
        console.warn(analysis.warnings);
      }
      console.groupEnd();
    }

    if (analysis.suggestions) {
      console.group('%c💡 SUGERENCIAS', 'color: #4CAF50; font-weight: bold;');
      try {
        const suggestions = this.getSuggestionsArray();
        suggestions.forEach((suggestion, index) => {
          console.log(`[${index + 1}]`, suggestion);
        });
      } catch (e) {
        console.log(analysis.suggestions);
      }
      console.groupEnd();
    }

    console.log('%c📅 Análisis realizado:', 'color: #607D8B; font-weight: bold;', this.getDateFormat(analysis.created_at));
    console.groupEnd();
  }
    console.log('Peso:', analysis.weight_kg, 'kg');
    console.log('Edad:', analysis.age, 'años');
    console.log('FC en reposo:', analysis.resting_hr, 'bpm');
    console.groupEnd();

    console.group('%c💪 ÍNDICES DE SALUD', 'color: #8BC34A; font-weight: bold;');
    console.log('IMC:', analysis.imc.toFixed(2), '(' + analysis.imc_category + ')');
    console.log('Score de Salud:', analysis.score, '/100');
    console.log('Nivel:', analysis.level);
    console.groupEnd();

    console.group('%c❤️ FRECUENCIA CARDÍACA', 'color: #f44336; font-weight: bold;');
    console.log('FC Máxima:', analysis.max_hr, 'bpm');
    console.log('Reserva Cardíaca:', analysis.heart_reserve, 'bpm');
    console.table({
      'Recuperación (50%)': analysis.recovery_zone_min + ' - ' + analysis.recovery_zone_max + ' bpm',
      'Aeróbica (65%)': analysis.aerobic_zone_min + ' - ' + analysis.aerobic_zone_max + ' bpm',
      'Rendimiento (80%)': analysis.performance_zone_min + ' - ' + analysis.performance_zone_max + ' bpm'
    });
    console.groupEnd();

    console.group('%c📋 RESUMEN DE SALUD', 'color: #FF6F00; font-weight: bold;');
    console.log(analysis.health_summary);
    console.groupEnd();

    if (analysis.warnings) {
      console.group('%c⚠️ ALERTAS Y ADVERTENCIAS', 'color: #FF5722; font-weight: bold;');
      try {
        const warnings = typeof analysis.warnings === 'string' ? JSON.parse(analysis.warnings) : analysis.warnings;
        if (Array.isArray(warnings)) {
          warnings.forEach((warning, index) => {
            console.warn(`[${index + 1}]`, warning);
          });
        }
      } catch (e) {
        console.warn(analysis.warnings);
      }
      console.groupEnd();
    }

    if (analysis.suggestions) {
      console.group('%c💡 SUGERENCIAS Y RECOMENDACIONES', 'color: #4CAF50; font-weight: bold;');
      try {
        const suggestions = typeof analysis.suggestions === 'string' ? JSON.parse(analysis.suggestions) : analysis.suggestions;
        if (Array.isArray(suggestions)) {
          suggestions.forEach((suggestion, index) => {
            console.log(`[${index + 1}]`, suggestion);
          });
        }
      } catch (e) {
        console.log(analysis.suggestions);
      }
      console.groupEnd();
    }

    console.log('%c📅 Análisis realizado el:', 'color: #607D8B; font-weight: bold;', this.getDateFormat(analysis.created_at));
    console.groupEnd();
  }
}


