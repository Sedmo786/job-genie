import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
  Loader2
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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

  const stats = [
    { label: 'Applications Sent', value: '0', icon: Briefcase, color: 'text-primary' },
    { label: 'Interviews Scheduled', value: '0', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Pending Review', value: '0', icon: Clock, color: 'text-yellow-500' },
    { label: 'Rejections', value: '0', icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold">
                Auto<span className="text-primary">Apply</span>
              </span>
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate('/resumes')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Resume</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume to start matching with jobs automatically.
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
              Define your ideal role, salary, and location preferences.
            </p>
            <Button variant="heroOutline" size="sm" className="group">
              Configure
            </Button>
          </div>

          <div className="glass-card p-6 hover-lift cursor-pointer" onClick={() => navigate('/jobs')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">View Applications</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track all your job applications and their status.
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
            {[
              { label: 'Create your account', completed: true },
              { label: 'Upload your resume', completed: false },
              { label: 'Set job preferences', completed: false },
              { label: 'Enable auto-apply', completed: false },
            ].map((item) => (
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
      </main>
    </div>
  );
};

export default Dashboard;
