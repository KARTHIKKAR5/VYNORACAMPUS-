import { useState, useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Shield,
  Zap,
  ArrowRight,
  Package,
  Layers,
  Info,
  Clock,
  Lock,
  RefreshCw,
  ShoppingBag,
  BellRing
} from 'lucide-react';
import { productsApi } from '../../services/api';

interface Product {
  _id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  features: string[];
  price: number;
  currency: string;
  billingInterval: string;
  isFree: boolean;
  isExternal: boolean;
  externalUrl?: string;
  badge?: string;
  status: string;
}

interface Order {
  _id: string;
  orderId: string;
  productName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'external' | 'subscriptions' | 'library'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<Product | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, ordersRes] = await Promise.all([
        productsApi.list(),
        productsApi.myOrders().catch(() => ({ orders: [] }))
      ]);
      setProducts(prodRes.products || []);
      setMyOrders(ordersRes.orders || []);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleCheckout = async (product: Product) => {
    if (product.isExternal && product.externalUrl) {
      window.open(product.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setCheckoutModal(product);
    setErrorMsg(null);
  };

  const confirmOrder = async () => {
    if (!checkoutModal) return;
    setPurchasing(true);
    setErrorMsg(null);
    try {
      const res = await productsApi.order(checkoutModal._id);
      setOrderSuccess(res.message || `Successfully activated ${checkoutModal.name}!`);
      setCheckoutModal(null);
      await fetchCatalog();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment or order processing failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const isPurchased = (productId: string) => {
    return myOrders.some(
      (o) => (o as any).productId?._id === productId || (o as any).productId === productId
    );
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'external') return p.isExternal;
    if (activeTab === 'subscriptions') return !p.isExternal && !p.isFree;
    return true;
  });

  return (
    <div className="products-view" style={{ maxWidth: 1120, margin: '0 auto', paddingBottom: 60 }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontFamily: '"DM Mono", monospace',
              letterSpacing: '0.12em',
              fontWeight: 600,
              color: 'var(--green)',
              textTransform: 'uppercase',
              background: '#e9f1eb',
              padding: '2px 8px',
              borderRadius: 3
            }}
          >
            Vynora Official Store & Catalog
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>· Verified Products for SR University</span>
        </div>
        <h1
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 32,
            fontWeight: 700,
            margin: '0 0 8px 0',
            color: 'var(--ink)'
          }}
        >
          Campus Products & Productivity Suite
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', maxWidth: 680 }}>
          High-performance tools, alert automation, and academic utilities built directly for student workflows,
          opportunities discovery, and semester success.
        </p>
      </div>

      {orderSuccess && (
        <div
          style={{
            background: '#eaf4ee',
            border: '1px solid #c2e2cc',
            color: '#153b33',
            padding: '12px 16px',
            borderRadius: 6,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b5a' }} />
            <span>{orderSuccess}</span>
          </div>
          <button
            onClick={() => setOrderSuccess(null)}
            style={{ background: 'transparent', border: 'none', color: '#153b33', cursor: 'pointer', fontWeight: 600 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 12,
          marginBottom: 24
        }}
      >
        {[
          { id: 'all', label: 'All Catalog' },
          { id: 'external', label: 'External Tools & Pulse' },
          { id: 'subscriptions', label: 'Campus Subscriptions' },
          { id: 'library', label: `My Library & Access (${myOrders.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSelectedProduct(null);
            }}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              background: activeTab === tab.id ? 'var(--green)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--ink)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--green)' : 'var(--line)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }} />
          <div>Loading verified campus catalog...</div>
        </div>
      ) : activeTab === 'library' ? (
        /* My Library Tab */
        <div>
          {myOrders.length === 0 ? (
            <div
              style={{
                background: '#faf9f4',
                border: '1px dashed var(--line)',
                padding: '48px 24px',
                textAlign: 'center',
                borderRadius: 6
              }}
            >
              <Package size={36} style={{ color: 'var(--muted)', marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>No active subscriptions yet</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--muted)' }}>
                You have not activated any campus utilities or study vaults yet.
              </p>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {myOrders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    background: '#faf9f4',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: '#e4ede5',
                          color: 'var(--green)',
                          padding: '2px 6px',
                          borderRadius: 3
                        }}
                      >
                        ACTIVE ENTITLEMENT
                      </span>
                      <small style={{ color: 'var(--muted)', fontSize: 11 }}>Order #{order.orderId}</small>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{order.productName}</h3>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Amount: {order.amount === 0 ? 'Free Access' : `₹${order.amount} (${order.currency})`} · Activated on{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: 'var(--green)',
                        fontWeight: 600
                      }}
                    >
                      <CheckCircle2 size={16} /> Entitled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Products Grid */
        <div style={{ display: 'grid', gap: 24 }}>
          {filteredProducts.map((product) => {
            const owned = isPurchased(product._id);
            const isPulse = product.slug === 'vynora-pulse';

            return (
              <div
                key={product._id}
                style={{
                  background: isPulse ? '#fbfaf5' : '#faf9f4',
                  border: isPulse ? '1.5px solid #c8d8cc' : '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 24,
                  boxShadow: isPulse ? '0 4px 18px rgba(21, 59, 51, 0.06)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Featured Badge */}
                {isPulse && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'var(--green)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '4px 14px',
                      borderBottomLeftRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Sparkles size={12} /> FEATURED VYNORA SUITE
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: 20,
                    alignItems: 'start'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: product.isExternal ? '#eef4ed' : product.isFree ? '#edf4ec' : '#fcedea',
                          color: product.isExternal ? 'var(--green)' : product.isFree ? 'var(--green)' : '#9e3b26',
                          padding: '2px 8px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {product.badge || (product.isExternal ? 'External Suite' : product.isFree ? 'Free Campus Tool' : 'Pro Tool')}
                      </span>
                      {product.tagline && (
                        <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                          "{product.tagline}"
                        </span>
                      )}
                    </div>

                    <h2
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: 22,
                        fontFamily: 'Fraunces, serif',
                        fontWeight: 700,
                        color: 'var(--ink)'
                      }}
                    >
                      {product.name}
                    </h2>

                    <p style={{ margin: '0 0 18px 0', fontSize: 14, lineHeight: 1.55, color: '#333834', maxWidth: 720 }}>
                      {product.description}
                    </p>

                    {/* Features list */}
                    {product.features && product.features.length > 0 && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: 8,
                          marginBottom: 20,
                          background: '#f2f1ea',
                          padding: 14,
                          borderRadius: 6
                        }}
                      >
                        {product.features.map((feat, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 12.5,
                              color: 'var(--ink)'
                            }}
                          >
                            <CheckCircle2 size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isPulse && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11.5,
                          color: 'var(--muted)',
                          marginBottom: 8
                        }}
                      >
                        <Info size={13} style={{ color: 'var(--green)' }} />
                        <span>
                          Direct URL: <code style={{ font: '500 11px "DM Mono"' }}>https://vynorapulse.vercel.app/</code> · Independent alert engine. Opens in a secure external tab.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pricing / Action Column */}
                  <div
                    style={{
                      minWidth: 200,
                      background: '#f2efe9',
                      padding: 18,
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {product.isExternal ? 'Service Access' : product.isFree ? 'Plan' : 'Pricing'}
                      </div>
                      <div
                        style={{
                          fontSize: product.isExternal ? 20 : product.isFree ? 22 : 26,
                          fontWeight: 700,
                          color: 'var(--ink)',
                          marginTop: 4,
                          fontFamily: 'Fraunces, serif'
                        }}
                      >
                        {product.isExternal
                          ? 'Included'
                          : product.isFree
                          ? 'Free'
                          : `₹${product.price}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {product.isExternal
                          ? 'Independent Service'
                          : product.billingInterval === 'PER_SEMESTER'
                          ? 'Per semester billing'
                          : product.billingInterval === 'MONTHLY'
                          ? 'Monthly renewal'
                          : 'One-time access'}
                      </div>
                    </div>

                    {product.isExternal ? (
                      <a
                        href={product.externalUrl || 'https://vynorapulse.vercel.app/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          background: 'var(--green)',
                          color: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          boxShadow: '0 2px 6px rgba(21, 59, 51, 0.15)'
                        }}
                      >
                        Visit Product <ExternalLink size={14} />
                      </a>
                    ) : owned ? (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          background: '#e4ede5',
                          color: 'var(--green)',
                          padding: '10px 14px',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'default'
                        }}
                      >
                        <CheckCircle2 size={16} /> Entitled
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckout(product)}
                        style={{
                          width: '100%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          background: 'var(--green)',
                          color: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {product.isFree ? 'Claim Free Access' : 'Subscribe Now'} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout / Order Confirmation Modal */}
      {checkoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(21, 59, 51, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
        >
          <div
            style={{
              background: '#faf9f4',
              maxWidth: 480,
              width: '100%',
              borderRadius: 8,
              border: '1px solid var(--line)',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: 'var(--green)',
                color: '#ffffff',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: '"DM Mono", monospace',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: 0.85
                  }}
                >
                  Order Confirmation
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: 18, color: '#ffffff' }}>{checkoutModal.name}</h3>
              </div>
              <button
                onClick={() => setCheckoutModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {errorMsg && (
                <div
                  style={{
                    background: '#fcedea',
                    color: '#9e3b26',
                    padding: '8px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    marginBottom: 16
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--muted)' }}>
                {checkoutModal.description}
              </p>

              {/* Order breakdown */}
              <div
                style={{
                  background: '#f2f0e8',
                  borderRadius: 6,
                  padding: 16,
                  border: '1px solid var(--line)',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span>Product Item</span>
                  <b>{checkoutModal.name}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span>Billing Interval</span>
                  <span>{checkoutModal.billingInterval}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span>Taxes (GST/Campus Rate)</span>
                  <span>₹0.00 (Included)</span>
                </div>
                <div
                  style={{
                    borderTop: '1px dashed var(--line)',
                    paddingTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--green)'
                  }}
                >
                  <span>Total Due</span>
                  <span>{checkoutModal.isFree ? 'FREE (₹0)' : `₹${checkoutModal.price} ${checkoutModal.currency}`}</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  lineHeight: 1.45,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6
                }}
              >
                <Shield size={14} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }} />
                <span>
                  Payments and grants are authenticated by your active campus student session. Charges are clearly
                  disclosed with no hidden auto-renewals without authorization.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setCheckoutModal(null)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 4,
                    border: '1px solid var(--line)',
                    background: '#ffffff',
                    color: 'var(--ink)',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmOrder}
                  disabled={purchasing}
                  style={{
                    flex: 2,
                    padding: '10px 14px',
                    borderRadius: 4,
                    border: 'none',
                    background: 'var(--green)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: purchasing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {purchasing ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> Processing...
                    </>
                  ) : checkoutModal.isFree ? (
                    'Confirm Free Access'
                  ) : (
                    `Authorize ₹${checkoutModal.price}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
