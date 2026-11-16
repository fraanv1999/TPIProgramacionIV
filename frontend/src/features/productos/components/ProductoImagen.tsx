import { useState } from 'react'

interface ProductoImagenProps {
  src: string | null
  alt: string
  className?: string
}

/** Imagen del producto con un placeholder si no hay URL o si falla la carga. */
export function ProductoImagen({ src, alt, className = '' }: ProductoImagenProps) {
  const [fallo, setFallo] = useState(false)
  if (!src || fallo) {
    return (
      <div className={`flex items-center justify-center bg-brand-50 text-4xl ${className}`} aria-label={alt} role="img">
        🍽️
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFallo(true)} className={`object-cover ${className}`} />
}
