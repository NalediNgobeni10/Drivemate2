import React, { useEffect, useState } from 'react';
import { Users, BarChart3, DollarSign, Calendar, TrendingUp, AlertCircle, Loader, Shield, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, analyticsAPI, paymentsAPI } from '../lib/api';
import type { User, Payment } from '../types';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'payments'>('analytics');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, analyticsRes, paymentsRes] = await Promise.all([
          usersAPI.list(),
          analyticsAPI.getDashboard(),
          paymentsAPI.getAdmin(),
        ]);
        setUsers(usersRes.data.users);
        setAnalytics(analyticsRes.data);
        setPayments((paymentsRes.data as any).payments);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-400">Manage users, view analytics, and oversee operations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'analytics'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'users'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Users size={18} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === 'payments'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <DollarSign size={18} />
            Payments
          </button>
        </div>

        {activeTab === 'analytics' && analytics && (
          <>
            {/* Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Users</p>
                    <p className="text-white text-2xl font-bold mt-1">{analytics.totalUsers}</p>
                  </div>
                  <Users className="text-emerald-400" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Bookings</p>
                    <p className="text-white text-2xl font-bold mt-1">{analytics.totalBookings}</p>
                  </div>
                  <Calendar className="text-blue-400" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Revenue</p>
                    <p className="text-white text-2xl font-bold mt-1">R {analytics.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="text-purple-400" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Completed</p>
                    <p className="text-white text-2xl font-bold mt-1">{analytics.completedBookings}</p>
                  </div>
                  <TrendingUp className="text-amber-400" size={32} />
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">User Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Students</span>
                    <span className="text-white font-semibold">{analytics.totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Instructors</span>
                    <span className="text-white font-semibold">{analytics.totalInstructors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Admins</span>
                    <span className="text-white font-semibold">{analytics.totalUsers - analytics.totalStudents - analytics.totalInstructors}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Financial Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Transactions</span>
                    <span className="text-white font-semibold">{analytics.totalTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Avg Revenue/Booking</span>
                    <span className="text-white font-semibold">
                      R {analytics.totalBookings > 0 ? Math.round(analytics.totalRevenue / analytics.totalBookings) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Completion Rate</span>
                    <span className="text-white font-semibold">
                      {analytics.totalBookings > 0 ? Math.round((analytics.completedBookings / analytics.totalBookings) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield size={24} className="text-emerald-400" />
              User Management
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white">{u.name}</td>
                      <td className="py-3 px-4 text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="STUDENT">Student</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign size={24} className="text-emerald-400" />
              Payment History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Student</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Package</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white">{p.studentId.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-slate-400 capitalize">{p.packageType}</td>
                      <td className="py-3 px-4 text-white">R {p.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' :
                          p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
