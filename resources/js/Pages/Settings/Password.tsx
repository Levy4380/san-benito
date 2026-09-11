import { Head } from '@inertiajs/react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import UpdatePassword from '@/Components/Settings/update-password';

export default function Password() {
    return (
        <>
            <Head title="Contraseña" />
            <PageScreen
                header={
                    <PageHeader
                        title="Contraseña"
                        description="Cambiá la contraseña de tu cuenta."
                        backHref="/settings/profile"
                        backLabel="Mi perfil"
                    />
                }
            >
                <UpdatePassword heading={false} />
            </PageScreen>
        </>
    );
}
