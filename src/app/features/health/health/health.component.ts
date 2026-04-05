import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.css']
})
export class HealthComponent {

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

  calcular() {

    if (!this.edad || !this.peso || !this.altura || !this.fcReposo) {
      alert('Completa todos los campos');
      return;
    }

    const alturaM = this.altura / 100;
    this.imc = this.peso / (alturaM * alturaM);

    // IMC categoría
    if (this.imc < 18.5) this.imcCategoria = 'Bajo peso';
    else if (this.imc < 25) this.imcCategoria = 'Óptimo';
    else if (this.imc < 30) this.imcCategoria = 'Sobrepeso';
    else this.imcCategoria = 'Obesidad';

    // FC
    this.fcMax = 220 - this.edad;
    this.reserva = this.fcMax - this.fcReposo;

    // Zonas
    this.zonas = [
      { nombre: 'Recuperación', min: this.fcReposo + this.reserva * 0.5, max: this.fcReposo + this.reserva * 0.6, porcentaje: 50 },
      { nombre: 'Aeróbica', min: this.fcReposo + this.reserva * 0.6, max: this.fcReposo + this.reserva * 0.7, porcentaje: 65 },
      { nombre: 'Rendimiento', min: this.fcReposo + this.reserva * 0.7, max: this.fcReposo + this.reserva * 0.85, porcentaje: 80 }
    ].map(z => ({
      ...z,
      min: Math.round(z.min),
      max: Math.round(z.max)
    }));

    this.calcularScore();
    this.generarRecomendacion();
  }

  calcularScore() {
    let score = 100;

    // Penalización IMC
    if (this.imc! < 18.5 || this.imc! > 30) score -= 30;
    else if (this.imc! > 25) score -= 15;

    // FC reposo (clave fitness)
    if (this.fcReposo! > 80) score -= 30;
    else if (this.fcReposo! > 70) score -= 15;

    this.score = Math.max(0, score);

    // Nivel
    if (this.score >= 85) this.nivel = 'Atleta 🔥';
    else if (this.score >= 70) this.nivel = 'Buen nivel 💪';
    else if (this.score >= 50) this.nivel = 'Mejorable ⚡';
    else this.nivel = 'Bajo rendimiento ⚠️';
  }

  generarRecomendacion() {
    if (this.score >= 85) {
      this.recomendacion = 'Estás en un nivel excelente. Mantén tu rutina y cuida la recuperación.';
    } else if (this.score >= 70) {
      this.recomendacion = 'Buen estado físico. Puedes mejorar con entrenamientos más estructurados.';
    } else if (this.score >= 50) {
      this.recomendacion = 'Necesitas mejorar resistencia y composición corporal.';
    } else {
      this.recomendacion = 'Enfócate en hábitos básicos: descanso, alimentación y ejercicio progresivo.';
    }
  }


  get mensajeFcReposo(): string {
    if (!this.fcReposo) return '';
    if (this.fcReposo < 60) return 'Excelente capacidad cardiovascular 🔥';
    if (this.fcReposo <= 80) return 'Nivel saludable 👍';
    return 'Podrías mejorar tu resistencia ⚡';
  }
}
