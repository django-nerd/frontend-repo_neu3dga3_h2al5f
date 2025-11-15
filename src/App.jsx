import { useEffect, useMemo, useState } from 'react'

function classNames(...args) {
  return args.filter(Boolean).join(' ')
}

function App() {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState({}) // id -> {product, quantity}
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutResult, setCheckoutResult] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', address: '' })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts(q = '') {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/katanas${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data.items || [])
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function seedProducts() {
    const samples = [
      {
        name: 'Hattori Classic',
        description: 'Elegant, balanced, and razor-sharp. Perfect for display or practice.',
        steel: '1095 High Carbon',
        blade_length_cm: 72,
        price: 499,
        stock: 8,
        rating: 4.8,
        images: []
      },
      {
        name: 'Kage Shadow',
        description: 'Matte black finish with full tang construction for durability.',
        steel: 'T10 Tool Steel',
        blade_length_cm: 73.5,
        price: 629,
        stock: 5,
        rating: 4.7,
        images: []
      },
      {
        name: 'Tsuru Crane',
        description: 'Hand-polished hamon with ornate tsuka-ito wrap.',
        steel: 'Folded Damascus',
        blade_length_cm: 71,
        price: 899,
        stock: 3,
        rating: 4.9,
        images: []
      }
    ]
    try {
      setLoading(true)
      for (const s of samples) {
        await fetch(`${BASE_URL}/api/katanas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        })
      }
      await fetchProducts()
    } catch (e) {
      setError('Failed to seed products')
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product, quantity = 1) {
    setCart(prev => {
      const existing = prev[product._id]
      const q = (existing?.quantity || 0) + quantity
      return { ...prev, [product._id]: { product, quantity: q } }
    })
    setCartOpen(true)
  }

  function removeFromCart(id) {
    setCart(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  const cartItems = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems])
  const cartTotal = useMemo(() => cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0), [cartItems])

  async function handleCheckout(e) {
    e.preventDefault()
    if (!cartItems.length) return
    setCheckingOut(true)
    setCheckoutResult(null)
    try {
      const payload = {
        customer_name: form.name,
        customer_email: form.email,
        address: form.address,
        items: cartItems.map(ci => ({ product_id: ci.product._id, quantity: ci.quantity }))
      }
      const res = await fetch(`${BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Checkout failed')
      setCheckoutResult({ ok: true, orderId: data.order_id, total: data.total })
      setCart({})
    } catch (e) {
      setCheckoutResult({ ok: false, error: e.message })
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-20 backdrop-blur bg-slate-900/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-indigo-500/20 text-indigo-300 font-bold">刀</span>
            <span className="text-xl font-semibold">Katana Forge</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
              <input
                className="bg-transparent outline-none placeholder-white/50 text-sm"
                placeholder="Search steel, name..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchProducts(query) }}
              />
              <button className="text-xs text-white/70 hover:text-white" onClick={() => fetchProducts(query)}>Search</button>
            </div>
            <button onClick={() => setCartOpen(true)} className="relative bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded text-sm font-medium">
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-xs bg-pink-500 rounded-full px-1.5 py-0.5">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-800 to-slate-700 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold">Handcrafted Katanas. Modern Precision.</h1>
            <p className="text-white/70 mt-3">Discover blades forged with tradition and engineered for balance. Curated selection for collectors and practitioners.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => fetchProducts('') } className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded font-medium">Browse All</button>
              <a href="/test" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded font-medium">System Check</a>
            </div>
          </div>
          <div className="w-full sm:w-64 h-40 sm:h-44 rounded-xl bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,.35),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(236,72,153,.35),transparent_60%)] border border-white/10 flex items-center justify-center text-5xl">⚔️</div>
        </div>
      </section>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="text-center py-20 text-white/70">Loading products...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-300">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/70 mb-4">No products found.</p>
            <button onClick={seedProducts} className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded font-medium">Load sample products</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p._id} className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.07] transition overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-4xl">⚔️</div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <div className="text-indigo-300 font-semibold">${p.price?.toFixed ? p.price.toFixed(2) : p.price}</div>
                  </div>
                  <p className="text-sm text-white/70 mt-1 line-clamp-2">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                    <span>{p.steel || '—'}</span>
                    <span>{p.blade_length_cm ? `${p.blade_length_cm} cm` : ''}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => addToCart(p, 1)} className="flex-1 bg-indigo-500 hover:bg-indigo-600 px-3 py-2 rounded text-sm font-medium">Add to cart</button>
                    <button onClick={() => addToCart(p, 1) && setCartOpen(true)} className="px-3 py-2 rounded border border-white/20 text-sm">Buy now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <div className={classNames(
        'fixed inset-0 z-30 transition',
        cartOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}>
        <div
          className={classNames(
            'absolute inset-0 bg-black/50 transition-opacity',
            cartOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setCartOpen(false)}
        />
        <aside
          className={classNames(
            'absolute right-0 top-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-white/10 shadow-xl p-5 flex flex-col transition-transform',
            cartOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Cart</h2>
            <button onClick={() => setCartOpen(false)} className="text-white/60 hover:text-white">Close</button>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-white/60 flex-1 flex items-center justify-center">Your cart is empty.</div>
          ) : (
            <>
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product._id} className="flex gap-3 items-center border border-white/10 rounded p-3">
                    <div className="h-12 w-12 rounded bg-slate-700 flex items-center justify-center">⚔️</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-indigo-300">${(product.price * quantity).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-white/60">Qty {quantity} • ${product.price.toFixed(2)} each</div>
                    </div>
                    <button onClick={() => removeFromCart(product._id)} className="text-xs text-white/60 hover:text-white">Remove</button>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70">Subtotal</span>
                  <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                </div>

                <form onSubmit={handleCheckout} className="space-y-2">
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 outline-none"
                  />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 outline-none"
                  />
                  <textarea
                    required
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Shipping address"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 outline-none min-h-[80px]"
                  />
                  <button
                    type="submit"
                    disabled={checkingOut || cartItems.length === 0}
                    className={classNames('w-full rounded px-4 py-2 font-medium', checkingOut ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600')}
                  >
                    {checkingOut ? 'Processing...' : `Checkout $${cartTotal.toFixed(2)}`}
                  </button>
                </form>

                {checkoutResult && (
                  <div className={classNames('mt-3 text-sm rounded p-3', checkoutResult.ok ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30')}>
                    {checkoutResult.ok ? (
                      <div>
                        <div className="font-semibold">Order placed successfully!</div>
                        <div>Order ID: {checkoutResult.orderId}</div>
                        <div>Total: ${checkoutResult.total?.toFixed ? checkoutResult.total.toFixed(2) : checkoutResult.total}</div>
                      </div>
                    ) : (
                      <div>Error: {checkoutResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      <footer className="border-t border-white/10 py-6 text-center text-white/60 text-sm">
        © {new Date().getFullYear()} Katana Forge • Honoring tradition with every blade.
      </footer>
    </div>
  )
}

export default App
