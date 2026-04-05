import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Set API URL globally
(window as any).__API_URL__ = import.meta.env['VITE_API_URL'] || 'https://reactivate-back.onrender.com';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
