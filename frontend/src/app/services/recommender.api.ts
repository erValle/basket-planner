import { inject, Injectable } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { ApiClient } from './api-client';
import {
  RecommenderJob,
  RecommenderListVersionsResponse,
  RecommenderStatus,
  RecommenderTrainPayload,
  RecommenderVersionListItem,
} from '../models/recommender';

@Injectable({ providedIn: 'root' })
export class RecommenderApiService {
  private readonly api = inject(ApiClient);

  getStatus() {
    return this.api.get<RecommenderStatus>('/api/recommender/status').pipe(
      map((res) => res ?? this.mockStatus()),
      catchError(() => of(this.mockStatus()))
    );
  }

  train(payload: RecommenderTrainPayload) {
    return this.api.post<{ jobId: string }>('/api/recommender/train', payload).pipe(
      map((res) => res ?? { jobId: this.mockJob().id }),
      catchError(() => of({ jobId: this.mockJob().id }))
    );
  }

  getJob(jobId: string) {
    return this.api.get<RecommenderJob>(`/api/recommender/jobs/${encodeURIComponent(jobId)}`).pipe(
      map((res) => res ?? this.mockJob(jobId)),
      catchError(() => of(this.mockJob(jobId)))
    );
  }

  listVersions() {
    return this.api.get<RecommenderListVersionsResponse>('/api/recommender/versions').pipe(
      map((res) => res ?? { items: this.mockVersions() }),
      catchError(() => of({ items: this.mockVersions() }))
    );
  }

  activate(versionId: string) {
    return this.api.post<{ ok: true }>(`/api/recommender/versions/${encodeURIComponent(versionId)}/activate`, {}).pipe(
      map((res) => res ?? { ok: true as const }),
      catchError(() => of({ ok: true as const }))
    );
  }

  private mockStatus(): RecommenderStatus {
    return {
      activeVersion: 'rec-1.4.2',
      trainedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      metrics: {
        accuracy: 0.82,
        coverage: 0.74,
        latencyMs: 38,
      },
      techCost: 'medium',
    };
  }

  private mockJob(jobId?: string): RecommenderJob {
    const id = jobId ?? `job-${Math.random().toString(16).slice(2, 8)}`;
    return {
      id,
      status: 'SUCCESS',
      startedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      finishedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      logs: [
        `[${new Date(Date.now() - 1000 * 60 * 8).toISOString()}] Queuing job…`,
        `[${new Date(Date.now() - 1000 * 60 * 7).toISOString()}] Loading dataset…`,
        `[${new Date(Date.now() - 1000 * 60 * 5).toISOString()}] Training model…`,
        `[${new Date(Date.now() - 1000 * 60 * 3).toISOString()}] Evaluating metrics…`,
        `[${new Date(Date.now() - 1000 * 60 * 2).toISOString()}] Done.`,
      ].join('\n'),
      resultVersionId: 'rec-1.4.3',
    };
  }

  private mockVersions(): RecommenderVersionListItem[] {
    return [
      {
        id: 'rec-1.4.2',
        createdAt: '2025-12-20',
        trainedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        algorithm: 'xgboost',
        metrics: { accuracy: 0.82, coverage: 0.74, latencyMs: 38 },
        techCost: 'medium',
        isActive: true,
      },
      {
        id: 'rec-1.4.1',
        createdAt: '2025-12-10',
        trainedAt: '2025-12-10T08:00:00.000Z',
        algorithm: 'xgboost',
        metrics: { accuracy: 0.8, coverage: 0.7, latencyMs: 40 },
        techCost: 'medium',
        isActive: false,
      },
      {
        id: 'rec-1.3.9',
        createdAt: '2025-11-22',
        trainedAt: '2025-11-22T09:30:00.000Z',
        algorithm: 'baseline',
        metrics: { accuracy: 0.72, coverage: 0.62, latencyMs: 28 },
        techCost: 'low',
        isActive: false,
      },
    ];
  }
}
