import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { ApiClient } from './api-client';
import {
    RecommenderJob,
    RecommenderListVersionsResponse,
    RecommenderStatus,
    RecommenderTrainPayload,
    RecommenderVersionListItem,
    SuggestGoalsRequest,
    SuggestGoalsResponse,
} from '../models/recommender';

@Injectable({ providedIn: 'root' })
export class RecommenderApiService {
    private readonly api = inject(ApiClient);

    getStatus() {
        return this.api.get<RecommenderStatus>('/api/recommender/status').pipe(map((res) => res));
    }

    train(payload: RecommenderTrainPayload) {
        return this.api
            .post<{ jobId: string }>('/api/recommender/train', payload)
            .pipe(map((res) => res));
    }

    getJob(jobId: string) {
        return this.api
            .get<RecommenderJob>(`/api/recommender/jobs/${encodeURIComponent(jobId)}`)
            .pipe(map((res) => res));
    }

    listVersions() {
        return this.api
            .get<RecommenderListVersionsResponse>('/api/recommender/versions')
            .pipe(map((res) => res));
    }

    activate(versionId: string) {
        return this.api
            .post<{
                ok: true;
            }>(`/api/recommender/versions/${encodeURIComponent(versionId)}/activate`, {})
            .pipe(map((res) => res ?? { ok: true as const }));
    }

    suggestGoals(request: SuggestGoalsRequest = {}) {
        return this.api
            .post<SuggestGoalsResponse>('/api/recommender/suggest-goals', request)
            .pipe(map((res) => res));
    }
}
