import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTransactionDates() {
    try {
        console.log('🔍 Obteniendo todas las transacciones...');

        // Get all transactions
        const { data: transactions, error: fetchError } = await supabase
            .from('transactions')
            .select('id, date');

        if (fetchError) {
            console.error('❌ Error al obtener transacciones:', fetchError);
            return;
        }

        console.log(`📊 Encontradas ${transactions.length} transacciones`);

        let updated = 0;
        let errors = 0;

        for (const tx of transactions) {
            try {
                // Add 1 day to the date
                const currentDate = new Date(tx.date);
                currentDate.setDate(currentDate.getDate() + 1);
                const newDate = currentDate.toISOString().split('T')[0];

                // Update the transaction
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({ date: newDate })
                    .eq('id', tx.id);

                if (updateError) {
                    console.error(`❌ Error actualizando transacción ${tx.id}:`, updateError);
                    errors++;
                } else {
                    updated++;
                    console.log(`✅ Actualizada: ${tx.date} → ${newDate} (ID: ${tx.id})`);
                }
            } catch (err) {
                console.error(`❌ Error procesando transacción ${tx.id}:`, err);
                errors++;
            }
        }

        console.log('\n📈 Resumen:');
        console.log(`   ✅ Actualizadas: ${updated}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📊 Total: ${transactions.length}`);

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Run the fix
fixTransactionDates();
