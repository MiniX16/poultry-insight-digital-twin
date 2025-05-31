import { proveedorService } from './lib/services/proveedorService';
import { supabase } from './lib/supabase';

async function testConnection() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase.from('proveedor').select('count').single();
    
    if (connectionError) {
      throw new Error(`Connection test failed: ${connectionError.message}`);
    }
    console.log('✅ Successfully connected to Supabase!');

    // Test 2: Try to fetch all providers
    console.log('\nTesting data fetch...');
    const providers = await proveedorService.getAllProveedores();
    console.log(`✅ Successfully fetched ${providers.length} providers from the database!`);
    
    console.log('\nAll tests passed! Your database connection is working correctly.');
  } catch (error) {
    console.error('\n❌ Error testing connection:', error);
    console.error('\nPlease check your .env file and make sure:');
    console.error('1. VITE_SUPABASE_URL is correct');
    console.error('2. VITE_SUPABASE_ANON_KEY is correct');
    console.error('3. Your Supabase project is running');
    console.error('4. Your IP is allowed to access the database');
  }
}

testConnection(); 