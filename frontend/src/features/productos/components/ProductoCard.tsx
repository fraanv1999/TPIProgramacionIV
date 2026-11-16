import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { formatPrecio } from '../../../shared/utils/format'
import { useCartStore } from '../../../store/cartStore'
import type { Producto } from '../types'
import { ProductoImagen } from './ProductoImagen'

export function ProductoCard({ producto }: { producto: Producto }) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)
  const [agregado, setAgregado] = useState(false)

  const sinStock = producto.stock <= 0
  const vendible = producto.disponible && !sinStock
  const alTope = enCarrito >= producto.stock

  const handleAgregar = () => {
    agregar(producto)
    setAgregado(true)
    window.setTimeout(() => setAgregado(false), 1200)
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative">
        <ProductoImagen src={producto.imagen_url} alt={producto.nombre} className="aspect-[4/3] w-full" />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700 shadow-sm">
          {producto.categoria.nombre}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-snug text-stone-900">{producto.nombre}</h3>
        {producto.descripcion && <p className="line-clamp-2 text-sm text-stone-500">{producto.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between pt-2">
          <p className="text-lg font-bold text-stone-900">{formatPrecio(producto.precio_base)}</p>
          <p className={`text-xs ${vendible ? 'text-stone-500' : 'font-medium text-red-600'}`}>
            {!producto.disponible ? 'No disponible' : sinStock ? 'Sin stock' : `Stock: ${producto.stock}`}
          </p>
        </div>
        <Button onClick={handleAgregar} disabled={!vendible || alTope} className="w-full">
          {agregado ? '✓ Agregado' : alTope && vendible ? 'Máximo en el carrito' : 'Agregar al carrito'}
        </Button>
        {enCarrito > 0 && <p className="text-center text-xs text-stone-500">En el carrito: {enCarrito}</p>}
      </div>
    </Card>
  )
}
