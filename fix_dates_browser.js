// SCRIPT PARA CORREGIR FECHAS DE TRANSACCIONES
// Ejecuta esto en la consola del navegador (F12) mientras estás logueado en la app

async function fixAllTransactionDates() {
    try {
        console.log('🔍 Obteniendo todas las transacciones...');

        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            console.error('❌ No hay usuario autenticado');
            return;
        }

        // Get all user's transactions
        const { data: transactions, error: fetchError } = await window.supabase
            .from('transactions')
            .select('id, date')
            .eq('user_id', user.id);

        if (fetchError) {
            console.error('❌ Error al obtener transacciones:', fetchError);
            return;
        }

        console.log(`📊 Encontradas ${transactions.length} transacciones`);

        if (transactions.length === 0) {
            console.log('✅ No hay transacciones para corregir');
            return;
        }

        const confirm = window.confirm(
            `Se corregirán ${transactions.length} transacciones.\n\n` +
            `Cada fecha se incrementará en 1 día.\n\n` +
            `¿Deseas continuar?`
        );

        if (!confirm) {
            console.log('❌ Operación cancelada por el usuario');
            return;
        }

        let updated = 0;
        let errors = 0;

        for (const tx of transactions) {
            try {
                // Add 1 day to the date
                const currentDate = new Date(tx.date + 'T12:00:00');
                currentDate.setDate(currentDate.getDate() + 1);
                const newDate = currentDate.toISOString().split('T')[0];

                // Update the transaction
                const { error: updateError } = await window.supabase
                    .from('transactions')
                    .update({ date: newDate })
                    .eq('id', tx.id);

                if (updateError) {
                    console.error(`❌ Error actualizando transacción ${tx.id}:`, updateError);
                    errors++;
                } else {
                    updated++;
                    console.log(`✅ ${tx.date} → ${newDate}`);
                }
            } catch (err) {
                console.error(`❌ Error procesando transacción ${tx.id}:`, err);
                errors++;
            }
        }

        console.log('\n📈 RESUMEN:');
        console.log(`   ✅ Actualizadas: ${updated}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📊 Total: ${transactions.length}`);
        console.log('\n🔄 Recarga la página para ver los cambios');

        if (updated > 0) {
            alert(`✅ Se corrigieron ${updated} transacciones.\n\nRecarga la página para ver los cambios.`);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar
fixAllTransactionDates();
