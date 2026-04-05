import { Component } from '@angular/core';
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
export class BlogComponent {
  mensaje = '';
  posts: BlogPost[] = [];
  error = '';

  constructor(
    private blogService: BlogService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.blogService.listPosts().subscribe({
      next: (posts) => this.posts = posts,
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible cargar el blog'
    });
  }

  publicar() {
    const user = this.authService.getUser();
    const authorEmail = user?.email || 'unknown@user.com';
    if (!this.mensaje.trim()) return;

    this.blogService.createPost(`Publicación de ${authorEmail}`, this.mensaje, authorEmail).subscribe({
      next: (post) => {
        this.posts.unshift(post);
        this.mensaje = '';
      },
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible publicar'
    });
  }
}
