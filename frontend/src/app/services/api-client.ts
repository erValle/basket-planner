import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  /**
   * Central point to handle API errors.
   * Keep it simple for now; later we can map to toast notifications.
   */
  private handleError(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      return throwError(() => new Error(err.error?.message ?? err.message));
    }
    return throwError(() => (err instanceof Error ? err : new Error('Unknown API error')));
  }

  get<T>(url: string, options?: object) {
    return this.http.get<T>(url, options).pipe(catchError((e) => this.handleError(e)));
  }

  post<T>(url: string, body: unknown, options?: object) {
    return this.http.post<T>(url, body, options).pipe(catchError((e) => this.handleError(e)));
  }

  put<T>(url: string, body: unknown, options?: object) {
    return this.http.put<T>(url, body, options).pipe(catchError((e) => this.handleError(e)));
  }

  delete<T>(url: string, options?: object) {
    return this.http.delete<T>(url, options).pipe(catchError((e) => this.handleError(e)));
  }
}
