import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/hooks/useApplications';
import { useResume } from '@/hooks/useResume';
import { useJobPreferences } from '@/hooks/useJobPreferences';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  FileText, 
  Briefcase, 
  Settings, 
  LogOut, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  Target,
  Zap,
  Rocket,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { applications } = useApplications();
  const { resumes } = useResume();
  const { preferences } = useJobPreferences();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Calculate real stats from applications
  const applicationsSent = applications?.filter(a => 
    ['applied', 'auto_applied', 'screening', 'interviewing', 'offer'].includes(a.status)
  ).length || 0;

  const interviewsScheduled = applications?.filter(a => 
    a.status === 'interviewing'
  ).length || 0;

  const pendingReview = applications?.filter(a => 
    ['saved', 'manual_required'].includes(a.status)
  ).length || 0;

  const rejections = applications?.filter(a => 
    a.status === 'rejected'
  ).length || 0;

  // Calculate auto-apply stats for today
  const todayAutoApplied = applications?.filter(a => {
    if (a.status !== 'auto_applied') return false;
    const appliedDate = new Date(a.applied_at || a.created_at);
    const today = new Date();
    return appliedDate.toDateString() === today.toDateString();
  }).length || 0;

  const autoApplyLimit = preferences?.auto_apply_daily_limit || 10;
  const autoApplyThreshold = preferences?.auto_apply_threshold || 75;
  const autoApplyEnabled = preferences?.auto_apply_enabled || false;
  const remainingQuota = Math.max(0, autoApplyLimit - todayAutoApplied);
  const quotaPercentUsed = (todayAutoApplied / autoApplyLimit) * 100;

  const stats = [
    { label: 'Applications Sent', value: applicationsSent, icon: Briefcase, color: 'text-primary' },
    { label: 'Interviews', value: interviewsScheduled, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'text-yellow-500' },
    { label: 'Rejections', value: rejections, icon: XCircle, color: 'text-red-500' },
  ];

  // Check onboarding completion
  const hasResume = resumes && resumes.length > 0;
  const hasPreferences = preferences && (preferences.desired_roles?.length > 0 || preferences.locations?.length > 0);

  const onboardingSteps = [
    { label: 'Create your account', completed: true },
    { label: 'Upload your resume', completed: hasResume },
    { label: 'Set job preferences', completed: hasPreferences },
    { label: 'Start applying to jobs', completed: applicationsSent > 0 },
  ];

  const navLinks = [
    { label: 'Resumes', href: '/resumes', icon: FileText },
    { label: 'Jobs', href: '/jobs', icon: Target },
    { label: 'Applications', href: '/applications', icon: Briefcase },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold">
                  Auto<span className="text-primary">Apply</span>
                </span>
              </Link>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your job application journey.
          </p>
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

        {/* Auto-Apply Activity Widget */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Auto-Apply Activity</h2>
                <p className="text-sm text-muted-foreground">Today's automated applications</p>
              </div>
            </div>
            {!autoApplyEnabled && (
              <Button variant="outline" size="sm" onClick={() => navigate('/preferences')}>
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                Enable Auto-Apply
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Today's Applications */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today's Auto-Applied</span>
                <span className="font-bold text-primary">{todayAutoApplied}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Daily Limit</span>
                <span className="font-medium">{autoApplyLimit}</span>
              </div>
            </div>

            {/* Quota Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Quota Used</span>
                <span className="font-medium">{todayAutoApplied}/{autoApplyLimit}</span>
              </div>
              <Progress value={quotaPercentUsed} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {remainingQuota > 0 
                  ? `${remainingQuota} applications remaining today`
                  : 'Daily limit reached - resets at midnight'
                }
              </p>
            </div>

            {/* Match Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Match Threshold</span>
                <span className="font-bold text-primary">{autoApplyThreshold}%+</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Jobs scoring {autoApplyThreshold}% or higher will be auto-applied
              </p>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/preferences')}>
                <Settings className="h-4 w-4 mr-2" />
                Adjust Settings
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/jobs')} className="bg-primary hover:bg-primary/90">
              <Zap className="h-4 w-4 mr-2" />
              Find & Auto-Apply Jobs
            </Button>
            <Button variant="outline" onClick={() => navigate('/applications')}>
              <Briefcase className="h-4 w-4 mr-2" />
              View All Applications
            </Button>
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate('/resumes')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Resume</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume to start matching with jobs.
            </p>
            <Button variant="heroOutline" size="sm" className="group">
              <Plus className="h-4 w-4 mr-1" />
              Add Resume
            </Button>
          </div>

          <div className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate('/preferences')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Set Preferences</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Define your ideal role, salary, and location.
            </p>
            <Button variant="heroOutline" size="sm" className="group">
              Configure
            </Button>
          </div>

          <div className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate('/jobs')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Browse Jobs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Discover jobs that match your profile.
            </p>
            <Button variant="heroOutline" size="sm" className="group">
              <Zap className="h-4 w-4 mr-1" />
              Find Jobs
            </Button>
          </div>

          <div className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate('/applications')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Applications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track all your job applications.
            </p>
            <Button variant="heroOutline" size="sm" className="group">
              View All
            </Button>
          </div>
        </div>

        {/* Getting Started Checklist */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-3">
            {onboardingSteps.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-border" />
                )}
                <span className={item.completed ? 'text-muted-foreground line-through' : ''}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-2">
          <div className="flex justify-around">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground"
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
