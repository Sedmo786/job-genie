import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>AutoApply - AI-Powered Job Applications | Apply to 100+ Jobs Automatically</title>
        <meta 
          name="description" 
          content="Automate your job search with AI. AutoApply reads job descriptions, matches your skills, tailors your resume, and submits applications while you sleep." 
        />
        <meta name="keywords" content="job application, AI job search, automatic job apply, resume tailoring, career automation" />
        <link rel="canonical" href="https://autoapply.ai" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
