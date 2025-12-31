import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/hooks/useApplications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft, Loader2, Briefcase, MapPin, ExternalLink, Trash2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  saved: 'bg-secondary text-secondary-foreground',
  applied: 'bg-blue-500/20 text-blue-500',
  auto_applied: 'bg-green-500/20 text-green-500',
  screening: 'bg-yellow-500/20 text-yellow-500',
  interviewing: 'bg-purple-500/20 text-purple-500',
  offer: 'bg-emerald-500/20 text-emerald-500',
  rejected: 'bg-red-500/20 text-red-500',
  withdrawn: 'bg-muted text-muted-foreground',
  manual_required: 'bg-orange-500/20 text-orange-500',
  failed: 'bg-red-500/20 text-red-500',
};

const Applications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { applications, loading, deleteApplication, getStatsByStatus } = useApplications();
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = getStatsByStatus();
  const filteredApps = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold">Auto<span className="text-primary">Apply</span></span>
              </Link>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Applications Tracker</h1>

        <div className="flex gap-2 flex-wrap mb-6">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All ({applications.length})
          </Button>
          <Button variant={filter === 'applied' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('applied')}>
            Applied ({stats.applied + stats.auto_applied})
          </Button>
          <Button variant={filter === 'interviewing' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('interviewing')}>
            Interviewing ({stats.interviewing})
          </Button>
          <Button variant={filter === 'offer' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('offer')}>
            Offers ({stats.offer})
          </Button>
        </div>

        {filteredApps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No applications yet. Start by finding jobs!</p>
              <Button className="mt-4" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApps.map((app) => (
              <Card key={app.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{app.job_title}</h3>
                        <Badge className={statusColors[app.status]}>{app.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-muted-foreground">{app.company_name}</p>
                      {app.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> {app.location}
                        </p>
                      )}
                      {app.match_score && (
                        <p className="text-sm text-primary mt-2">Match Score: {app.match_score}%</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {app.job_url && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteApplication(app.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Applications;
