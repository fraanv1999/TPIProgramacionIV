import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { AlertaError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { fieldError } from '../../../shared/utils/format'
import { useAuthStore } from '../../../store/authStore'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const login = useAuthStore((s) => s.login)
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from ?? '/'
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        // Al quedar con usuario, el <Navigate> de abajo redirige.
        await login(value.username.trim(), value.password)
      } catch (e) {
        setError(handleApiError(e, 'No se pudo iniciar sesión'))
      }
    },
  })

  if (usuario) {
    const destino = from !== '/' ? from : usuario.role === 'admin' ? '/admin/resumen' : '/'
    return <Navigate to={destino} replace />
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Ingresar</h1>
        <p className="mb-6 text-sm text-stone-500">Accedé con tu usuario para hacer pedidos.</p>
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
            name="username"
            validators={{ onChange: ({ value }) => (!value.trim() ? 'Ingresá tu usuario' : undefined) }}
          >
            {(field) => (
              <Input
                label="Usuario"
                autoComplete="username"
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta)}
              />
            )}
          </form.Field>
          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (!value ? 'Ingresá tu contraseña' : undefined) }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
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
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
