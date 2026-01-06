import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJobs } from '@/hooks/useJobs';
import { useApplications } from '@/hooks/useApplications';
import { useAutoApply } from '@/hooks/useAutoApply';
import { useJobPreferences } from '@/hooks/useJobPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, Loader2, Search, MapPin, Briefcase, ExternalLink, Plus, Zap, Rocket } from 'lucide-react';
import { toast } from 'sonner';

const Jobs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { jobs, matchedJobs, loading, matching, fetchJobs, matchJobs, hasMore, loadMore } = useJobs();
  const { addApplication, refetch: refetchApplications } = useApplications();
  const { autoApply, applying } = useAutoApply();
  const { preferences } = useJobPreferences();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [showMatched, setShowMatched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSearch = () => {
    fetchJobs(query, location, remoteOnly, true);
  };

  const handleMatch = async () => {
    if (jobs.length > 0) {
      await matchJobs(jobs.map(j => j.id));
      setShowMatched(true);
    }
  };

  const handleAutoApply = async () => {
    if (matchedJobs.length === 0) {
      toast.error('Match jobs first to use auto-apply');
      return;
    }
    
    const matches = matchedJobs.map(m => ({
      job_id: m.job.id,
      score: m.score,
      reasons: m.reasons,
      explanation: m.explanation,
    }));
    
    const result = await autoApply(matches);
    if (result?.summary && (result.summary.auto_applied > 0 || result.summary.manual_required > 0)) {
      refetchApplications();
    }
  };

  const handleSaveJob = async (job: typeof jobs[0], score?: number) => {
    await addApplication({
      job_posting_id: job.id,
      job_title: job.title,
      company_name: job.company,
      company_logo_url: job.company_logo_url || undefined,
      job_url: job.apply_url || undefined,
      job_description: job.description || undefined,
      location: job.location || undefined,
      work_type: job.work_type || undefined,
      match_score: score,
      status: 'saved',
    });
  };

  const handleApply = (job: typeof jobs[0]) => {
    if (job.apply_url) {
      window.open(job.apply_url, '_blank');
      toast.info('Opening application page. Track it in your Applications.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayJobs = showMatched ? matchedJobs : jobs.map(j => ({ job: j, score: 0, reasons: {} as never, explanation: '' }));

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
        <h1 className="text-3xl font-bold mb-6">Discover Jobs</h1>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Job title, skills, or company"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="remote" checked={remoteOnly} onCheckedChange={setRemoteOnly} />
                <Label htmlFor="remote">Remote only</Label>
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </div>
            {jobs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleMatch} disabled={matching}>
                  {matching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  AI Match ({matchedJobs.length})
                </Button>
                {matchedJobs.length > 0 && preferences?.auto_apply_enabled && (
                  <Button onClick={handleAutoApply} disabled={applying} className="bg-green-600 hover:bg-green-700">
                    {applying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                    Auto-Apply ({preferences.auto_apply_threshold}%+ matches)
                  </Button>
                )}
                {matchedJobs.length > 0 && !preferences?.auto_apply_enabled && (
                  <Button variant="outline" onClick={() => navigate('/preferences')} className="text-muted-foreground">
                    <Rocket className="h-4 w-4 mr-2" />
                    Enable Auto-Apply
                  </Button>
                )}
                {showMatched && (
                  <Button variant="ghost" onClick={() => setShowMatched(false)}>Show All Jobs</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {displayJobs.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Search for jobs to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayJobs.map(({ job, score }) => (
              <Card key={job.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {job.company_logo_url ? (
                      <img src={job.company_logo_url} alt={job.company} className="w-12 h-12 rounded-lg object-contain bg-muted" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.location && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" /> {job.location}
                      </Badge>
                    )}
                    {job.work_type && <Badge variant="outline" className="text-xs">{job.work_type}</Badge>}
                    {score > 0 && <Badge className="bg-primary/20 text-primary">{score}% match</Badge>}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSaveJob(job, score)}>
                      <Plus className="h-4 w-4 mr-1" /> Save
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handleApply(job)}>
                      <ExternalLink className="h-4 w-4 mr-1" /> Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {hasMore && jobs.length > 0 && !showMatched && (
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;
