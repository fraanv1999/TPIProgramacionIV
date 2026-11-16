import { useForm } from '@tanstack/react-form'
import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Textarea } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/format'
import type { FormaPago } from '../types'
import { FORMAS_PAGO } from '../types'

export interface CheckoutValores {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string | null
}

interface CheckoutFormProps {
  onSubmit: (valores: CheckoutValores) => Promise<void>
  error: string | null
  deshabilitado?: boolean
}

const ETIQUETA_PAGO: Record<FormaPago, string> = {
  EFECTIVO: '💵 Efectivo',
  TRANSFERENCIA: '🏦 Transferencia',
}

export function CheckoutForm({ onSubmit, error, deshabilitado = false }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: async ({ value }) => {
      await onSubmit({
        direccion_entrega: value.direccion_entrega.trim(),
        forma_pago: value.forma_pago,
        notas: value.notas.trim() || null,
      })
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const v = value.trim()
            if (v.length < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (v.length > 200) return 'Máximo 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            label="Dirección de entrega"
            placeholder="Calle, número, piso, depto."
            autoComplete="street-address"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-stone-700">Forma de pago</legend>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGO.map((fp) => (
                <label
                  key={fp}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    field.state.value === fp ? 'border-brand-500 bg-brand-50 font-medium' : 'border-stone-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={fp}
                    checked={field.state.value === fp}
                    onChange={() => field.handleChange(fp)}
                    className="accent-brand-600"
                  />
                  {ETIQUETA_PAGO[fp]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{ onChange: ({ value }) => (value.length > 500 ? 'Máximo 500 caracteres' : undefined) }}
      >
        {(field) => (
          <Textarea
            label="Notas (opcional)"
            rows={3}
            placeholder="Ej.: tocar timbre 2B, sin cebolla…"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

      <AlertaError mensaje={error} />

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || deshabilitado} loading={isSubmitting}>
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
