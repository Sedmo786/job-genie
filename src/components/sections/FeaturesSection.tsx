import { 
  Brain, 
  FileText, 
  Target, 
  Clock, 
  Shield, 
  BarChart3,
  Zap,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Our AI analyzes job descriptions and matches them with your skills, experience, and preferences with 89% accuracy.",
    highlights: ["Skill extraction", "Experience matching", "Culture fit analysis"]
  },
  {
    icon: FileText,
    title: "Smart Resume Tailoring",
    description: "Automatically customizes your resume for each job, highlighting the most relevant experiences and skills.",
    highlights: ["Keyword optimization", "ATS-friendly formatting", "Per-job customization"]
  },
  {
    icon: Target,
    title: "Precision Targeting",
    description: "Set your preferences once and let the AI find jobs that match your salary, location, and role expectations.",
    highlights: ["Salary filters", "Remote/hybrid options", "Industry targeting"]
  },
  {
    icon: Clock,
    title: "24/7 Auto-Apply",
    description: "The agent works around the clock, applying to matching jobs as soon as they're posted—before the competition.",
    highlights: ["Real-time job alerts", "Instant applications", "Batch processing"]
  },
  {
    icon: Shield,
    title: "Full Transparency",
    description: "Review every application before it's sent. Approve, modify, or reject—you're always in control.",
    highlights: ["Application preview", "Edit before send", "Rejection tracking"]
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your application success rate, interview callbacks, and optimize your job search strategy.",
    highlights: ["Success metrics", "Response tracking", "Strategy insights"]
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-card-gradient" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Land Your Dream Job</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From intelligent job matching to automated applications, our AI handles the tedious work 
            so you can focus on what matters—preparing for interviews.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass-card p-6 hover-lift group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
