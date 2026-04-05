import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Park {
  name: string;
  address: string;
  rating: number;
  distance: string;
  features: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ParkService {
  constructor(private api: ApiService) {}

  getParks(): Observable<Park[]> {
    return this.api.get<Park[]>('/parks');
  }
}
