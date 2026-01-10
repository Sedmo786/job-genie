import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  FileText, 
  Settings, 
  Search, 
  Zap, 
  Rocket, 
  CheckCircle2,
  BarChart3,
  Mail,
  Play,
  X
} from 'lucide-react';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  animation: string;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: 'Upload Your Resume',
    description: 'Start by uploading your resume in PDF or DOCX format. Our AI will analyze your skills, experience, and qualifications to create a comprehensive profile.',
    icon: Upload,
    color: 'text-blue-500',
    animation: 'animate-bounce',
  },
  {
    id: 2,
    title: 'AI Resume Analysis',
    description: 'Our advanced AI extracts key information including your skills, work history, education, and experience level. This data powers intelligent job matching.',
    icon: FileText,
    color: 'text-purple-500',
    animation: 'animate-pulse',
  },
  {
    id: 3,
    title: 'Set Your Preferences',
    description: 'Define your ideal job: desired roles, salary range, locations, remote preference, and experience level. The more specific, the better the matches!',
    icon: Settings,
    color: 'text-amber-500',
    animation: 'animate-spin-slow',
  },
  {
    id: 4,
    title: 'Discover Matching Jobs',
    description: 'Search through thousands of job postings from top companies. Our system aggregates jobs from multiple sources and presents them in one place.',
    icon: Search,
    color: 'text-cyan-500',
    animation: 'animate-pulse',
  },
  {
    id: 5,
    title: 'AI Job Matching',
    description: 'Each job is scored against your profile. See match percentages based on skills, experience, location, salary, and role alignment.',
    icon: Zap,
    color: 'text-yellow-500',
    animation: 'animate-bounce',
  },
  {
    id: 6,
    title: 'Auto-Apply Feature',
    description: 'Enable auto-apply to automatically submit applications to jobs that match above your threshold. Set daily limits and let the AI work for you!',
    icon: Rocket,
    color: 'text-green-500',
    animation: 'animate-pulse',
  },
  {
    id: 7,
    title: 'Track Applications',
    description: 'Monitor all your applications in one dashboard. Track statuses from saved to applied, interviewing, and offers received.',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    animation: 'animate-bounce',
  },
  {
    id: 8,
    title: 'Analytics & Insights',
    description: 'View detailed analytics on your job search: applications sent, response rates, interview conversions, and daily activity trends.',
    icon: BarChart3,
    color: 'text-indigo-500',
    animation: 'animate-pulse',
  },
  {
    id: 9,
    title: 'Email Notifications',
    description: 'Receive daily email digests with new job matches, application status updates, and auto-apply summaries. Never miss an opportunity!',
    icon: Mail,
    color: 'text-pink-500',
    animation: 'animate-bounce',
  },
];

const Demo = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(((currentStep + 1) / demoSteps.length) * 100);
  }, [currentStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= demoSteps.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const step = demoSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold">Auto<span className="text-primary">Apply</span></span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <X className="h-4 w-4 mr-2" /> Close Demo
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              How <span className="gradient-text">AutoApply</span> Works
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover how our AI-powered platform automates your job search and helps you land your dream job faster.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {demoSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {demoSteps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-primary scale-125' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Current Step Card */}
          <Card className="glass-card overflow-hidden mb-8">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Animation Side */}
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 flex items-center justify-center min-h-[300px]">
                  <div className={`relative ${step.animation}`}>
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl bg-card border border-border shadow-xl">
                      <StepIcon className={`h-16 w-16 ${step.color}`} />
                    </div>
                  </div>
                </div>
                
                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${step.color} mb-4`}>
                    <StepIcon className="h-4 w-4" />
                    Step {currentStep + 1}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">{step.title}</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              >
                {isAutoPlaying ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Auto-Play
                  </>
                )}
              </Button>
            </div>

            {currentStep < demoSteps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((prev) => Math.min(demoSteps.length - 1, prev + 1))}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button variant="hero" onClick={() => navigate('/auth')} className="group">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </div>

          {/* Quick Overview Cards */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold mb-6 text-center">Quick Overview</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {demoSteps.slice(0, 3).map((s, index) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(index)}
                    className={`glass-card p-6 text-left transition-all hover:border-primary/30 ${
                      index === currentStep ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                  >
                    <Icon className={`h-8 w-8 ${s.color} mb-3`} />
                    <h4 className="font-semibold mb-1">{s.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="glass-card p-8 inline-block">
              <h3 className="text-2xl font-bold mb-4">Ready to Automate Your Job Search?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join thousands of job seekers who've landed their dream jobs using AutoApply.
              </p>
              <Button variant="hero" size="xl" onClick={() => navigate('/auth')} className="group">
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Demo;
