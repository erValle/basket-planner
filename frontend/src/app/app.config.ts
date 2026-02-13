import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { MessageService } from 'primeng/api';

import { routes } from './app.routes';

import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideAnimations(),
        MessageService,
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideRouter(routes),
    ],
};
