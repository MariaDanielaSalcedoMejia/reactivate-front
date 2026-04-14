import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BlogService, BlogPost } from '../../../core/services/blog.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  mensaje = '';
  titulo = '';
  posts: BlogPost[] = [];
  error = '';
  cargando = true;
  paginaActual = 1;
  itemsPorPagina = 6;

  categorias = [
    { id: 'todas', label: 'Todas las recetas' },
    { id: 'desayuno', label: '🍳 Desayuno' },
    { id: 'almuerzo', label: '🍲 Almuerzo' },
    { id: 'cena', label: '🍽️ Cena' },
    { id: 'snacks', label: '🥗 Snacks Saludables' }
  ];

  filtroCategoria = 'todas';

  constructor(
    private blogService: BlogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarPosts();
  }

  cargarPosts() {
    this.cargando = true;
    this.error = '';

    this.blogService.listPosts().subscribe({
      next: (posts) => {
        this.posts = posts.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (err) => {
        this.error = typeof err === 'string' ? err : 'No fue posible cargar las recetas';
        this.cargando = false;
      }
    });
  }

  publicar() {
    const user = this.authService.getUser();
    const authorEmail = user?.email || 'anonimo@user.com';

    if (!this.titulo.trim() || !this.mensaje.trim()) {
      this.error = 'Por favor completa el título y la descripción de la receta';
      return;
    }

    const recetaFormato = `
🍳 RECETA: ${this.titulo}

${this.mensaje}

👤 Compartida por: ${user?.email || 'usuario anónimo'}
    `.trim();

    this.blogService.createPost(this.titulo, recetaFormato, authorEmail).subscribe({
      next: (post) => {
        this.posts.unshift(post);
        this.mensaje = '';
        this.titulo = '';
        this.error = '';
      },
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible publicar la receta'
    });
  }

  seleccionarCategoria(cat: string) {
    this.filtroCategoria = cat;
    this.paginaActual = 1;
  }

  get postosFiltrados() {
    if (this.filtroCategoria === 'todas') {
      return this.posts;
    }
    return this.posts.filter(post =>
      post.title.toLowerCase().includes(this.filtroCategoria.toLowerCase()) ||
      post.content.toLowerCase().includes(this.filtroCategoria.toLowerCase())
    );
  }

  get postsPaginados() {
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    const end = start + this.itemsPorPagina;
    return this.postosFiltrados.slice(start, end);
  }

  get totalPaginas() {
    return Math.ceil(this.postosFiltrados.length / this.itemsPorPagina);
  }

  irAPagina(num: number) {
    if (num >= 1 && num <= this.totalPaginas) {
      this.paginaActual = num;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get paginasArray() {
    return Array(this.totalPaginas).fill(0).map((_, i) => i + 1);
  }
}
