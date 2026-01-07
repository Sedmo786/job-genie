import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-card-gradient" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(174_72%_56%_/_0.08)_0%,_transparent_70%)]" />

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/30 mb-8 glow-effect">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Automate Your{" "}
            <span className="gradient-text">Job Search?</span>
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of job seekers who've already landed their dream jobs using AutoApply. 
            Start your free trial today—no credit card required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" className="group" onClick={() => navigate('/auth')}>
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="heroOutline" size="xl" onClick={() => navigate('/auth')}>
              Talk to Sales
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-12 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-6">Trusted by professionals at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
              {['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple'].map((company) => (
                <span key={company} className="text-lg font-semibold text-muted-foreground">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
