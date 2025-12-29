import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Target } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8 animate-fade-in">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Job Applications</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 opacity-0 animate-fade-in animation-delay-200">
            Apply to{" "}
            <span className="gradient-text">100+ Jobs</span>
            <br />
            While You Sleep
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in animation-delay-400">
            Our AI agent reads job descriptions, matches your skills, tailors your resume, 
            and submits applications automatically. You focus on interviews, we handle the rest.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 opacity-0 animate-fade-in animation-delay-600">
            <Button variant="hero" size="xl" className="group">
              Start Applying Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto opacity-0 animate-fade-in animation-delay-600">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Applications Sent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">89%</div>
              <div className="text-sm text-muted-foreground">Match Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">3.2x</div>
              <div className="text-sm text-muted-foreground">More Interviews</div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/3 left-10 hidden lg:block opacity-0 animate-fade-in animation-delay-600">
          <div className="glass-card p-4 animate-float">
            <Target className="h-6 w-6 text-primary mb-2" />
            <div className="text-sm font-medium">Smart Matching</div>
          </div>
        </div>
        <div className="absolute top-1/2 right-10 hidden lg:block opacity-0 animate-fade-in animation-delay-600">
          <div className="glass-card p-4 animate-float" style={{ animationDelay: '2s' }}>
            <Shield className="h-6 w-6 text-primary mb-2" />
            <div className="text-sm font-medium">Full Control</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
