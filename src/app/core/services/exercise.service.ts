import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Exercise {
  nombre: string;
  tipo: string;
  descripcion: string;
  imagen: string;
  parque: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {
  constructor(private api: ApiService) {}

  getExercises(): Observable<Exercise[]> {
    return this.api.get<Exercise[]>('/exercises');
  }
}
