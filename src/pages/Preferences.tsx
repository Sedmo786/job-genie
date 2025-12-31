import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJobPreferences, type JobPreferencesInput } from '@/hooks/useJobPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowLeft, Loader2, Save } from 'lucide-react';
import { useState } from 'react';

const Preferences = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { preferences, loading, saving, savePreferences } = useJobPreferences();

  const [form, setForm] = useState<JobPreferencesInput>({
    desired_roles: [],
    min_salary: null,
    max_salary: null,
    salary_currency: 'USD',
    locations: [],
    remote_preference: 'any',
    experience_level: 'mid',
    job_types: ['full-time'],
    industries: [],
  });

  const [rolesInput, setRolesInput] = useState('');
  const [locationsInput, setLocationsInput] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (preferences) {
      setForm({
        desired_roles: preferences.desired_roles || [],
        min_salary: preferences.min_salary,
        max_salary: preferences.max_salary,
        salary_currency: preferences.salary_currency || 'USD',
        locations: preferences.locations || [],
        remote_preference: preferences.remote_preference || 'any',
        experience_level: preferences.experience_level || 'mid',
        job_types: preferences.job_types || ['full-time'],
        industries: preferences.industries || [],
      });
      setRolesInput((preferences.desired_roles || []).join(', '));
      setLocationsInput((preferences.locations || []).join(', '));
    }
  }, [preferences]);

  const handleSave = async () => {
    const updatedForm = {
      ...form,
      desired_roles: rolesInput.split(',').map(r => r.trim()).filter(Boolean),
      locations: locationsInput.split(',').map(l => l.trim()).filter(Boolean),
    };
    await savePreferences(updatedForm);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Job Preferences</h1>

        <Card>
          <CardHeader>
            <CardTitle>Define Your Ideal Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Desired Roles (comma-separated)</Label>
              <Input
                placeholder="Software Engineer, Full Stack Developer, Backend Engineer"
                value={rolesInput}
                onChange={(e) => setRolesInput(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Salary</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={form.min_salary || ''}
                  onChange={(e) => setForm({ ...form, min_salary: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Salary</Label>
                <Input
                  type="number"
                  placeholder="150000"
                  value={form.max_salary || ''}
                  onChange={(e) => setForm({ ...form, max_salary: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Locations (comma-separated)</Label>
              <Input
                placeholder="San Francisco, New York, Remote"
                value={locationsInput}
                onChange={(e) => setLocationsInput(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Remote Preference</Label>
                <Select value={form.remote_preference} onValueChange={(v) => setForm({ ...form, remote_preference: v as typeof form.remote_preference })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="remote">Remote Only</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v as typeof form.experience_level })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Preferences;
