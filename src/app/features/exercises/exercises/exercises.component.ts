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
    this.exerciseService.getExercises().subscribe({
      next: (items) => this.ejercicios = items,
      error: (err) => console.error('No fue posible cargar ejercicios:', err)
    });
  }

  seleccionarFiltro(tipo: string) {
    this.filtroActivo = tipo;
  }

  get ejerciciosFiltrados() {
    if (this.filtroActivo === 'todos') return this.ejercicios;
    return this.ejercicios.filter(e => e.tipo === this.filtroActivo);
  }
}
