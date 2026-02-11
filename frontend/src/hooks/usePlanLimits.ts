import { useAuth } from '../contexts/AuthContext';
import { PLANS } from '../pages/Pricing';

type Resource = 'properties' | 'bookingsPerMonth' | 'contacts';

const RESOURCE_LABELS: Record<Resource, string> = {
    properties: 'properties',
    bookingsPerMonth: 'bookings per month',
    contacts: 'CRM contacts',
};

export function usePlanLimits() {
    const { subscription, hasActivePlan } = useAuth();

    const planId = subscription?.plan_id || 'starter';
    const currentPlan = PLANS[planId as keyof typeof PLANS] || PLANS.starter;
    const limits = currentPlan.limits;

    /**
     * Check if adding one more resource would exceed the plan limit.
     * Returns { allowed, limit, label, planName } 
     */
    const canCreate = (resource: Resource, currentCount: number) => {
        const limit = limits[resource];
        if (limit === -1) return { allowed: true, limit: -1, label: '', planName: currentPlan.name };

        const allowed = currentCount < limit;
        return {
            allowed,
            limit,
            label: RESOURCE_LABELS[resource],
            planName: currentPlan.name,
            message: allowed
                ? ''
                : `You've reached the ${RESOURCE_LABELS[resource]} limit (${limit}) on the ${currentPlan.name} plan. Upgrade to add more.`,
        };
    };

    return {
        planId,
        planName: currentPlan.name,
        limits,
        hasActivePlan,
        canCreate,
        isFreePlan: currentPlan.isFree,
    };
}
