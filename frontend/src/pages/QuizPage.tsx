import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, Loader, RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizAPI } from '../lib/api';
import type { QuizQuestion, QuizAttempt } from '../types';

const QuizPage: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [licenseCode, setLicenseCode] = useState<'8' | '10'>('8');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [questionsRes, attemptsRes] = await Promise.all([
          quizAPI.getQuestions(10, licenseCode),
          quizAPI.getMyAttempts(),
        ]);
        setQuestions(questionsRes.data);
        setAttempts(attemptsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [licenseCode]);

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await quizAPI.submitAttempt(licenseCode, answers);
      setResult(res.data);
      const attemptsRes = await quizAPI.getMyAttempts();
      setAttempts(attemptsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError('');
    quizAPI.getQuestions(10, licenseCode).then(res => setQuestions(res.data));
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">K53 Learner's Licence Quiz</h1>
          <p className="text-slate-400">Test your knowledge of South African road rules</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* License Code Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">License Code</label>
          <div className="flex gap-4">
            <button
              onClick={() => setLicenseCode('8')}
              className={`px-4 py-2 rounded-lg transition ${
                licenseCode === '8'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Code 8 (Light Motor Vehicle)
            </button>
            <button
              onClick={() => setLicenseCode('10')}
              className={`px-4 py-2 rounded-lg transition ${
                licenseCode === '10'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Code 10 (Heavy Vehicle)
            </button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Quiz Results</h2>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                <RotateCcw size={18} />
                Try Again
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${result.passed ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                <p className="text-slate-400 text-sm">Score</p>
                <p className={`text-2xl font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.score}/{result.total}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-500/50">
                <p className="text-slate-400 text-sm">Percentage</p>
                <p className="text-2xl font-bold text-blue-400">{result.percentScore}%</p>
              </div>
              <div className={`p-4 rounded-lg ${result.passed ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                <p className="text-slate-400 text-sm">Result</p>
                <p className={`text-2xl font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Answer Breakdown</h3>
            <div className="space-y-3">
              {result.breakdown?.map((item: any, idx: number) => (
                <div key={idx} className={`p-3 rounded-lg ${item.isRight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <div className="flex items-start gap-2">
                    {item.isRight ? <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-white text-sm">{item.question}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Your answer: {item.options[item.chosen]} {item.isRight ? '(Correct)' : `(Incorrect - Correct: ${item.options[item.correct]})`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz Questions */}
        {!result && (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{q.question}</p>
                    <p className="text-slate-500 text-sm mt-1">{q.category} · {q.code === 'both' ? 'All Codes' : `Code ${q.code}`}</p>
                  </div>
                </div>

                <div className="space-y-2 ml-11">
                  {q.options.map((option, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswer(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        answers[q.id] === optIdx
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-white'
                          : 'bg-slate-700/30 border border-slate-600 text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        )}

        {/* Previous Attempts */}
        {attempts.length > 0 && (
          <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Previous Attempts</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Code</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Score</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-400">{new Date(attempt.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-white">Code {attempt.licenseCode}</td>
                      <td className="py-3 px-4 text-white">{attempt.score}/{attempt.total}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {attempt.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
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

export default QuizPage;
