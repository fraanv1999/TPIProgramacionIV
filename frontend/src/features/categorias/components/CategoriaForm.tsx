import { useForm } from '@tanstack/react-form'
import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Input, Textarea } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/format'
import type { Categoria, CategoriaCreate } from '../types'

interface CategoriaFormProps {
  inicial?: Categoria
  onSubmit: (valores: CategoriaCreate) => Promise<void>
  onCancel: () => void
  error: string | null
}

export function CategoriaForm({ inicial, onSubmit, onCancel, error }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      await onSubmit({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null })
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
          onChange: ({ value }) => {
            const v = value.trim()
            if (v.length < 2) return 'Mínimo 2 caracteres'
            if (v.length > 100) return 'Máximo 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            label="Nombre"
            autoFocus
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
            rows={3}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
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
              {inicial ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
