import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartItem {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  imagen_url: string | null
  /** Stock conocido al agregar; limita la cantidad en el carrito. */
  stock: number
}

export type ProductoParaCarrito = Pick<CartItem, 'nombre' | 'imagen_url' | 'stock'> & {
  id: number
  precio_base: number
}

interface CartState {
  items: CartItem[]
  agregar: (producto: ProductoParaCarrito, cantidad?: number) => void
  quitar: (producto_id: number) => void
  cambiarCantidad: (producto_id: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
  cantidadItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((i) => i.producto_id === producto.id)
          if (existente) {
            return {
              items: state.items.map((i) =>
                i.producto_id === producto.id
                  ? {
                      ...i,
                      stock: producto.stock,
                      precio_unitario: producto.precio_base,
                      cantidad: Math.min(i.cantidad + cantidad, producto.stock),
                    }
                  : i,
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: producto.precio_base,
                imagen_url: producto.imagen_url,
                stock: producto.stock,
                cantidad: Math.min(cantidad, producto.stock),
              },
            ],
          }
        }),

      quitar: (producto_id) =>
        set((state) => ({ items: state.items.filter((i) => i.producto_id !== producto_id) })),

      cambiarCantidad: (producto_id, cantidad) =>
        set((state) => ({
          items:
            cantidad <= 0
              ? state.items.filter((i) => i.producto_id !== producto_id)
              : state.items.map((i) =>
                  i.producto_id === producto_id
                    ? { ...i, cantidad: Math.min(cantidad, i.stock) }
                    : i,
                ),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0),

      cantidadItems: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    {
      name: 'foodstore-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
