import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  fullName = '';
  age!: number;
  email = '';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  register() {
    if (!this.fullName || !this.age || !this.email || !this.password) {
      this.error = 'Completa todos los campos';
      return;
    }

    const created = this.auth.register(
      this.fullName,
      this.age,
      this.email,
      this.password
    );

    if (created) {
      this.router.navigate(['/app']);
    }
  }
}
