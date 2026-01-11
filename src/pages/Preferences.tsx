import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJobPreferences, type JobPreferencesInput, type AutoApplySchedule } from '@/hooks/useJobPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, ArrowLeft, Loader2, Save, Zap, AlertTriangle, Clock, Mail, Play, Timer, Calendar, Settings } from 'lucide-react';
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
    auto_apply_enabled: false,
    auto_apply_threshold: 75,
    auto_apply_daily_limit: 10,
    auto_apply_schedule: 'manual',
    auto_apply_email_notifications: true,
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
        auto_apply_enabled: preferences.auto_apply_enabled || false,
        auto_apply_threshold: preferences.auto_apply_threshold || 75,
        auto_apply_daily_limit: preferences.auto_apply_daily_limit || 10,
        auto_apply_schedule: preferences.auto_apply_schedule || 'manual',
        auto_apply_email_notifications: preferences.auto_apply_email_notifications ?? true,
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
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Auto-Apply</CardTitle>
                <CardDescription>Automatically apply to matching jobs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
              <div>
                <p className="font-medium">Enable Auto-Apply</p>
                <p className="text-sm text-muted-foreground">Automatically apply to jobs above your match threshold</p>
              </div>
              <Switch
                checked={form.auto_apply_enabled}
                onCheckedChange={(checked) => setForm({ ...form, auto_apply_enabled: checked })}
              />
            </div>

            {form.auto_apply_enabled && (
              <>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-500">Important</p>
                    <p className="text-muted-foreground">Auto-apply will submit applications on your behalf. Make sure your resume and profile are up to date.</p>
                  </div>
                </div>

                {/* Schedule Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <Label className="text-base font-medium">When to Auto-Apply</Label>
                  </div>
                  <RadioGroup
                    value={form.auto_apply_schedule}
                    onValueChange={(v) => setForm({ ...form, auto_apply_schedule: v as AutoApplySchedule })}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="manual" id="manual" />
                      <div className="flex-1">
                        <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          Manual
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Trigger auto-apply yourself</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="now" id="now" />
                      <div className="flex-1">
                        <Label htmlFor="now" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Play className="h-4 w-4 text-green-500" />
                          Apply Now
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Apply immediately on matches</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="after_1hr" id="after_1hr" />
                      <div className="flex-1">
                        <Label htmlFor="after_1hr" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Timer className="h-4 w-4 text-blue-500" />
                          After 1 Hour
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Review before applying</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="daily_automatic" id="daily_automatic" />
                      <div className="flex-1">
                        <Label htmlFor="daily_automatic" className="flex items-center gap-2 cursor-pointer font-medium">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          Daily Automatic
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">Auto-apply once per day</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Match Threshold</Label>
                      <span className="text-sm font-medium text-primary">{form.auto_apply_threshold}%</span>
                    </div>
                    <Slider
                      value={[form.auto_apply_threshold || 75]}
                      onValueChange={(v) => setForm({ ...form, auto_apply_threshold: v[0] })}
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Only auto-apply to jobs with a match score above this threshold</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Daily Limit</Label>
                      <span className="text-sm font-medium text-primary">{form.auto_apply_daily_limit} jobs/day</span>
                    </div>
                    <Slider
                      value={[form.auto_apply_daily_limit || 10]}
                      onValueChange={(v) => setForm({ ...form, auto_apply_daily_limit: v[0] })}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of auto-applications per day</p>
                  </div>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified when applications are submitted</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.auto_apply_email_notifications}
                    onCheckedChange={(checked) => setForm({ ...form, auto_apply_email_notifications: checked })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Preferences
        </Button>
      </main>
    </div>
  );
};

export default Preferences;
