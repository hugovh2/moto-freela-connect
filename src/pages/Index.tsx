import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Bike, 
  Package, 
  Clock, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  MapPin,
  Smartphone,
  CreditCard
} from "lucide-react";

const Index = () => {
  const stats = [
    { number: "500+", label: "Motoboys Ativos" },
    { number: "2.5k+", label: "Entregas Realizadas" },
    { number: "4.9", label: "Avaliação Média" },
    { number: "15min", label: "Tempo Médio" }
  ];

  const benefits = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Super Rápido",
      description: "Conecte-se com motoboys próximos em segundos"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "100% Seguro",
      description: "Todos os profissionais são verificados"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Rede Ampla",
      description: "Milhares de motoboys disponíveis"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Preços Justos",
      description: "Tarifas transparentes e competitivas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/20 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Bike className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              MotoFreela
            </span>
          </div>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              Entrar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative">
          <div className="text-center max-w-5xl mx-auto mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 px-6 py-2 text-sm">
              🚀 A revolução das entregas chegou!
            </Badge>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-white">
                Conectando
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Empresas & Motoboys
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              A plataforma mais <strong>rápida</strong>, <strong>segura</strong> e <strong>eficiente</strong> para entregas urbanas. 
              Junte-se a milhares de usuários satisfeitos!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/auth" className="group">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Package className="h-5 w-5 mr-2" />
                  Sou Empresa
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth" className="group">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 transform hover:scale-105">
                  <Bike className="h-5 w-5 mr-2" />
                  Sou Motoboy
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Por que escolher o 
              </span>
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                MotoFreela?
              </span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Tecnologia de ponta para conectar você ao futuro das entregas
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 bg-blue-100 text-blue-600 border-blue-200">
                Recursos Avançados
              </Badge>
              <h3 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                Tecnologia que faz a diferença
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Rastreamento em Tempo Real</h4>
                    <p className="text-slate-600 dark:text-slate-300">Acompanhe sua entrega do início ao fim com GPS de alta precisão</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Chat Integrado</h4>
                    <p className="text-slate-600 dark:text-slate-300">Comunicação direta e instantânea entre empresa e motoboy</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Avaliações Detalhadas</h4>
                    <p className="text-slate-600 dark:text-slate-300">Sistema completo de feedback para garantir qualidade</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl transform rotate-6"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">GPS</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Precisão</div>
                  </div>
                  <div className="text-center">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-pink-500" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">App</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Nativo</div>
                  </div>
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">PIX</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Pagamento</div>
                  </div>
                  <div className="text-center">
                    <Star className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">4.9</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Avaliação</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="container mx-auto text-center relative">
          <Badge className="mb-6 bg-white/20 text-white border-white/30">
            ✨ Comece hoje mesmo
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Pronto para a revolução?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Junte-se a <strong>milhares</strong> de empresas e motoboys que já transformaram 
            suas entregas com o MotoFreela
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/auth" className="group">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-white text-slate-900 hover:bg-white/90 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                <Zap className="h-5 w-5 mr-2" />
                Começar Agora - É Grátis!
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 text-white/80 text-sm">
            <p>✅ Sem taxa de adesão • ✅ Suporte 24/7 • ✅ Cancelamento gratuito</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">MotoFreela</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Conectando empresas e motoboys com tecnologia de ponta para entregas mais rápidas e eficientes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Para Empresas</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Como funciona</li>
                <li>Preços</li>
                <li>API</li>
                <li>Suporte</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Para Motoboys</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Cadastre-se</li>
                <li>Ganhe dinheiro</li>
                <li>Aplicativo</li>
                <li>Central de ajuda</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Sobre nós</li>
                <li>Termos de uso</li>
                <li>Privacidade</li>
                <li>Contato</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 MotoFreela. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;