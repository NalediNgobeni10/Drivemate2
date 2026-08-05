import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, AlertCircle, Loader, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI } from '../lib/api';
import type { Payment } from '../types';

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, packagesRes] = await Promise.all([
          user?.role === 'ADMIN' ? paymentsAPI.getAdmin() : paymentsAPI.getMy(),
          paymentsAPI.getPackages(),
        ]);
        setPayments(user?.role === 'ADMIN' ? paymentsRes.data.payments : paymentsRes.data);
        setPackages(packagesRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  const handlePurchase = async (packageType: string) => {
    setProcessing(packageType);
    try {
      const res = await paymentsAPI.create(packageType);
      setPayments([res.data, ...payments]);
      setProcessing(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment');
      setProcessing(null);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    try {
      await paymentsAPI.update(paymentId, 'PAID');
      setPayments(payments.map(p => p.id === paymentId ? { ...p, status: 'PAID' as any } : p));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {user?.role === 'ADMIN' ? 'Payment Management' : 'My Payments'}
          </h1>
          <p className="text-slate-400">
            {user?.role === 'ADMIN' ? 'View and manage all payments' : 'Purchase lesson packages and view payment history'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {user?.role !== 'ADMIN' && packages && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Purchase Lesson Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(packages).map((pkg: any) => (
                <div key={pkg.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 transition">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <DollarSign size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{pkg.name}</p>
                      <p className="text-emerald-400 text-sm">R {pkg.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{pkg.description}</p>
                  <p className="text-white font-medium mb-4">{pkg.lessons} lessons included</p>
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={processing === pkg.id}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {processing === pkg.id ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <CreditCard size={18} />
                    )}
                    {processing === pkg.id ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Payment History</h2>

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
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Package</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Lessons</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                    {user?.role === 'ADMIN' && <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white capitalize">{p.packageType}</td>
                      <td className="py-3 px-4 text-white">R {p.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-white">{p.lessonsIncluded}</td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          p.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                          p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {p.status === 'PAID' && <CheckCircle size={14} />}
                          {p.status === 'PENDING' && <Clock size={14} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      {user?.role === 'ADMIN' && p.status === 'PENDING' && (
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleMarkPaid(p.id)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm transition"
                          >
                            Mark Paid
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
