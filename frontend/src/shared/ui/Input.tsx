import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const controlBase =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-100'

function controlClass(error?: string): string {
  return `${controlBase} ${error ? 'border-red-400' : 'border-stone-300'}`
}

interface FieldWrapperProps {
  id: string
  label?: string
  error?: string
  hint?: string
  children: ReactNode
}

function FieldWrapper({ id, label, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <FieldWrapper id={inputId} label={label} error={error} hint={hint}>
      <input id={inputId} aria-invalid={!!error} className={`${controlClass(error)} ${className}`} {...props} />
    </FieldWrapper>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <FieldWrapper id={selectId} label={label} error={error}>
      <select id={selectId} aria-invalid={!!error} className={`${controlClass(error)} ${className}`} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <FieldWrapper id={areaId} label={label} error={error}>
      <textarea id={areaId} aria-invalid={!!error} className={`${controlClass(error)} ${className}`} {...props} />
    </FieldWrapper>
  )
}
