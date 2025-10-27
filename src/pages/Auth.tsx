import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signInWithEmail, signUpWithEmail, getCurrentUser, getUserProfile, getUserRole } from "@/lib/supabase-client";
import { safeNavigate, getDashboardRoute } from "@/lib/navigation";
import { validateEmail, validatePassword, validateRequired, handleAuthError } from "@/lib/error-handler";
import { toast } from "sonner";
import { Bike, Building2, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"company" | "motoboy">("motoboy");
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    checkExistingAuth();
    
    return () => {
      setIsMounted(false);
    };
  }, []);

  const checkExistingAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (user && isMounted) {
        const role = await getUserRole(user.id);
        if (role) {
          const dashboardPath = getDashboardRoute(role);
          safeNavigate(navigate, dashboardPath, { replace: true });
        }
      }
    } catch (error) {
      // Silently fail - user is not authenticated
      console.log('[Auth] No existing session');
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent double submission
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const fullName = (formData.get("fullName") as string)?.trim();
    const userRole = role; // Armazena a role selecionada

    // Validate required fields
    const requiredError = validateRequired(
      { email, password, fullName },
      { email: 'Email', password: 'Senha', fullName: 'Nome completo' }
    );
    if (requiredError) {
      toast.error(requiredError);
      return;
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      // Passa a role correta para o cadastro
      const { data, error } = await signUpWithEmail(email, password, {
        full_name: fullName,
        role: userRole, // Usa a role armazenada
      });

      if (error) {
        handleAuthError(error, 'signup');
        return;
      }

      if (!data?.user) {
        toast.error('Erro ao criar conta. Tente novamente.');
        return;
      }

      // Verifica se o perfil foi criado com a role correta
      const userProfile = await getUserProfile(data.user.id);
      const finalRole = userProfile?.role || userRole;

      toast.success("Conta criada com sucesso! Redirecionando...", {
        duration: 2000,
      });

      // Safe navigation with delay
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            const dashboardPath = getDashboardRoute(finalRole);
            console.log(`[Auth] Redirecionando para: ${dashboardPath} (role: ${finalRole})`);
            safeNavigate(navigate, dashboardPath, { replace: true });
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('[Auth] Signup exception:', error);
      handleAuthError(error, 'signup');
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent double submission
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    // Validate required fields
    const requiredError = validateRequired(
      { email, password },
      { email: 'Email', password: 'Senha' }
    );
    if (requiredError) {
      toast.error(requiredError);
      return;
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsLoading(true);
    console.log('[Auth] Iniciando login...');

    try {
      console.log('[Auth] Chamando signInWithEmail...');
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        console.error('[Auth] Erro no signInWithEmail:', error);
        handleAuthError(error, 'signin');
        return;
      }

      if (!data?.user) {
        console.error('[Auth] Nenhum usuário retornado');
        toast.error('Erro ao fazer login. Tente novamente.');
        return;
      }

      console.log('[Auth] Usuário autenticado:', data.user.id);

      // Get user role to check access com timeout adicional
      console.log('[Auth] Buscando role do usuário...');
      let role: string | null = null;
      
      try {
        // Timeout de 8 segundos para buscar role
        const rolePromise = getUserRole(data.user.id);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar role')), 8000)
        );
        
        role = await Promise.race([rolePromise, timeoutPromise]);
        console.log('[Auth] Role encontrada:', role);
      } catch (roleError) {
        console.error('[Auth] Erro ao buscar role:', roleError);
        // Se falhar, usa role padrão
        role = 'motoboy';
        console.log('[Auth] Usando role padrão:', role);
      }

      if (!role) {
        console.warn('[Auth] Role null, usando motoboy como padrão');
        role = 'motoboy';
      }

      console.log('[Auth] Login bem-sucedido, preparando navegação...');
      toast.success("Login realizado com sucesso!", {
        duration: 1500,
      });

      // Safe navigation with delay reduzido
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            const dashboardPath = getDashboardRoute(role);
            console.log('[Auth] Navegando para:', dashboardPath);
            try {
              safeNavigate(navigate, dashboardPath, { replace: true });
            } catch (navError) {
              console.error('[Auth] Erro na navegação:', navError);
              toast.error('Erro ao redirecionar. Recarregue o app.');
            }
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('[Auth] Signin exception:', error);
      handleAuthError(error, 'signin');
    } finally {
      if (isMounted) {
        setTimeout(() => setIsLoading(false), 100);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-2 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md animate-scale-in relative z-10 border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
        <CardHeader className="space-y-4 pb-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Bike className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-slate-900"></div>
            </div>
          </div>
          
          <div className="text-center">
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
              MotoFreela
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              Entre ou crie sua conta para começar
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <TabsTrigger 
                value="signin" 
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md transition-all duration-300"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md transition-all duration-300"
              >
                Criar Conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="h-12 px-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Senha
                  </Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-12 px-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl transition-colors"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {role === 'company' ? 'Nome da Empresa' : 'Nome Completo'}
                  </Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder={role === 'company' ? 'Sua Empresa LTDA' : 'João Silva'}
                    required
                    className="h-12 px-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="h-12 px-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Senha
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-12 px-4 text-base border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-500 rounded-xl transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Você é:</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="space-y-3">
                    <div className="relative">
                      <RadioGroupItem value="motoboy" id="motoboy" className="peer sr-only" />
                      <Label 
                        htmlFor="motoboy" 
                        className="flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 dark:peer-data-[state=checked]:bg-orange-950/30 peer-data-[state=checked]:shadow-md"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white peer-data-[state=checked]:scale-110 transition-transform">
                          <Bike className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white">Motoboy</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Quero fazer entregas</div>
                        </div>
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="company" id="company" className="peer sr-only" />
                      <Label 
                        htmlFor="company" 
                        className="flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 dark:peer-data-[state=checked]:bg-orange-950/30 peer-data-[state=checked]:shadow-md"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white peer-data-[state=checked]:scale-110 transition-transform">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white">Empresa</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Preciso de entregas</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;