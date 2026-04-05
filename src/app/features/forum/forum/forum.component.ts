import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService, ForumCategory, ForumPost } from '../../../core/services/forum.service';

@Component({
  selector: 'app-forum',
  imports: [CommonModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.css',
})
export class ForumComponent {
  forumStats = {
    totalPosts: 0,
    activeUsers: 0,
    totalTopics: 0
  };

  categories: ForumCategory[] = [];
  recentPosts: ForumPost[] = [];
  error = '';

  constructor(private forumService: ForumService) {}

  ngOnInit() {
    this.loadContent();
  }

  loadContent() {
    this.forumService.listCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.forumStats.totalTopics = categories.length;
      },
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible cargar las categorías'
    });

    this.forumService.listPosts().subscribe({
      next: (posts) => {
        this.recentPosts = posts;
        this.forumStats.totalPosts = posts.length;
      },
      error: (err) => this.error = typeof err === 'string' ? err : 'No fue posible cargar los posts'
    });
  }

  readPost(postId: number) {
    console.log('Reading post:', postId);
  }
}

