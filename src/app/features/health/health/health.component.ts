import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthService, HealthProfile } from '../../../core/services/health.service';
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

  constructor(
    private healthService: HealthService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    if (this.user) {
      this.loadProfile();
    }
  }

loadProfile() {
  if (!this.user || !this.user.id) {
    console.warn('Usuario no válido');
    return;
  }

  this.healthService.getProfile(this.user.id).subscribe({
    next: (profile) => this.applyProfile(profile),
    error: (err) => {
      console.warn('No hay perfil aún o backend falló', err);
    }
  });
}

  calcular() {
    this.error = '';

    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      this.error = 'Completa todos los campos';
      return;
    }

    // 🔥 CALCULO LOCAL INMEDIATO
    const imcLocal = this.peso / Math.pow(this.altura / 100, 2);
    this.imc = Number(imcLocal.toFixed(1));
    this.imcCategoria = this.getImcCategoria(this.imc);

    this.fcMax = 220 - this.edad;
    this.reserva = this.fcMax - this.fcReposo;
    this.zonas = this.buildZones(this.fcReposo, this.reserva);

    this.score = 80;
    this.nivel = 'Analizando...';
    this.recomendacion = 'Procesando datos...';

    // 🔄 BACKEND (si existe usuario)
    if (!this.user) return;

    this.healthService.saveProfile(this.user.id, this.altura, this.peso, this.fcReposo)
      .subscribe({
        next: (profile) => {
          console.log('✅ Backend:', profile);
          this.applyProfile(profile);
        },
        error: (err) => {
          console.warn('⚠️ Backend falló, usando cálculo local');
          console.error(err);

          this.nivel = this.getNivelLocal();
          this.recomendacion = this.getRecomendacionLocal();
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

  getNivelLocal(): string {
    if (!this.imc || !this.fcReposo) return '';

    if (this.imc >= 18.5 && this.imc <= 25 && this.fcReposo < 60) return 'Atleta 🔥';
    if (this.imc < 25 && this.fcReposo <= 80) return 'Buen nivel 💪';
    if (this.imc < 30) return 'Mejorable ⚡';
    return 'Bajo rendimiento ⚠️';
  }

  getRecomendacionLocal(): string {
    if (!this.imc || !this.fcReposo) return '';

    if (this.imc < 18.5) return 'Aumenta tu ingesta calórica con alimentos nutritivos.';
    if (this.imc <= 25) return 'Mantén tu rutina actual y mejora progresivamente.';
    if (this.imc <= 30) return 'Combina cardio y fuerza para mejorar composición corporal.';
    return 'Enfócate en hábitos básicos: alimentación y ejercicio progresivo.';
  }

  get mensajeFcReposo(): string {
    if (!this.fcReposo) return '';
    if (this.fcReposo < 60) return 'Excelente capacidad cardiovascular 🔥';
    if (this.fcReposo <= 80) return 'Nivel saludable 👍';
    return 'Podrías mejorar tu resistencia ⚡';
  }
}
