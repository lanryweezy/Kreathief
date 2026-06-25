import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../Button';
import { ErrorBoundary } from '../ErrorBoundary';
import { supabase } from '../../lib/supabase/client';
import { Icons } from '../../constants';

interface Asset {
  id: string;
  title: string;
  status: 'pending' | 'published' | 'rejected';
  downloads: number;
  created_at: string;
}

interface Stats {
  totalDownloads: number;
  totalEarnings: number;
  activeAssets: number;
}

const CreatorDashboardInner: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<Stats>({ totalDownloads: 0, totalEarnings: 0, activeAssets: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (assetsData) {
        setAssets(assetsData);
        setStats({
          totalDownloads: assetsData.reduce((sum, a) => sum + (a.downloads || 0), 0),
          totalEarnings: assetsData.reduce((sum, a) => sum + ((a.downloads || 0) * (a.price || 0)), 0),
          activeAssets: assetsData.filter((a) => a.status === 'published').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch creator data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statCards = [
    { label: 'Total Downloads', value: stats.totalDownloads, icon: Icons.Download },
    { label: 'Total Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: Icons.DollarSign },
    { label: 'Active Assets', value: stats.activeAssets, icon: Icons.Package },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    published: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="min-h-screen bg-surface-dark-1 p-8" role="main" aria-label="Creator Dashboard">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your assets and track performance</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            aria-label="Upload new asset"
          >
            Upload Asset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-dark-2 border border-white/10 rounded-xl p-6"
              role="status"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className="w-5 h-5 text-brand-400" />
                <span className="text-sm text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface-dark-2 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Your Assets</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="p-12 text-center">
              <Icons.Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No assets yet</p>
              <Button variant="secondary" onClick={() => setShowUploadModal(true)}>
                Upload your first asset
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{asset.title}</p>
                    <p className="text-sm text-gray-400">{asset.downloads} downloads</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                    {asset.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CreatorDashboard: React.FC = React.memo(() => (
  <ErrorBoundary componentName="CreatorDashboard">
    <CreatorDashboardInner />
  </ErrorBoundary>
));
