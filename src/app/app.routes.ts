import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

import { LayoutComponent } from './features/dashboard/layout/layout.component';

import { HealthComponent } from './features/health/health/health.component';
import { ExercisesComponent } from './features/exercises/exercises/exercises.component';
import { BlogComponent } from './features/blog/blog/blog.component';
import { ForumComponent } from './features/forum/forum/forum.component';
import { ParksComponent } from './features/parks/parks/parks.component';

import { HomeComponent } from './features/home/home/home.component';

import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [

  // 🌐 LANDING PÚBLICO
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    component: HomeComponent
  },

  // 🔐 AUTH
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // 📊 APP PRIVADA (DASHBOARD)
  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [

      // Dashboard inicial
      {
        path: '',
        component: HomeComponent
      },

      {
        path: 'health',
        component: HealthComponent
      },
      {
        path: 'exercises',
        component: ExercisesComponent
      },
      {
        path: 'blog',
        component: BlogComponent
      },
      {
        path: 'forum',
        component: ForumComponent
      },
      {
        path: 'parks',
        component: ParksComponent
      },
      {
  path: 'register',
  component: RegisterComponent
}
    ]
  },

  // 🔁 REDIRECCIONES LEGACY (opcional)
  {
    path: 'app/home',
    redirectTo: 'app',
    pathMatch: 'full'
  },
  {
    path: 'app/login',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'app/register',
    redirectTo: 'register',
    pathMatch: 'full'
  },

  // ❌ CUALQUIER RUTA NO EXISTENTE
  {
    path: '**',
    redirectTo: 'home'
  }
];
