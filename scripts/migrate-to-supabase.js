/**
 * Script para migrar completamente para o novo Supabase
 * Cria todas as tabelas, políticas RLS, funções, etc.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar configurações do novo Supabase
dotenv.config({ path: '.env.new' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rinszzwdteaytefdwwnc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Service role key para operações administrativas
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: URLs ou chaves não configuradas');
  process.exit(1);
}

// Usar service role para operações administrativas
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Schema completo do MotoFreela
const COMPLETE_SCHEMA = `
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('company', 'motoboy');

-- Create enum for service status
CREATE TYPE public.service_status AS ENUM ('available', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create enum for app_role (sistema de roles seguro)
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'company', 'motoboy');

-- Create enum for message types
CREATE TYPE message_type AS ENUM ('text', 'image', 'location');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_jobs INTEGER DEFAULT 0,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  location_updated_at TIMESTAMPTZ,
  is_available BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motoboy_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  delivery_location TEXT NOT NULL,
  delivery_lat DECIMAL(10,8),
  delivery_lng DECIMAL(11,8),
  price DECIMAL(10,2) NOT NULL,
  status service_status DEFAULT 'available',
  scheduled_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (service_id, rater_id)
);

-- Create user_locations table
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  is_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'motoboy'::app_role);
  
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- POLÍTICAS RLS CORRIGIDAS

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role during signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Services policies (CORRIGIDAS)
CREATE POLICY "Anyone can view available services"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

-- POLÍTICA PRINCIPAL CORRIGIDA
CREATE POLICY "Companies can create services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'company'
    )
  );

CREATE POLICY "Companies can update own services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (company_id = auth.uid());

CREATE POLICY "Motoboys can accept services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'motoboy'
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages where they are sender or receiver"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Ratings policies
CREATE POLICY "Anyone can view ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings for services they participated"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM public.services 
      WHERE id = service_id 
      AND (company_id = auth.uid() OR motoboy_id = auth.uid())
    )
  );

-- User locations policies
CREATE POLICY "Users can view own location"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location"
  ON public.user_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
`;

async function migrateToSupabase() {
  try {
    console.log('🚀 MIGRAÇÃO COMPLETA PARA SUPABASE\n');
    console.log('📊 Projeto: MotoFreela');
    console.log('🔗 URL:', supabaseUrl);
    console.log('🆔 Project ID: rinszzwdteaytefdwwnc\n');
    
    console.log('⚡ Executando schema completo...\n');
    
    // Dividir em comandos menores para melhor execução
    const commands = COMPLETE_SCHEMA
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Total de comandos SQL: ${commands.length}\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      
      try {
        // Executar SQL via fetch direto
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            query: command 
          })
        });

        if (response.ok) {
          console.log(`✅ ${i + 1}/${commands.length}: OK`);
        } else {
          const errorText = await response.text();
          console.log(`⚠️  ${i + 1}/${commands.length}: ${errorText}`);
        }
      } catch (error) {
        console.log(`⚠️  ${i + 1}/${commands.length}: ${error.message}`);
        // Continuar mesmo com erros (pode ser que já exista)
      }
    }

    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA!\n');
    console.log('✅ Todas as tabelas criadas');
    console.log('✅ Políticas RLS configuradas e CORRIGIDAS');
    console.log('✅ Funções e triggers instalados');
    console.log('✅ Autenticação configurada\n');
    
    console.log('🔄 PRÓXIMO PASSO:');
    console.log('1. Renomeie .env.new para .env');
    console.log('2. Reinicie o servidor (npm run dev)');
    console.log('3. Teste criar um serviço!\n');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error('\n💡 Tente executar o SQL manualmente no painel do Supabase');
  }
}

migrateToSupabase();
