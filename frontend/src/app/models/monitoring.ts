export type MonitoringRange = {
    from: Date | null;
    to: Date | null;
};

export type MonitoringBackendKpis = {
    totalActions: number;
    actionsPerDay: number;
    errorRatePct: number;
};

export type MonitoringRecommenderKpis = {
    activeVersion: string;
    lastRunAt: string; // ISO string for now (stub)
    techCost: 'low' | 'medium' | 'high';
    cpuPct: number;
    ramPct: number;
};

export type MonitoringExportKpis = {
    exportsPerDay: number;
    failuresPerDay: number;
};

export type MonitoringOverview = {
    backend: MonitoringBackendKpis;
    recommender: MonitoringRecommenderKpis;
    exports: MonitoringExportKpis;
};
