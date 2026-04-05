import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

// Set API URL globally for SSR
if (typeof global !== 'undefined') {
  (global as any).__API_URL__ = 'https://reactivate-back.onrender.com';
}

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;
