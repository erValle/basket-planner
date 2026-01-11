import { Injectable, signal, computed } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

/**
 * LoadingService provides a centralized way to manage loading states across the application.
 * Uses Angular signals for reactive state management.
 *
 * @example
 * // In a component:
 * export class MyComponent {
 *   private loading = inject(LoadingService);
 *
 *   async loadData() {
 *     this.loading.start('users');
 *     try {
 *       await this.api.getUsers();
 *     } finally {
 *       this.loading.stop('users');
 *     }
 *   }
 *
 *   isLoading = this.loading.isLoading('users');
 * }
 *
 * @example
 * // Using withLoading helper:
 * this.loading.withLoading('users', () => this.api.getUsers()).subscribe();
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  /**
   * Internal map of loading keys to their active count.
   * Using a count allows nested loading states for the same key.
   */
  private readonly loadingMap = signal<Map<string, number>>(new Map());

  /**
   * Global loading state - true if any loading operation is active.
   */
  readonly isAnyLoading = computed(() => {
    const map = this.loadingMap();
    return Array.from(map.values()).some((count) => count > 0);
  });

  /**
   * Number of active loading operations.
   */
  readonly activeCount = computed(() => {
    const map = this.loadingMap();
    return Array.from(map.values()).reduce((sum, count) => sum + count, 0);
  });

  /**
   * Starts a loading state for the given key.
   * @param key - Unique identifier for the loading state (e.g., 'users', 'planning')
   */
  start(key: string): void {
    this.loadingMap.update((map) => {
      const newMap = new Map(map);
      newMap.set(key, (newMap.get(key) ?? 0) + 1);
      return newMap;
    });
  }

  /**
   * Stops a loading state for the given key.
   * @param key - Unique identifier for the loading state
   */
  stop(key: string): void {
    this.loadingMap.update((map) => {
      const newMap = new Map(map);
      const current = newMap.get(key) ?? 0;
      if (current <= 1) {
        newMap.delete(key);
      } else {
        newMap.set(key, current - 1);
      }
      return newMap;
    });
  }

  /**
   * Creates a computed signal that returns true if the given key is loading.
   * @param key - Unique identifier for the loading state
   * @returns Computed signal of the loading state
   */
  isLoading(key: string) {
    return computed(() => {
      const map = this.loadingMap();
      return (map.get(key) ?? 0) > 0;
    });
  }

  /**
   * Resets all loading states. Useful for cleanup on logout or error recovery.
   */
  reset(): void {
    this.loadingMap.set(new Map());
  }

  /**
   * Wraps an Observable with loading state management.
   * Automatically starts loading before the request and stops after completion.
   *
   * @param key - Unique identifier for the loading state
   * @param observable$ - The observable to wrap
   * @returns The same observable with loading state side effects
   */
  withLoading<T>(key: string, observable$: Observable<T>): Observable<T> {
    return new Observable<T>((subscriber: Subscriber<T>) => {
      this.start(key);
      const subscription = observable$.subscribe({
        next: (value) => subscriber.next(value),
        error: (err) => {
          this.stop(key);
          subscriber.error(err);
        },
        complete: () => {
          this.stop(key);
          subscriber.complete();
        },
      });
      return () => {
        subscription.unsubscribe();
        this.stop(key);
      };
    });
  }
}
