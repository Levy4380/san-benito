import { Head, useForm } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import PageHeader from '@/Components/Common/PageHeader';
import PageScreen from '@/Components/Common/PageScreen';
import { Btn } from '@/Components/Form/Btn';
import Field from '@/Components/Form/Field';
import ListRow from '@/Components/Surfaces/ListRow';
import NativeSelect from '@/Components/Form/NativeSelect';
import Surface from '@/Components/Surfaces/Surface';
import TextInput from '@/Components/Form/TextInput';

type StaffUser = {
    id: number;
    name: string;
    email: string;
    roles?: { name: string }[] | string[];
};

type Props = {
    users: StaffUser[];
};

export default function AdminUsers({ users }: Props) {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        role: 'admin',
    });

    return (
        <>
            <Head title="Usuarios" />
            <PageScreen header={<PageHeader title="Usuarios" description="Alta de admins. Solo super admin." />}>
                <Surface
                    as="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/admin/users');
                    }}
                >
                    <Field label="Nombre" htmlFor="name">
                        <TextInput id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required />
                    </Field>
                    <Field label="Correo" htmlFor="email">
                        <TextInput id="email" type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} required />
                    </Field>
                    <Field label="Contraseña" htmlFor="password">
                        <TextInput
                            id="password"
                            type="password"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                            required
                        />
                    </Field>
                    <Field label="Rol" htmlFor="role">
                        <NativeSelect id="role" value={form.data.role} onChange={(event) => form.setData('role', event.target.value)}>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super admin</option>
                        </NativeSelect>
                    </Field>
                    <Btn type="submit" disabled={form.processing}>
                        <UserPlus className="size-[1.05rem] shrink-0" aria-hidden strokeWidth={2} />
                        Crear usuario
                    </Btn>
                </Surface>
                <div className="mt-4">
                    {users.map((user) => (
                        <ListRow key={user.id}>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                        </ListRow>
                    ))}
                </div>
            </PageScreen>
        </>
    );
}
