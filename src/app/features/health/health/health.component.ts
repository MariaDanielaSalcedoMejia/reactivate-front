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
  imcCategoria: string = '';
  fcMax: number | null = null;
  reserva: number | null = null;
  zonas: TrainingZone[] = [];
  recomendacion: string = '';
  score: number = 0;
  nivel: string = '';
  error: string = '';
  healthSummary: string = '';
  warnings: string[] = [];
  suggestions: string[] = [];
  lastAnalysis: HealthAnalysis | null = null;
  showHistory: boolean = false;
  analysisHistory: HealthAnalysis[] = [];

  private destroy$ = new Subject<void>();

  constructor(private healthService: HealthService, private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user) { this.loadProfile(); this.loadHistory(); }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadProfile(): void {
    if (!this.user) return;
    this.healthService.getProfile(this.user.id).pipe(takeUntil(this.destroy$))
      .subscribe({ next: (p) => this.applyProfile(p), error: (e) => console.warn('No profile', e) });
  }

  loadHistory(): void {
    if (!this.user) return;
    this.healthService.getAnalysisHistory(this.user.id).pipe(takeUntil(this.destroy$))
      .subscribe({ next: (h) => this.analysisHistory = h, error: (e) => console.warn('No history', e) });
  }

  calcular(): void {
    this.error = '';
    if (!this.user) { this.error = 'Debes iniciar sesi�n'; return; }
    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      this.error = 'Completa todos los campos'; return;
    }
    this.healthService.saveProfile(this.user.id, this.altura, this.peso, this.fcReposo, this.edad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => { this.applyProfile(p); this.loadHistory(); },
        error: (e) => this.error = typeof e === 'string' ? e : 'Error al guardar'
      });
  }

  applyProfile(p: HealthProfile): void {
    this.altura = p.height_cm; this.peso = p.weight_kg; this.fcReposo = p.resting_hr;
    this.imc = p.imc; this.score = p.score; this.nivel = p.level; this.recomendacion = p.recommendation;
    this.fcMax = this.edad ? 220 - this.edad : null;
    this.reserva = this.fcMax && this.fcReposo ? this.fcMax - this.fcReposo : null;
    this.imcCategoria = this.getImcCategoria(p.imc);
    this.zonas = this.buildZones(this.fcReposo ?? 0, this.reserva ?? 0);
    this.generateHealthAnalysis();
    setTimeout(() => this.loadDetailedAnalysis(), 500);
  }

  generateHealthAnalysis(): void {
    const lines: string[] = [];
    if (this.imc) lines.push(`IMC: ${this.imc.toFixed(1)} (${this.imcCategoria})`);
    if (this.fcReposo) {
      if (this.fcReposo < 60) lines.push('Excelente capacidad cardiovascular');
      else if (this.fcReposo <= 80) lines.push('Nivel saludable');
      else lines.push('Podr�as mejorar tu resistencia');
    }
    if (this.score >= 85) lines.push('Estado excelente');
    else if (this.score >= 70) lines.push('Buen nivel de fitness');
    else if (this.score >= 50) lines.push('Necesitas incrementar actividad');
    else lines.push('Inicia programa gradual');
    this.healthSummary = lines.join('\\n');
    this.generateWarnings(); this.generateSuggestions();
  }

  generateWarnings(): void {
    this.warnings = [];
    if (this.imc && this.imc > 30) this.warnings.push('Obesidad detectada');
    else if (this.imc && this.imc > 25) this.warnings.push('Sobrepeso');
    if (this.fcReposo && this.fcReposo > 100) this.warnings.push('FC elevada');
    if (this.score && this.score < 50) this.warnings.push('Fitness bajo');
  }

  generateSuggestions(): void {
    this.suggestions = [];
    if (this.imc && this.imc < 25) this.suggestions.push('Mant�n tu peso actual');
    else this.suggestions.push('Combina cardio con fuerza 5 veces/semana');
    if (this.fcReposo && this.fcReposo > 80) this.suggestions.push('3 sesiones cardio semanales');
    if (this.score && this.score >= 85) this.suggestions.push('Objetivos m�s avanzados');
    this.suggestions.push('An�lisis mensual');
  }

  loadDetailedAnalysis(): void {
    if (!this.user) return;
    this.healthService.getAnalysisHistory(this.user.id).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (h) => { if (h.length > 0) { this.lastAnalysis = h[0]; this.parseAnalysisData(); } },
        error: () => {}
      });
  }

  parseAnalysisData(): void {
    if (!this.lastAnalysis) return;
    if (this.lastAnalysis.health_summary) this.healthSummary = this.lastAnalysis.health_summary;
    try {
      this.warnings = this.getWarningsArray();
      this.suggestions = this.getSuggestionsArray();
    } catch (e) {}
  }

  getImcCategoria(imc: number): string {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return '�ptimo';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  getImcClass(imc: number): string {
    if (imc < 18.5) return 'bajo';
    if (imc < 25) return 'optimo';
    if (imc < 30) return 'sobrepeso';
    return 'obesidad';
  }

  buildZones(fcReposo: number, reserva: number): TrainingZone[] {
    return [
      { nombre: 'Recuperaci�n', intensidad: '50%', min: Math.round(fcReposo + reserva * 0.5), max: Math.round(fcReposo + reserva * 0.6), porcentaje: 50, color: '#4CAF50', descripcion: 'Ligera' },
      { nombre: 'Aer�bica', intensidad: '65%', min: Math.round(fcReposo + reserva * 0.6), max: Math.round(fcReposo + reserva * 0.7), porcentaje: 65, color: '#2196F3', descripcion: 'Moderada' },
      { nombre: 'Rendimiento', intensidad: '80%', min: Math.round(fcReposo + reserva * 0.7), max: Math.round(fcReposo + reserva * 0.85), porcentaje: 80, color: '#FF9800', descripcion: 'Intensa' }
    ];
  }

  getScoreColor(score: number): string {
    if (score >= 85) return '#4CAF50'; if (score >= 70) return '#2196F3';
    if (score >= 50) return '#FF9800'; return '#f44336';
  }

  getScorePath(): string {
    const angle = (this.score / 100) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 75 + 50 * Math.cos(rad);
    const y = 75 + 50 * Math.sin(rad);
    return `M 75,25 A 50,50 0 ${this.score > 50 ? 1 : 0} 1 ${x},${y}`;
  }

  getNivelClass(nivel: string): string {
    return nivel.includes('Atleta') ? 'atleta' : nivel.includes('Buen') ? 'bien' : 'bajo';
  }

  get mensajeFcReposo(): string {
    if (!this.fcReposo) return '';
    if (this.fcReposo < 60) return 'Excelente ??';
    if (this.fcReposo <= 80) return 'Saludable ??';
    return 'Mejora tu resistencia ?';
  }

  toggleHistory(): void { this.showHistory = !this.showHistory; }

  getDateFormat(d: string): string {
    return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  viewAnalysisDetail(a: HealthAnalysis): void {
    this.lastAnalysis = a;
    this.parseAnalysisData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getWarningsArray(): string[] {
    if (!this.lastAnalysis?.warnings) return [];
    try {
      const w = typeof this.lastAnalysis.warnings === 'string' ? JSON.parse(this.lastAnalysis.warnings) : this.lastAnalysis.warnings;
      return Array.isArray(w) ? w : [];
    } catch { return []; }
  }

  getSuggestionsArray(): string[] {
    if (!this.lastAnalysis?.suggestions) return [];
    try {
      const s = typeof this.lastAnalysis.suggestions === 'string' ? JSON.parse(this.lastAnalysis.suggestions) : this.lastAnalysis.suggestions;
      return Array.isArray(s) ? s : [];
    } catch { return []; }
  }

  printDetailedAnalysis(a: HealthAnalysis): void {
    console.log('Height:', a.height_cm, 'Weight:', a.weight_kg, 'Age:', a.age, 'HR:', a.resting_hr);
  }
}
