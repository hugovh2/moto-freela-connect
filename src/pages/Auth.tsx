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

    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        handleAuthError(error, 'signin');
        return;
      }

      if (!data.user) {
        toast.error('Erro ao fazer login. Tente novamente.');
        return;
      }

      // Get user role to check access
      const role = await getUserRole(data.user.id);

      if (!role) {
        toast.error('Perfil não encontrado. Entre em contato com o suporte.');
        return;
      }

      toast.success("Login realizado com sucesso!", {
        duration: 2000,
      });

      // Safe navigation with delay
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            const dashboardPath = getDashboardRoute(role);
            safeNavigate(navigate, dashboardPath, { replace: true });
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('[Auth] Signin exception:', error);
      handleAuthError(error, 'signin');
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-card p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">MotoFreela</CardTitle>
          <CardDescription className="text-center">
            Entre ou crie sua conta para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="João Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Você é:</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as any)}>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="motoboy" id="motoboy" />
                      <Label htmlFor="motoboy" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Bike className="h-5 w-5 text-primary" />
                        <span>Motoboy</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="company" id="company" />
                      <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span>Empresa</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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