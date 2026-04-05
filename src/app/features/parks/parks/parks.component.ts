import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParkService, Park } from '../../../core/services/park.service';

@Component({
  selector: 'app-parks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parks.component.html',
  styleUrl: './parks.component.css',
})
export class ParksComponent {
  parks: Park[] = [];
  error = '';

  constructor(private parkService: ParkService) {}

  ngOnInit() {
    this.parkService.getParks().subscribe({
      next: (parks) => this.parks = parks,
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible cargar los parques'
    });
  }

  goToPark(park: Park) {
    alert(`Navegando a ${park.name}... (implementa mapa real aquí)`);
  }
}
