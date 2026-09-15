import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import StageCard from '@/Components/Common/StageCard';
import ListRow from '@/Components/Surfaces/ListRow';
import Results, { ResultList } from '@/Components/Surfaces/Results';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Stethoscope } from 'lucide-react';

export default function AdminSettings() {
    return (
        <>
            <Head title="Configuración" />
            <PageScreen
                header={
                    <PageHeader title="Configuración" description="Elegí qué configurar." />
                }
            >
                <StageCard>
                    <Results>
                        <ResultList>
                            <ListRow asChild>
                                <Link href="/admin/settings/specialties">
                                    <span className="flex min-w-0 items-center gap-[0.65rem]">
                                        <Stethoscope className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                                        <strong>Especialidades</strong>
                                    </span>
                                    <ChevronRight className="size-[1.05rem] shrink-0 text-ink-2" aria-hidden strokeWidth={2} />
                                </Link>
                            </ListRow>
                        </ResultList>
                    </Results>
                </StageCard>
            </PageScreen>
        </>
    );
}
