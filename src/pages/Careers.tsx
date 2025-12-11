import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, Zap, Heart } from "lucide-react";

export default function Careers() {
  const navigate = useNavigate();

  const benefits = [
    { icon: Zap, title: "Competitive Salary", description: "We offer competitive compensation packages" },
    { icon: Users, title: "Great Team", description: "Work with talented and passionate people" },
    { icon: Heart, title: "Work-Life Balance", description: "Flexible working hours and remote options" },
    { icon: Briefcase, title: "Growth Opportunities", description: "Continuous learning and career development" },
  ];

  const openPositions = [
    {
      title: "Senior Full-Stack Developer",
      department: "Engineering",
      location: "Remote / Dar es Salaam",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote / Dar es Salaam",
      type: "Full-time",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Dar es Salaam",
      type: "Full-time",
    },
    {
      title: "Customer Success Specialist",
      department: "Support",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-4xl font-bold mb-2 text-foreground">Careers</h1>
          <p className="text-muted-foreground mb-8">Join us in building the future of e-commerce</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Why Work at Blinno?</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                At Blinno, we're building something special—a marketplace that empowers creators and businesses across Tanzania and beyond. We're looking for passionate individuals who want to make a real impact.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <benefit.icon className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Open Positions</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We're always looking for talented individuals to join our team. Check out our current openings:
              </p>
              <div className="space-y-4">
                {openPositions.map((position, index) => (
                  <div key={index} className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{position.title}</h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>{position.department}</span>
                          <span>•</span>
                          <span>{position.location}</span>
                          <span>•</span>
                          <span>{position.type}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Don't See a Role That Fits?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We're always interested in hearing from talented people, even if we don't have a specific role open. Send us your resume and let us know how you'd like to contribute to Blinno.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium mb-2">Send us your application</p>
                <p className="text-muted-foreground">Email: support@blinno.app</p>
                <p className="text-muted-foreground text-sm mt-2">Please include your resume and a brief note about why you're interested in joining Blinno.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

