import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bike, Package, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-delivery.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-primary-foreground animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Conectando Empresas e Motoboys
              </h1>
              <p className="text-xl mb-8 text-primary-foreground/90">
                A plataforma mais rápida e confiável para entregas e serviços logísticos
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg">
                    Sou Empresa
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    Sou Motoboy
                  </Button>
                </Link>
              </div>
            </div>
            <div className="animate-slide-up">
              <img 
                src={heroImage} 
                alt="Motoboy em ação" 
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Por que escolher o MotoFreela?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Bike className="h-10 w-10" />}
              title="Motoboys Verificados"
              description="Todos os profissionais são verificados e avaliados"
            />
            <FeatureCard 
              icon={<Package className="h-10 w-10" />}
              title="Entregas Rápidas"
              description="Conecte-se com motoboys próximos em tempo real"
            />
            <FeatureCard 
              icon={<Clock className="h-10 w-10" />}
              title="Disponível 24/7"
              description="Publique e aceite serviços a qualquer hora"
            />
            <FeatureCard 
              icon={<Star className="h-10 w-10" />}
              title="Sistema de Avaliação"
              description="Avaliações transparentes e confiáveis"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-card py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de empresas e motoboys que já usam o MotoFreela
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-all duration-300 animate-scale-in">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;