import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ForumCategory {
  name: string;
  description: string;
  icon: string;
  posts: number;
  topics: number;
}

export interface ForumPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  time_ago: string;
  likes: number;
  replies: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  constructor(private api: ApiService) {}

  listCategories(): Observable<ForumCategory[]> {
    return this.api.get<ForumCategory[]>('/forum/categories');
  }

  listPosts(): Observable<ForumPost[]> {
    return this.api.get<ForumPost[]>('/forum/posts');
  }
}
