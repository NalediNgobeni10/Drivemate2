import React, { useEffect, useState } from 'react';
import { FileText, Upload, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('ID');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const endpoint = user?.role === 'ADMIN' ? '/api/admin/documents' : '/api/documents';
      const response = await axios.get(endpoint);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', documentType);
      formData.append('fileName', selectedFile.name);
      formData.append('fileUrl', URL.createObjectURL(selectedFile));
      formData.append('fileSize', selectedFile.size.toString());
      formData.append('mimeType', selectedFile.type);

      await axios.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleReview = async (documentId: string, status: string, rejectionReason?: string) => {
    try {
      await axios.patch(`/api/admin/documents/${documentId}`, {
        status,
        rejectionReason,
      });
      fetchDocuments();
    } catch (error) {
      console.error('Failed to review document:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 bg-emerald-400/10';
      case 'REJECTED': return 'text-red-400 bg-red-400/10';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={16} />;
      case 'REJECTED': return <XCircle size={16} />;
      case 'PENDING': return <Clock size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
            <p className="text-slate-400">
              {user?.role === 'ADMIN' ? 'Review and manage student documents' : 'Upload and manage your documents'}
            </p>
          </div>
          {user?.role !== 'ADMIN' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Upload size={20} />
              Upload Document
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No documents found</h3>
            <p className="text-slate-400">
              {user?.role === 'ADMIN' ? 'No documents have been uploaded yet.' : 'Upload your first document to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
              <div key={document.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-emerald-500 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white truncate max-w-[200px]">
                        {document.fileName}
                      </h3>
                      <p className="text-sm text-slate-400">{document.documentType.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {getStatusIcon(document.status)}
                    {document.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size:</span>
                    <span className="text-white">{formatFileSize(document.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white">{document.mimeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uploaded:</span>
                    <span className="text-white">{new Date(document.createdAt).toLocaleDateString()}</span>
                  </div>
                  {document.user && user?.role === 'ADMIN' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Student:</span>
                      <span className="text-white">{document.user.name}</span>
                    </div>
                  )}
                  {document.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reviewed:</span>
                      <span className="text-white">{new Date(document.reviewedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {document.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{document.rejectionReason}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition">
                    <Eye size={16} />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition">
                    <Download size={16} />
                    Download
                  </button>
                </div>

                {user?.role === 'ADMIN' && document.status === 'PENDING' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                    <button
                      onClick={() => handleReview(document.id, 'APPROVED')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleReview(document.id, 'REJECTED', reason);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Document</h2>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ID">ID Document</option>
                    <option value="LEARNERS_LICENSE">Learner's License</option>
                    <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
                    <option value="PROOF_OF_ADDRESS">Proof of Address</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">File</label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-emerald-500 transition cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400">
                        {selectedFile ? selectedFile.name : 'Click to select a file'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
