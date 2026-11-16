import { useForm } from '@tanstack/react-form'
import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/format'
import type { Producto, ProductoStockUpdate } from '../types'

interface StockFormProps {
  producto: Producto
  onSubmit: (valores: ProductoStockUpdate) => Promise<void>
  onCancel: () => void
  error: string | null
}

/** Cambio rápido de stock y disponibilidad (PATCH /productos/{id}/stock). */
export function StockForm({ producto, onSubmit, onCancel, error }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: producto.stock, disponible: producto.disponible },
    onSubmit: async ({ value }) => {
      await onSubmit({ stock: value.stock, disponible: value.disponible })
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
      <p className="text-sm text-stone-600">
        Producto: <strong>{producto.nombre}</strong>
      </p>
      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) =>
            Number.isNaN(value) || !Number.isInteger(value) ? 'Entero requerido' : value < 0 ? 'Debe ser ≥ 0' : undefined,
        }}
      >
        {(field) => (
          <Input
            label="Stock"
            type="number"
            min={0}
            step={1}
            autoFocus
            value={Number.isNaN(field.state.value) ? '' : field.state.value}
            onChange={(e) => field.handleChange(e.target.valueAsNumber)}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>
      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      <AlertaError mensaje={error} />

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
