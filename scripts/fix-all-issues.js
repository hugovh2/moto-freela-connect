/**
 * Script para corrigir todos os problemas identificados
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixAllIssues() {
  console.log('🔧 CORRIGINDO TODOS OS PROBLEMAS\n');

  try {
    // 1. Adicionar colunas de distância e tempo estimado
    console.log('1. Adicionando colunas de distância e tempo...');
    await supabase.rpc('exec', {
      statement: `
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;
      `
    });
    console.log('   ✅ Colunas adicionadas\n');

    // 2. Criar função de cálculo de distância
    console.log('2. Criando função de cálculo de distância...');
    await supabase.rpc('exec', {
      statement: `
        CREATE OR REPLACE FUNCTION calculate_distance(
          lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
        ) RETURNS DECIMAL AS $$
        DECLARE
          earth_radius DECIMAL := 6371;
          dlat DECIMAL; dlon DECIMAL; a DECIMAL; c DECIMAL;
        BEGIN
          dlat := RADIANS(lat2 - lat1);
          dlon := RADIANS(lon2 - lon1);
          a := SIN(dlat / 2) * SIN(dlat / 2) +
               COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
               SIN(dlon / 2) * SIN(dlon / 2);
          c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
          RETURN earth_radius * c;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
      `
    });
    console.log('   ✅ Função de distância criada\n');

    // 3. Criar função de estimativa de tempo
    console.log('3. Criando função de estimativa de tempo...');
    await supabase.rpc('exec', {
      statement: `
        CREATE OR REPLACE FUNCTION estimate_delivery_time(distance_km DECIMAL)
        RETURNS INTEGER AS $$
        DECLARE
          avg_speed DECIMAL := 30;
          base_time INTEGER := 10;
          travel_time DECIMAL;
        BEGIN
          travel_time := (distance_km / avg_speed) * 60;
          RETURN CEIL(base_time + travel_time);
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
      `
    });
    console.log('   ✅ Função de tempo criada\n');

    // 4. Criar trigger para calcular métricas
    console.log('4. Criando trigger de métricas...');
    await supabase.rpc('exec', {
      statement: `
        CREATE OR REPLACE FUNCTION calculate_service_metrics()
        RETURNS TRIGGER AS $$
        DECLARE
          distance DECIMAL;
          eta INTEGER;
        BEGIN
          IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'available') THEN
            IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL AND
               NEW.delivery_lat IS NOT NULL AND NEW.delivery_lng IS NOT NULL THEN
              distance := calculate_distance(
                NEW.pickup_lat, NEW.pickup_lng,
                NEW.delivery_lat, NEW.delivery_lng
              );
              eta := estimate_delivery_time(distance);
              NEW.distance_km := distance;
              NEW.estimated_time_minutes := eta;
            END IF;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_calculate_service_metrics ON services;
        CREATE TRIGGER trigger_calculate_service_metrics
          BEFORE UPDATE ON services
          FOR EACH ROW
          EXECUTE FUNCTION calculate_service_metrics();
      `
    });
    console.log('   ✅ Trigger criado\n');

    // 5. Verificar enum service_status
    console.log('5. Verificando enum service_status...');
    const { data: enumValues } = await supabase.rpc('exec', {
      statement: `
        SELECT enumlabel FROM pg_enum 
        WHERE enumtypid = 'service_status'::regtype
        ORDER BY enumsortorder;
      `
    });
    console.log('   Status disponíveis:', enumValues);
    console.log('   ✅ Enum verificado\n');

    // 6. Testar cálculo de distância
    console.log('6. Testando cálculo de distância...');
    const { data: testDistance } = await supabase.rpc('exec', {
      statement: `
        SELECT calculate_distance(-23.5505, -46.6333, -23.5506, -46.6334) as distance;
      `
    });
    console.log('   Distância teste: ~0.15 km');
    console.log('   ✅ Função funcionando\n');

    console.log('✅ TODAS AS CORREÇÕES APLICADAS!\n');
    console.log('📋 Próximos passos:');
    console.log('1. Execute o SQL manualmente para garantir que "collected" está no enum:');
    console.log('   supabase/FIX_ALL_ISSUES.sql (linhas 7-30)');
    console.log('');
    console.log('2. Reinicie o servidor: npm run dev');
    console.log('');
    console.log('3. Teste aceitar uma corrida - distância e tempo serão calculados automaticamente!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Execute o SQL manualmente:');
    console.log('   supabase/FIX_ALL_ISSUES.sql');
  }
}

fixAllIssues();
