import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiClient {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api';

    /**
     * Central point to handle API errors.
     * Keep it simple for now; later we can map to toast notifications.
     */
    private handleError(err: unknown) {
        if (err instanceof HttpErrorResponse) {
            // Try to extract the error message from various possible structures
            const errorMessage =
                err.error?.message || // Backend format: { error: 'CODE', message: '...' }
                err.error?.error?.message || // Structured error: { error: { message: ... } }
                err.message || // HTTP error message
                'Error desconocido';

            // Create an enhanced error object with status code
            const error = new Error(errorMessage);
            (error as any).status = err.status;
            (error as any).code = err.error?.error;
            return throwError(() => error);
        }
        return throwError(() => (err instanceof Error ? err : new Error('Error desconocido')));
    }

    /**
     * Constructs the full URL from the base URL and the provided path.
     * Removes the /api prefix if present since baseUrl already includes it.
     */
    private buildUrl(path: string): string {
        const cleanPath = path.startsWith('/api') ? path.slice(4) : path;
        return `${this.baseUrl}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    }

    get<T>(url: string, options?: object) {
        return this.http
            .get<T>(this.buildUrl(url), options)
            .pipe(catchError((e) => this.handleError(e)));
    }

    post<T>(url: string, body: unknown, options?: object) {
        return this.http
            .post<T>(this.buildUrl(url), body, options)
            .pipe(catchError((e) => this.handleError(e)));
    }

    put<T>(url: string, body: unknown, options?: object) {
        return this.http
            .put<T>(this.buildUrl(url), body, options)
            .pipe(catchError((e) => this.handleError(e)));
    }

    delete<T>(url: string, options?: object) {
        return this.http
            .delete<T>(this.buildUrl(url), options)
            .pipe(catchError((e) => this.handleError(e)));
    }
}
