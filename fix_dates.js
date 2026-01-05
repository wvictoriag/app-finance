import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://nfinmwwrhwmaovndpqzf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5maW5td3dyaHdtYW92bmRwcXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDEwNTYsImV4cCI6MjA4MTM3NzA1Nn0.daRekJvSoqcwbTtcBQ63ZrCYUUuzqKHbn-GoK_G6uGg';

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
