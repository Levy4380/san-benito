import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const selectClassName =
    'border-input bg-background h-10 rounded-[var(--radius-input)] border px-2 font-mono text-sm';

type Time24InputProps = {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    'aria-label'?: string;
};

function parseTime(value: string): { hour: string; minute: string } {
    const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value.trim());

    if (!match) {
        return { hour: '', minute: '' };
    }

    return { hour: match[1], minute: match[2] };
}

/**
 * Time picker that always uses 24-hour HH:mm (native type="time" follows OS locale).
 */
export function Time24Input({
    id,
    value,
    onChange,
    required = false,
    disabled = false,
    className,
    'aria-label': ariaLabel,
}: Time24InputProps) {
    const { hour, minute } = parseTime(value);

    const emit = (nextHour: string, nextMinute: string) => {
        if (nextHour === '' && nextMinute === '') {
            onChange('');
            return;
        }

        if (nextHour === '' || nextMinute === '') {
            onChange('');
            return;
        }

        onChange(`${nextHour}:${nextMinute}`);
    };

    return (
        <div className={cn('flex items-center gap-1', className)} role="group" aria-label={ariaLabel}>
            <select
                id={id}
                className={selectClassName}
                value={hour}
                disabled={disabled}
                required={required}
                aria-label="Hora"
                onChange={(e) => {
                    const nextHour = e.target.value;
                    const nextMinute = minute === '' ? '00' : minute;
                    emit(nextHour, nextMinute);
                }}
            >
                <option value="">{required ? '—' : ''}</option>
                {HOURS.map((h) => (
                    <option key={h} value={h}>
                        {h}
                    </option>
                ))}
            </select>
            <span className="font-mono text-[var(--color-ink-2)]" aria-hidden>
                :
            </span>
            <select
                className={selectClassName}
                value={minute}
                disabled={disabled}
                required={required}
                aria-label="Minutos"
                onChange={(e) => {
                    const nextMinute = e.target.value;
                    const nextHour = hour === '' ? '00' : hour;
                    emit(nextHour, nextMinute);
                }}
            >
                <option value="">{required ? '—' : ''}</option>
                {MINUTES.map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </select>
        </div>
    );
}
