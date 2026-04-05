import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  constructor(private api: ApiService) {}

  listPosts(): Observable<BlogPost[]> {
    return this.api.get<BlogPost[]>('/blog/posts');
  }

  createPost(title: string, content: string, authorEmail: string): Observable<BlogPost> {
    return this.api.post<BlogPost>('/blog/posts', {
      title,
      content,
      author_email: authorEmail
    });
  }
}
