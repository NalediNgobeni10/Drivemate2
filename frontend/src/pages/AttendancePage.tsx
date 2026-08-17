import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, User, MapPin, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Attendance {
  id: string;
  bookingId: string;
  studentId: string;
  instructorId: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
  createdAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
  booking?: {
    id: string;
    slot?: {
      date: string;
      timeWindow: string;
      vehicle: string;
    };
  };
}

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const fetchAttendance = async () => {
    try {
      const endpoint = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
        ? '/api/attendance/instructor'
        : '/api/attendance/student';
      const response = await axios.get(endpoint);
      setAttendance(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendance = async (attendanceId: string) => {
    try {
      await axios.patch(`/api/attendance/${attendanceId}`, {
        status: editStatus,
        notes: editNotes,
      });
      setEditingAttendance(null);
      fetchAttendance();
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'text-emerald-400 bg-emerald-400/10';
      case 'ABSENT': return 'text-red-400 bg-red-400/10';
      case 'CANCELLED': return 'text-yellow-400 bg-yellow-400/10';
      case 'NO_SHOW': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle size={16} />;
      case 'ABSENT': return <XCircle size={16} />;
      case 'CANCELLED': return <Clock size={16} />;
      case 'NO_SHOW': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    return Math.round((present / attendance.length) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Attendance Management</h1>
          <p className="text-slate-400">
            {user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
              ? 'Track and manage lesson attendance'
              : 'View your attendance history'}
          </p>
        </div>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Attendance Rate</span>
            </div>
            <p className="text-3xl font-bold text-white">{calculateAttendanceRate()}%</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Present</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {attendance.filter(a => a.status === 'PRESENT').length}
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-slate-400 text-sm">Absent</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {attendance.filter(a => a.status === 'ABSENT').length}
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm">Total Lessons</span>
            </div>
            <p className="text-3xl font-bold text-white">{attendance.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No attendance records found</h3>
            <p className="text-slate-400">
              {user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN'
                ? 'Start marking attendance for lessons.'
                : 'Your attendance will appear here after lessons.'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {user?.role === 'STUDENT' ? 'Instructor' : 'Student'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Notes
                  </th>
                  {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <p className="text-white font-medium">
                            {record.booking?.slot?.date || new Date(record.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-400">
                            {record.booking?.slot?.timeWindow || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-white">
                          {user?.role === 'STUDENT' ? record.instructor?.name : record.student?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-white">{record.booking?.slot?.vehicle || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingAttendance?.id === record.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="NO_SHOW">No Show</option>
                        </select>
                      ) : (
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.checkInTime ? (
                        <span className="text-white">{new Date(record.checkInTime).toLocaleTimeString()}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingAttendance?.id === record.id ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full"
                          placeholder="Add notes..."
                        />
                      ) : (
                        <span className="text-slate-400 text-sm max-w-[200px] truncate block">
                          {record.notes || '—'}
                        </span>
                      )}
                    </td>
                    {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAttendance?.id === record.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateAttendance(record.id)}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                            >
                              <Save size={16} className="text-white" />
                            </button>
                            <button
                              onClick={() => setEditingAttendance(null)}
                              className="p-2 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
                            >
                              <XCircle size={16} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingAttendance(record);
                              setEditStatus(record.status);
                              setEditNotes(record.notes || '');
                            }}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                          >
                            <Edit size={16} className="text-white" />
                          </button>
                        )}
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
  );
};

export default AttendancePage;
