import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forum',
  imports: [CommonModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.css',
})
export class ForumComponent {
  forumStats = {
    totalPosts: 1247,
    activeUsers: 89,
    totalTopics: 156
  };

  categories = [
    {
      name: 'Ejercicios y Rutinas',
      description: 'Comparte tus rutinas favoritas y pide consejos sobre ejercicios',
      icon: '🏃',
      posts: 423,
      topics: 67
    },
    {
      name: 'Nutrición y Alimentación',
      description: 'Discusiones sobre alimentación saludable para personas mayores',
      icon: '🥗',
      posts: 298,
      topics: 45
    },
    {
      name: 'Salud y Bienestar',
      description: 'Consejos sobre salud, prevención y bienestar general',
      icon: '❤️',
      posts: 356,
      topics: 52
    },
    {
      name: 'Motivación y Experiencias',
      description: 'Historias de éxito, motivación y experiencias personales',
      icon: '💪',
      posts: 170,
      topics: 28
    }
  ];

  recentPosts = [
    {
      id: 1,
      title: 'Mi rutina matutina de 15 minutos que cambió mi día',
      excerpt: 'Desde que empecé con estos ejercicios simples cada mañana, me siento con más energía...',
      author: 'María González',
      timeAgo: '2 horas',
      category: 'Ejercicios',
      likes: 12,
      replies: 5
    },
    {
      id: 2,
      title: '¿Recomendaciones para caminar con artritis?',
      excerpt: 'Tengo artritis en las rodillas y me gustaría empezar a caminar. ¿Algún consejo?',
      author: 'Carlos Rodríguez',
      timeAgo: '4 horas',
      category: 'Salud',
      likes: 8,
      replies: 12
    },
    {
      id: 3,
      title: 'Recetas fáciles y saludables para el desayuno',
      excerpt: 'Comparto algunas ideas de desayunos nutritivos que preparo en menos de 10 minutos...',
      author: 'Ana López',
      timeAgo: '6 horas',
      category: 'Nutrición',
      likes: 15,
      replies: 7
    },
    {
      id: 4,
      title: 'Cómo mantener la motivación después de los 70',
      excerpt: 'Después de varios intentos fallidos, finalmente encontré la manera de mantenerme motivada...',
      author: 'José Martínez',
      timeAgo: '1 día',
      category: 'Motivación',
      likes: 23,
      replies: 18
    }
  ];

  readPost(postId: number) {
    // TODO: Navigate to post detail
    console.log('Reading post:', postId);
  }
}

