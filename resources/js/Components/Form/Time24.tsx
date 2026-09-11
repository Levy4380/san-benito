import NativeSelect from '@/Components/Form/NativeSelect';
import { FormEvent, useEffect, useId, useState } from 'react';

type Props = {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    blank?: boolean;
};

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

const timeSelectClass = 'w-auto min-w-[4.25rem] font-mono tabular-nums';

export default function Time24({ value, onChange, id, blank = false }: Props) {
    const autoId = useId();
    const baseId = id ?? autoId;
    const [hour, minute] = (value || '').split(':');
    const hourOptions = blank ? ['', ...hours] : hours;
    const minuteOptions = blank ? ['', ...minutes] : minutes;

    return (
        <div className="inline-flex h-[var(--control-h)] max-w-full items-center gap-[0.35rem]">
            <NativeSelect
                id={`${baseId}-h`}
                aria-label="Hora (0–23)"
                className={timeSelectClass}
                value={hour ?? ''}
                onChange={(event: FormEvent<HTMLSelectElement>) => {
                    const nextHour = event.currentTarget.value;
                    const nextMinute = minute || (blank ? '' : '00');
                    onChange(nextHour && nextMinute ? `${nextHour}:${nextMinute}` : '');
                }}
            >
                {hourOptions.map((option) => (
                    <option key={option || 'blank-h'} value={option}>
                        {option === '' ? '—' : option}
                    </option>
                ))}
            </NativeSelect>
            <span className="font-mono font-semibold leading-none text-ink-2" aria-hidden="true">
                :
            </span>
            <NativeSelect
                id={`${baseId}-m`}
                aria-label="Minutos"
                className={timeSelectClass}
                value={minute ?? ''}
                onChange={(event: FormEvent<HTMLSelectElement>) => {
                    const nextMinute = event.currentTarget.value;
                    const nextHour = hour || (blank ? '' : '00');
                    onChange(nextHour && nextMinute ? `${nextHour}:${nextMinute}` : '');
                }}
            >
                {minuteOptions.map((option) => (
                    <option key={option || 'blank-m'} value={option}>
                        {option === '' ? '—' : option}
                    </option>
                ))}
            </NativeSelect>
        </div>
    );
}

export function Time24State(initial: string) {
    const [value, setValue] = useState(initial);
    useEffect(() => setValue(initial), [initial]);
    return [value, setValue] as const;
}
