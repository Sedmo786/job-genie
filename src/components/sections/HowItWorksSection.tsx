import { Upload, Settings, Rocket, Trophy } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Resume",
    description: "Upload your resume and let our AI extract your skills, experience, and achievements automatically."
  },
  {
    number: "02",
    icon: Settings,
    title: "Set Your Preferences",
    description: "Tell us your ideal role, salary expectations, preferred locations, and company culture preferences."
  },
  {
    number: "03",
    icon: Rocket,
    title: "AI Starts Applying",
    description: "Our AI agent searches for matching jobs 24/7 and submits tailored applications on your behalf."
  },
  {
    number: "04",
    icon: Trophy,
    title: "Land Interviews",
    description: "Review your applications, track responses, and prepare for interviews with our insights dashboard."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in minutes. Our streamlined process ensures you're applying to jobs 
            within your first 15 minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />

            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`relative flex items-start gap-6 mb-12 last:mb-0 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Step Number & Icon */}
                <div className="flex-shrink-0 relative z-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 glow-effect">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 glass-card p-6 ${index % 2 === 0 ? 'md:mr-auto md:ml-0' : 'md:ml-auto md:mr-0'} md:max-w-md`}>
                  <div className="text-sm font-mono text-primary mb-2">Step {step.number}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
