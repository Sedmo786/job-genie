import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ArrowLeft,
  TrendingUp,
  Briefcase,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { analytics, loading: isLoading, refetch } = useAnalytics();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Use the pre-calculated totals from the hook
  const totals = {
    jobsFetched: analytics?.total_jobs_fetched || 0,
    jobsAutoApplied: analytics?.total_auto_applied || 0,
    jobsApplied: analytics?.total_applied || 0,
    jobsManualRequired: analytics?.total_manual_required || 0,
    jobsRejected: analytics?.total_rejected || 0,
  };

  const successRate = analytics?.success_rate || 0;

  // Format data for charts from daily_data
  const chartData = analytics?.daily_data?.slice(-14).reverse().map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    fetched: item.jobs_fetched || 0,
    autoApplied: item.jobs_auto_applied || 0,
    applied: item.jobs_applied || 0,
    rejected: item.jobs_rejected || 0,
  })) || [];

  const stats = [
    { label: 'Jobs Fetched', value: totals.jobsFetched, icon: Target, color: 'text-blue-500' },
    { label: 'Auto Applied', value: totals.jobsAutoApplied, icon: CheckCircle2, color: 'text-primary' },
    { label: 'Manual Required', value: totals.jobsManualRequired, icon: Clock, color: 'text-yellow-500' },
    { label: 'Rejected', value: totals.jobsRejected, icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold">
                  Auto<span className="text-primary">Apply</span>
                </span>
              </Link>
            </div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Track your job application performance and metrics
            </p>
          </div>
          <Button variant="heroOutline" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Success Rate Card */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Auto-Apply Success Rate</p>
              <p className="text-4xl font-bold">{successRate}%</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Applications Over Time */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Applications Over Time
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="applied" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="autoApplied" 
                    stroke="hsl(142 76% 36%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142 76% 36%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet. Start applying to jobs!
              </div>
            )}
          </div>

          {/* Jobs Fetched */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Daily Activity
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="fetched" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet. Start searching for jobs!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
