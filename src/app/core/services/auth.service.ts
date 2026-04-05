import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // 🔐 LOGIN
  login(email: string) {
    if (this.isBrowser()) {
      localStorage.setItem('user', email);
    }
  }

  // 📝 REGISTER
  register(name: string, age: number, email: string, password: string): boolean {
    if (!this.isBrowser()) return false;

    const user = {
      name,
      age,
      email,
      password
    };

    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('user', email);

    return true;
  }

  // 🔍 VALIDAR SESIÓN
  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem('user');
  }

  // 👤 OBTENER USUARIO
  getUser() {
    if (!this.isBrowser()) return null;

    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  // 🚪 LOGOUT
  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
    }
  }
}
