//SESETHU NCITI 231118384//
import React, { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, Loader, CheckCircle, Clock, X, Lock, Ticket, ShieldCheck, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI, progressAPI } from '../lib/api';
import type { Payment } from '../types';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

const statusStyle = (status: string) =>
  status === 'PAID'
    ? 'bg-emerald-500/20 text-emerald-400'
    : status === 'PENDING'
    ? 'bg-amber-500/20 text-amber-400'
    : status === 'REFUNDED'
    ? 'bg-blue-500/20 text-blue-300'
    : 'bg-red-500/20 text-red-400';

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ availableCredits: number; totalPaidLessons: number; usedLessons: number } | null>(null);

  // Checkout modal state
  const [checkoutPayment, setCheckoutPayment] = useState<Payment | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const loadCredits = async () => {
    if (isAdmin) return;
    try {
      const res = await progressAPI.getCredits();
      setCredits(res.data);
    } catch {
      /* non-blocking */
    }
  };

  const fetchData = async () => {
    try {
      const [paymentsRes, packagesRes] = await Promise.all([
        isAdmin ? paymentsAPI.getAdmin() : paymentsAPI.getMy(),
        paymentsAPI.getPackages(),
      ]);
      const paymentsData = isAdmin ? (paymentsRes.data as any).payments : paymentsRes.data;
      setPayments(paymentsData);
      setPackages(packagesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadCredits();
  }, [user?.role]);

  // Student: create a PENDING order then open the checkout modal
  const handlePurchase = async (packageType: string) => {
    setProcessing(packageType);
    setError('');
    try {
      const res = await paymentsAPI.create(packageType);
      setPayments([res.data, ...payments]);
      setProcessing(null);
      setCheckoutPayment(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order');
      setProcessing(null);
    }
  };

  // Called by the checkout modal on success
  const handleCheckoutSuccess = async (paymentId: string) => {
    await paymentsAPI.update(paymentId, 'PAID');
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: 'PAID' as any } : p)));
    setCheckoutPayment(null);
    loadCredits();
  };

  // Admin: change any status
  const handleStatusChange = async (paymentId: string, status: string) => {
    try {
      await paymentsAPI.update(paymentId, status);
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: status as any } : p)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8" data-testid="payments-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{isAdmin ? 'Payment Management' : 'My Payments'}</h1>
          <p className="text-slate-400">
            {isAdmin ? 'Review orders and update payment statuses' : 'Buy lesson packages and pay securely to unlock lesson bookings'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2" data-testid="payments-error">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Student credits banner */}
        {!isAdmin && credits && (
          <div className="mb-8 bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 border border-emerald-500/40 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3" data-testid="credits-banner">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg"><Ticket size={22} className="text-emerald-400" /></div>
              <div>
                <p className="text-white font-semibold">
                  {credits.availableCredits} lesson credit{credits.availableCredits === 1 ? '' : 's'} available
                </p>
                <p className="text-slate-400 text-sm">{credits.usedLessons} used of {credits.totalPaidLessons} paid lessons</p>
              </div>
            </div>
            {credits.availableCredits === 0 && (
              <span className="text-amber-400 text-sm">Buy & pay for a package below to start booking lessons</span>
            )}
          </div>
        )}

        {/* Packages (students only) */}
        {!isAdmin && packages && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Purchase Lesson Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(packages).map((pkg: any) => (
                <div key={pkg.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 transition" data-testid={`package-card-${pkg.id}`}>
                  <div className="mb-4">
                    <p className="text-white font-semibold text-lg">{pkg.name}</p>
                    <p className="text-emerald-400 text-2xl font-bold mt-1">R {pkg.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{pkg.description}</p>
                  <p className="text-white font-medium mb-4">{pkg.lessons} lesson{pkg.lessons === 1 ? '' : 's'} included</p>
                  <button
                    data-testid={`buy-${pkg.id}-btn`}
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={processing === pkg.id}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {processing === pkg.id ? <Loader size={18} className="animate-spin" /> : <CreditCard size={18} />}
                    {processing === pkg.id ? 'Creating order...' : 'Buy & Pay'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment history / management */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">{isAdmin ? 'All Payments' : 'Payment History'}</h2>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    {isAdmin && <th className="text-left py-3 px-4 text-slate-400 font-medium">Student</th>}
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Package</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Lessons</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-700/30" data-testid={`payment-row-${p.id}`}>
                      {isAdmin && (
                        <td className="py-3 px-4 text-white">{p.student?.name || p.studentId.slice(0, 8)}</td>
                      )}
                      <td className="py-3 px-4 text-white capitalize">{p.packageType}</td>
                      <td className="py-3 px-4 text-white">R {p.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-white">{p.lessonsIncluded}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusStyle(p.status)}`} data-testid={`payment-status-${p.id}`}>
                          {p.status === 'PAID' && <CheckCircle size={14} />}
                          {p.status === 'PENDING' && <Clock size={14} />}
                          {p.status === 'FAILED' && <XCircle size={14} />}
                          {p.status === 'REFUNDED' && <RotateCcw size={14} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <select
                            data-testid={`admin-status-select-${p.id}`}
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : p.status === 'PENDING' ? (
                          <button
                            data-testid={`pay-now-btn-${p.id}`}
                            onClick={() => setCheckoutPayment(p)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm transition flex items-center gap-1"
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {checkoutPayment && (
        <CheckoutModal
          payment={checkoutPayment}
          onClose={() => setCheckoutPayment(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};

// ---------- Realistic (simulated) card checkout ----------
const CheckoutModal: React.FC<{
  payment: Payment;
  onClose: () => void;
  onSuccess: (id: string) => Promise<void>;
}> = ({ payment, onClose, onSuccess }) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');
  const [err, setErr] = useState('');

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const digits = cardNumber.replace(/\s/g, '');
  const valid = cardName.trim().length > 2 && digits.length === 16 && /^\d{2}\/\d{2}$/.test(expiry) && cvv.length >= 3;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setErr('Please complete all card details correctly.');
      return;
    }
    setErr('');
    setStage('processing');
    // Simulate gateway processing latency
    await new Promise((r) => setTimeout(r, 2200));
    try {
      await onSuccess(payment.id);
      setStage('success');
      await new Promise((r) => setTimeout(r, 1200));
      onClose();
    } catch {
      setErr('Payment could not be completed. Please try again.');
      setStage('form');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" data-testid="checkout-modal">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Lock size={18} className="text-emerald-400" /> Secure Checkout
          </div>
          {stage === 'form' && (
            <button onClick={onClose} data-testid="checkout-close-btn" className="text-slate-400 hover:text-white transition"><X size={20} /></button>
          )}
        </div>

        {/* Amount */}
        <div className="px-6 pt-5">
          <div className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide">Amount due</p>
              <p className="text-white text-2xl font-bold">R {payment.amount.toLocaleString()}</p>
            </div>
            <span className="capitalize px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-medium">
              {payment.packageType} · {payment.lessonsIncluded} lessons
            </span>
          </div>
        </div>

        {stage === 'processing' && (
          <div className="px-6 py-12 text-center" data-testid="checkout-processing">
            <Loader size={40} className="animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-medium">Processing payment…</p>
            <p className="text-slate-400 text-sm mt-1">Contacting payment gateway securely</p>
          </div>
        )}

        {stage === 'success' && (
          <div className="px-6 py-12 text-center" data-testid="checkout-success">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <p className="text-white font-semibold text-lg">Payment Successful</p>
            <p className="text-slate-400 text-sm mt-1">Your lesson credits are now available</p>
          </div>
        )}

        {stage === 'form' && (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            {err && (
              <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {err}
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Cardholder Name</label>
              <input
                data-testid="card-name-input"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g., Thando Zungu"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Card Number</label>
              <div className="relative">
                <input
                  data-testid="card-number-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  className="w-full px-3 py-2 pr-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <CreditCard size={18} className="absolute right-3 top-2.5 text-slate-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Expiry</label>
                <input
                  data-testid="card-expiry-input"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">CVV</label>
                <input
                  data-testid="card-cvv-input"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              data-testid="pay-submit-btn"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Pay R {payment.amount.toLocaleString()}
            </button>
            <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
              <ShieldCheck size={14} /> Demo checkout — no real card is charged. Use any test card, e.g. 4242 4242 4242 4242.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
