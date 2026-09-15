import type { Specialty } from '@/types';

export function specialtyNames(specialties: Specialty[] | undefined): string {
    return (specialties ?? []).map((specialty) => specialty.name).join(' · ');
}
