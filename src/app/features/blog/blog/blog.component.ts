import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {

  mensaje = '';
  posts: any[] = [];

  publicar() {
    if (!this.mensaje.trim()) return;

    this.posts.unshift({
      texto: this.mensaje,
      fecha: new Date().toLocaleString()
    });

    this.mensaje = '';
  }
}
