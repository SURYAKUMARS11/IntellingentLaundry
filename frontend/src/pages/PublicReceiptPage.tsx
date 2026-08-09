import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { fetchPublicOrderByNumber, fetchSettings } from '../services/api';
import { Order, Setting } from '../types';
import { InvoiceView } from '../components/invoice/InvoiceView';
import { WashingMachine, AlertCircle, ArrowLeft } from 'lucide-react';

export const PublicReceiptPage: React.FC = () => {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const queryOrderNumber = searchParams.get('receipt') || searchParams.get('order') || searchParams.get('r');
  const orderNumber = paramOrderNumber || queryOrderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [setting, setSetting] = useState<Setting | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadReceipt = async () => {
      if (!orderNumber) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [ordRes, setRes] = await Promise.all([
          fetchPublicOrderByNumber(orderNumber),
          fetchSettings(),
        ]);

        if (ordRes.success && ordRes.order) {
          setOrder(ordRes.order);
        } else {
          setError('Receipt not found. Please check the receipt URL.');
        }

        if (setRes.success) {
          setSetting(setRes.setting);
        }
      } catch (err) {
        setError('Failed to load invoice receipt.');
      } finally {
        setIsLoading(false);
      }
    };
    loadReceipt();
  }, [orderNumber]);

  if (!orderNumber && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading Official Digital Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-6 text-center space-y-4 border border-rose-800/40">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Invoice Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested order receipt link is invalid or expired.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-2 sm:p-6">
      <InvoiceView order={order} setting={setting} isPublicView={true} />
    </div>
  );
};
