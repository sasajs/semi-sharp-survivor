import React, { useState, useEffect } from 'react';
import { SemiSharpApi } from '../api';
import { Card, LoadingSpinner } from './ui';
import { Activity, RefreshCw, Wifi, WifiOff, Server, Clock, Database } from 'lucide-react';
import { getBackendUrl } from '../config';

export const ApiHealth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<{ status: string; service?: string } | null>(null);
  const [httpStatus, setHttpStatus] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkApiHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SemiSharpApi.checkHealth();
      setHealthData(data);
      setHttpStatus('200 OK');
      setLastChecked(new Date().toLocaleTimeString());
      setError(null);
    } catch (err: any) {
      console.error('API health check error:', err);
      setHttpStatus(err.status ? `${err.status} Error` : 'Network Error');
      setError(err.message || 'Could not connect to the API server.');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  const activeUrl = getBackendUrl();

  return (
    <Card className="space-y-4 border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>API Health</span>
        </h3>
        <button
          onClick={checkApiHealth}
          disabled={loading}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          title="Refresh Health Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !healthData && !error ? (
        <LoadingSpinner size="sm" message="Checking system gateway..." className="py-2" />
      ) : (
        <div className="space-y-3.5 text-xs font-medium">
          {/* Status Row */}
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-sans">Status:</span>
            {healthData && !error ? (
              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                <Wifi className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </span>
            )}
          </div>

          {/* Backend Service */}
          <div className="flex justify-between items-center py-1 border-t border-slate-50">
            <span className="text-slate-500 font-sans">Backend Service:</span>
            <span className="font-mono text-slate-800 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Server className="w-3 h-3 text-slate-400" />
              {loading ? (
                <span className="text-slate-400 animate-pulse">Querying...</span>
              ) : healthData?.service ? (
                healthData.service
              ) : error ? (
                <span className="text-rose-500 font-sans font-semibold">Unknown</span>
              ) : (
                'SemiSharp API'
              )}
            </span>
          </div>

          {/* HTTP Status */}
          <div className="flex justify-between items-center py-1 border-t border-slate-50">
            <span className="text-slate-500 font-sans">HTTP Status:</span>
            <span className={`font-mono px-2 py-0.5 rounded-md border ${
              healthData && !error 
                ? 'text-emerald-700 bg-emerald-50/55 border-emerald-100' 
                : 'text-rose-700 bg-rose-50/55 border-rose-100'
            }`}>
              {loading && !httpStatus ? '...' : httpStatus}
            </span>
          </div>

          {/* Last Checked */}
          <div className="flex justify-between items-center py-1 border-t border-slate-50">
            <span className="text-slate-500 font-sans">Last Checked:</span>
            <span className="text-slate-600 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {lastChecked || 'Never'}
            </span>
          </div>

          {/* Source Info */}
          <div className="flex justify-between items-center py-1 border-t border-slate-50">
            <span className="text-slate-500 font-sans">Source:</span>
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              LIVE API
            </span>
          </div>

          {/* Gateway Endpoint Override / Connection Info */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" /> Endpoint Gateway
            </span>
            <div className="bg-slate-50 border border-slate-100 rounded-md p-1.5 font-mono text-[10px] text-slate-500 break-all">
              {activeUrl}
            </div>
            {error && (
              <p className="text-[10px] text-rose-500 font-sans mt-1 leading-normal italic">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
