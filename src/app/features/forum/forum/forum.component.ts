import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForumService, ForumCategory, ForumPost } from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forum',
  imports: [CommonModule, FormsModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.css',
})
export class ForumComponent implements OnInit {
  forumStats = {
    totalPosts: 0,
    activeUsers: 0,
    totalTopics: 0
  };

  categories: ForumCategory[] = [];
  recentPosts: ForumPost[] = [];
  error = '';
  cargando = true;

  // Para crear nuevo post
  mostrarFormularioNuevo = false;
  nuevoPostTitulo = '';
  nuevoPostContenido = '';
  categoriaSeleccionada = 'general';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 8;

  constructor(
    private forumService: ForumService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarContenido();
  }

  cargarContenido() {
    this.cargando = true;
    this.error = '';

    this.forumService.listCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.forumStats.totalTopics = categories.length;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = typeof err === 'string' ? err : 'No fue posible cargar las categorías';
      }
    });

    this.forumService.listPosts().subscribe({
      next: (posts) => {
        this.recentPosts = posts;
        this.forumStats.totalPosts = posts.length;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.error = typeof err === 'string' ? err : 'No fue posible cargar los posts';
        this.cargando = false;
      }
    });
  }

  crearNuevoPost() {
    if (!this.nuevoPostTitulo.trim() || !this.nuevoPostContenido.trim()) {
      this.error = 'Por favor completa el título y contenido del post';
      return;
    }

    const user = this.authService.getUser();
    const autor = user?.email || 'Anónimo';

    // Simular creación de post (se podría expandir con servicio real)
    const nuevoPost: ForumPost = {
      id: this.recentPosts.length + 1,
      title: this.nuevoPostTitulo,
      excerpt: this.nuevoPostContenido.substring(0, 100) + '...',
      category: this.categoriaSeleccionada,
      author: autor,
      time_ago: 'ahora',
      likes: 0,
      replies: 0
    };

    this.recentPosts.unshift(nuevoPost);
    this.forumStats.totalPosts++;

    // Limpiar formulario
    this.nuevoPostTitulo = '';
    this.nuevoPostContenido = '';
    this.mostrarFormularioNuevo = false;
    this.error = '';
  }

  toggleFormulario() {
    this.mostrarFormularioNuevo = !this.mostrarFormularioNuevo;
    this.error = '';
  }

  readPost(postId: number) {
    console.log('Reading post:', postId);
    // Aquí se podría expandir para mostrar detalles completos del post
  }

  get postsAMostrar() {
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    const end = start + this.itemsPorPagina;
    return this.recentPosts.slice(start, end);
  }

  get totalPaginas() {
    return Math.ceil(this.recentPosts.length / this.itemsPorPagina);
  }

  irAPagina(num: number) {
    if (num >= 1 && num <= this.totalPaginas) {
      this.paginaActual = num;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getCategoryIcon(category: string): string {
    const icons: any = {
      general: '💬',
      entrenamientos: '🏋️',
      nutricion: '🥗',
      motivacion: '💪',
      lesiones: '⚕️'
    };
    return icons[category] || '💬';
  }

  get paginasArray() {
    return Array(this.totalPaginas).fill(0).map((_, i) => i + 1);
  }
}

