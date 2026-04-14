import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExerciseService, Exercise } from '../../../core/services/exercise.service';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exercises.component.html',
  styleUrls: ['./exercises.component.css']
})
export class ExercisesComponent implements OnInit {
  filtroActivo = 'todos';
  ejercicios: Exercise[] = [];
  cargando = true;
  error = '';
  pagina = 1;
  itemsPorPagina = 15;

  segmentos = [
    { nombre: 'piernas', label: 'Piernas', icono: '🦵', cantidad: 0 },
    { nombre: 'brazos', label: 'Brazos', icono: '💪', cantidad: 0 },
    { nombre: 'pecho', label: 'Pecho', icono: '🏋️', cantidad: 0 },
    { nombre: 'cardio', label: 'Cardio', icono: '❤️', cantidad: 0 }
  ];

  // Imágenes de segmento corporal para mostrar en header
  segmentoImagenes = {
    piernas: 'https://via.placeholder.com/400x200?text=PIERNAS&bg=3498db&color=fff',
    brazos: 'https://via.placeholder.com/400x200?text=BRAZOS&bg=e74c3c&color=fff',
    pecho: 'https://via.placeholder.com/400x200?text=PECHO&bg=f39c12&color=fff',
    cardio: 'https://via.placeholder.com/400x200?text=CARDIO&bg=27ae60&color=fff',
    todos: 'https://via.placeholder.com/400x200?text=TODOS+LOS+EJERCICIOS&bg=9b59b6&color=fff'
  };

  constructor(private exerciseService: ExerciseService) {}

  ngOnInit() {
    this.cargarEjercicios();
  }

  cargarEjercicios() {
    this.cargando = true;
    this.error = '';

    this.exerciseService.getExercises().subscribe({
      next: (items) => {
        this.ejercicios = items;
        this.actualizarCantidades();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando ejercicios:', err);
        this.error = 'No fue posible cargar los ejercicios. Intenta más tarde.';
        this.cargando = false;
      }
    });
  }

  actualizarCantidades() {
    this.segmentos.forEach(seg => {
      seg.cantidad = this.ejercicios.filter(e => e.tipo === seg.nombre).length;
    });
  }

  seleccionarFiltro(tipo: string) {
    this.filtroActivo = tipo;
    this.pagina = 1; // Reset pagina
  }

  get ejerciciosFiltrados() {
    if (this.filtroActivo === 'todos') {
      return this.ejercicios;
    }
    return this.ejercicios.filter(e => e.tipo === this.filtroActivo);
  }

  get ejerciciosAMostrar() {
    const start = (this.pagina - 1) * this.itemsPorPagina;
    const end = start + this.itemsPorPagina;
    return this.ejerciciosFiltrados.slice(start, end);
  }

  get totalPaginas() {
    return Math.ceil(this.ejerciciosFiltrados.length / this.itemsPorPagina);
  }

  get paginasArray() {
    return Array(this.totalPaginas).fill(0).map((_, i) => i + 1);
  }

  irAPagina(num: number) {
    if (num >= 1 && num <= this.totalPaginas) {
      this.pagina = num;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  paginaSiguiente() {
    this.irAPagina(this.pagina + 1);
  }

  paginaAnterior() {
    this.irAPagina(this.pagina - 1);
  }

  get imagenSegmento() {
    return this.segmentoImagenes[this.filtroActivo as keyof typeof this.segmentoImagenes] || this.segmentoImagenes.todos;
  }

  get labelSegmento() {
    if (this.filtroActivo === 'todos') return 'TODOS LOS EJERCICIOS';
    const seg = this.segmentos.find(s => s.nombre === this.filtroActivo);
    return seg?.label?.toUpperCase() || 'EJERCICIOS';
  }

  verDetalles(e: Event) {
    e.preventDefault();
    // Aquí puedes agregar una funcionalidad para ver detalles del ejercicio
    // Por ejemplo: modal, nueva página, etc.
    console.log('Detalles del ejercicio');
  }
}
