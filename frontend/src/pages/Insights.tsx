import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsAPI } from '../services/api';
import InsightsList from '../components/InsightsList';
import InsightDetail from '../components/InsightDetail';
import styles from './Insights.module.css';

function Insights() {
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['insights', filters],
    queryFn: () => insightsAPI.getAll(filters),
  });

  const { data: selectedInsight } = useQuery({
    queryKey: ['insight', selectedInsightId],
    queryFn: () => selectedInsightId ? insightsAPI.getById(selectedInsightId) : null,
    enabled: !!selectedInsightId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      insightsAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['insight', selectedInsightId] });
    },
  });

  const createJiraMutation = useMutation({
    mutationFn: (id: string) => insightsAPI.createJiraTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['insight', selectedInsightId] });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading insights...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Insights</h1>
        <div className={styles.filters}>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filter}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={styles.filter}
          >
            <option value="">All Categories</option>
            <option value="onboarding">Onboarding</option>
            <option value="conversion">Conversion</option>
            <option value="engagement">Engagement</option>
            <option value="performance">Performance</option>
            <option value="usability">Usability</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={styles.filter}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h2>All Insights ({data?.total || 0})</h2>
          </div>
          <InsightsList 
            insights={data?.insights || []} 
            onSelect={setSelectedInsightId}
          />
        </div>

        <div className={styles.detailSection}>
          {selectedInsight ? (
            <InsightDetail
              insight={selectedInsight}
              onUpdateStatus={(status) => 
                updateStatusMutation.mutate({ id: selectedInsight.id, status })
              }
              onCreateJira={() => createJiraMutation.mutate(selectedInsight.id)}
              isUpdating={updateStatusMutation.isPending}
              isCreatingJira={createJiraMutation.isPending}
            />
          ) : (
            <div className={styles.noSelection}>
              Select an insight to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Insights;