export const TIER_QUOTAS = {
    free: {
        requestsPerMonth: 100,
        maxConcurrentRequests: 1,
        maxPageCount: 10,
        retentionDays: 7,
        priority: 1,
    },
    starter: {
        requestsPerMonth: 1000,
        maxConcurrentRequests: 3,
        maxPageCount: 50,
        retentionDays: 30,
        priority: 2,
    },
    pro: {
        requestsPerMonth: 10000,
        maxConcurrentRequests: 10,
        maxPageCount: 200,
        retentionDays: 90,
        priority: 3,
    },
    enterprise: {
        requestsPerMonth: 100000,
        maxConcurrentRequests: 50,
        maxPageCount: 1000,
        retentionDays: 365,
        priority: 4,
    },
};
