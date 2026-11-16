import { useForm } from '@tanstack/react-form'
import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Select, Textarea } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/format'
import type { Categoria } from '../../categorias/types'
import type { Producto, ProductoCreate } from '../types'

interface ProductoFormProps {
  inicial?: Producto
  categorias: Categoria[]
  onSubmit: (valores: ProductoCreate) => Promise<void>
  onCancel: () => void
  error: string | null
}

export function ProductoForm({ inicial, categorias, onSubmit, onCancel, error }: ProductoFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio_base: inicial?.precio_base ?? 0,
      imagen_url: inicial?.imagen_url ?? '',
      stock: inicial?.stock ?? 0,
      disponible: inicial?.disponible ?? true,
      categoria_id: inicial?.categoria_id ?? categorias[0]?.id ?? 0,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: value.precio_base,
        imagen_url: value.imagen_url.trim() || null,
        stock: value.stock,
        disponible: value.disponible,
        categoria_id: value.categoria_id,
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
        name="nombre"
        validators={{
          onChange: ({ value }) =>
            !value.trim() ? 'El nombre es obligatorio' : value.length > 150 ? 'Máximo 150 caracteres' : undefined,
        }}
      >
        {(field) => (
          <Input
            label="Nombre"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="descripcion">
        {(field) => (
          <Textarea
            label="Descripción"
            rows={2}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) => (Number.isNaN(value) ? 'Ingresá un precio' : value < 0 ? 'Debe ser ≥ 0' : undefined),
          }}
        >
          {(field) => (
            <Input
              label="Precio"
              type="number"
              min={0}
              step="0.01"
              value={Number.isNaN(field.state.value) ? '' : field.state.value}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta)}
            />
          )}
        </form.Field>
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
              value={Number.isNaN(field.state.value) ? '' : field.state.value}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (!value ? 'Elegí una categoría' : undefined) }}
      >
        {(field) => (
          <Select
            label="Categoría"
            value={field.state.value || ''}
            onChange={(e) => field.handleChange(Number(e.target.value))}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta)}
          >
            <option value="">Seleccionar…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field name="imagen_url">
        {(field) => (
          <Input
            label="URL de la imagen"
            type="url"
            placeholder="https://…"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
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
              {inicial ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
