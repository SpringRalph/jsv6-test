export interface Product {
  id: string
  title: string
  price: number
}

export interface CartState {
  product: Product
  quantity: number
}
