import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExerciseService, Exercise } from '../../../core/services/exercise.service';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exercises.component.html',
  styleUrls: ['./exercises.component.css']
})
export class ExercisesComponent {

  filtroActivo = 'todos';
  ejercicios: Exercise[] = [];

  segmentos = [
    { nombre: 'piernas', label: 'Piernas', icono: '🦵' },
    { nombre: 'brazos', label: 'Brazos', icono: '💪' },
    { nombre: 'pecho', label: 'Pecho', icono: '🏋️' },
    { nombre: 'cardio', label: 'Cardio', icono: '❤️' }
  ];

  constructor(private exerciseService: ExerciseService) {}

  ngOnInit() {
    this.loadExercises();
  }

  loadExercises() {
    this.exerciseService.getExercises().subscribe({
      next: (items) => {
        console.log('✅ Datos desde backend:', items);
        this.ejercicios = items;
      },
      error: (err) => {
        console.warn('⚠️ Backend no disponible, usando mock');
        console.error(err);
        this.ejercicios = this.getMockExercises(); // 🔥 fallback
      }
    });
  }

  seleccionarFiltro(tipo: string) {
    this.filtroActivo = tipo;
  }

  get ejerciciosFiltrados() {
    if (this.filtroActivo === 'todos') return this.ejercicios;
    return this.ejercicios.filter(e => e.tipo === this.filtroActivo);
  }

  // 🔥 MOCK DATA
  getMockExercises(): Exercise[] {
    return [
      // PECHO
      {
        nombre: 'Flexiones',
        tipo: 'pecho',
        descripcion: 'Fortalece pecho, hombros y tríceps.',
        imagen: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e',
        parque: 'Simón Bolívar'
      },
      {
        nombre: 'Fondos en paralelas',
        tipo: 'pecho',
        descripcion: 'Excelente para pecho inferior.',
        imagen: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
        parque: 'Parque Nacional'
      },

      // PIERNAS
      {
        nombre: 'Sentadillas',
        tipo: 'piernas',
        descripcion: 'Ejercicio base para fuerza en piernas.',
        imagen: 'https://images.unsplash.com/photo-1594737625785-6f1a2c3d2b7e',
        parque: 'Simón Bolívar'
      },
      {
        nombre: 'Zancadas',
        tipo: 'piernas',
        descripcion: 'Mejora estabilidad y fuerza.',
        imagen: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba',
        parque: 'Parque Nacional'
      },

      // BRAZOS
      {
        nombre: 'Curl de bíceps',
        tipo: 'brazos',
        descripcion: 'Aísla el bíceps.',
        imagen: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61',
        parque: 'El Virrey'
      },
      {
        nombre: 'Fondos de tríceps',
        tipo: 'brazos',
        descripcion: 'Fortalece tríceps.',
        imagen: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a',
        parque: 'Parque de los Novios'
      },

      // CARDIO
      {
        nombre: 'Trote',
        tipo: 'cardio',
        descripcion: 'Mejora resistencia cardiovascular.',
        imagen: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5',
        parque: 'Simón Bolívar'
      },
      {
        nombre: 'Saltar cuerda',
        tipo: 'cardio',
        descripcion: 'Cardio intenso y coordinación.',
        imagen: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff',
        parque: 'Parque Nacional'
      }
    ];
  }
}
