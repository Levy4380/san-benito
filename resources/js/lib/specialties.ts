import type { HealthInsurance, Specialty } from '@/types';

export function specialtyNames(specialties: Specialty[] | undefined): string {
    return (specialties ?? []).map((specialty) => specialty.name).join(' · ');
}

export function coverageNames(healthInsurances: HealthInsurance[] | undefined): string {
    return ['Particular', ...(healthInsurances ?? []).map((healthInsurance) => healthInsurance.name)].join(' · ');
}
