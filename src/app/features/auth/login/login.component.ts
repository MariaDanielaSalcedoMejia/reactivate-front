import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule,  RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  password = '';
  error = '';

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/app']);
    }
  }

  login() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/app']),
      error: (err) => this.error = typeof err === 'string' ? err : 'Error al iniciar sesión'
    });
  }
}
