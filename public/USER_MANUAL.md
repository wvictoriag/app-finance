# Manual de Usuario - Guapacha Finance

Bienvenido al manual oficial de **Guapacha Finance**. Este documento te ayudará a entender cómo configurar y sacar el máximo provecho de la aplicación para llevar un control total de tus finanzas.

---

## 🚀 Guía de Inicio Rápido para Nuevos Usuarios

Si acabas de registrarte, sigue este flujo para configurar tu ecosistema financiero correctamente:

### Paso 1: Configurar el País y Categorías
La aplicación detecta automáticamente tu región (o puedes cambiarla en el seleccionador superior). Esto cargará las categorías de gastos e ingresos predeterminadas para tu país (ej. IVA en Chile, 4x1000 en Colombia).

### Paso 2: Crear tus Cuentas (El Cimiento)
Ve al panel de **Cuentas** y pulsa el botón `+`.
- **Saldo Inicial**: Ingresa cuánto dinero tenías antes de empezar a registrar movimientos (ej. al 1 de enero).
- **Saldo Actual**: **DEBE COINCIDIR** con el saldo inicial si estás empezando hoy. Si no coinciden, verás un aviso de "Descuadrada" inmediatamente.
- **Tipos de Cuenta**: Selecciona "Checking" para cuentas corrientes, "Credit" para tarjetas, y "Receivable" para deudas que otros tienen contigo (CxC).

### Paso 3: Registrar tu Primer Ingreso
Añade una transacción de tipo **Ingreso**. Esto alimentará tu patrimonio y aparecerá en las barras verdes de tus gráficos.

---

## 1. Configuración Detallada de Cuentas
Al crear una cuenta, la categoría define cómo afecta al **Patrimonio Neto**:

| Tipo de Cuenta | Impacto en Patrimonio | Recomendación de Saldo |
| :--- | :--- | :--- |
| **Corriente / Ahorro / Efectivo** | Suma (+) | Ingresa saldos **POSITIVOS** (lo que tienes). |
| **Tarjetas / Líneas de Crédito** | Resta (-) | Ingresa saldos **NEGATIVOS** (lo que debes). |
| **Cuentas por Cobrar (CxC)** | Suma (+) | Ingresa saldos **POSITIVOS** (lo que te deben). |
| **Cuentas por Pagar (CxP)** | Resta (-) | Ingresa saldos **NEGATIVOS** (lo que debes pagar). |
| **Inversiones / Activos / Bienes** | Suma (+) | Ingresa saldos **POSITIVOS** (valor del bien). |

### 🤔 ¿Por qué usar números negativos?
Para que el **Patrimonio Neto** sea real, la App hace una suma matemática simple. 

**Ejemplo:**
- Tienes $100.000 en el **Banco** (+100.000)
- Debes $40.000 en la **Tarjeta** (-40.000)
- **Cálculo:** `100.000 + (-40.000) = $60.000` (Tu riqueza neta real).

> **💡 Nota Visual**: Aunque en la base de datos la tarjeta sea negativa, en el panel de cuentas verás el número positivo con la etiqueta **"Deuda Tarjeta"**. Esto lo hacemos para que sea más fácil de leer, pero el cálculo matemático siempre respetará el signo negativo.

---

> [!IMPORTANT]
> **Sincronización Inicial**: Siempre asegúrate de que el **Saldo Inicial** y el **Saldo Actual** coincidan al crear la cuenta. La App empezará a contar basándose en el saldo inicial más todos los movimientos que registres.

---

## 2. Gestión de Transacciones
Existen tres tipos de movimientos fundamentales:

1.  **Ingreso (Verde)**: Dinero que entra a tu patrimonio desde el exterior.
2.  **Egreso (Rojo)**: Dinero que sale de tu patrimonio (compras, gastos).
3.  **Transferencia (Azul)**: Movimiento entre tus propias cuentas o cobro de deudas.
    - **Categorización**: ¡Ahora puedes categorizar las transferencias! Si marcas un cobro de deuda como categoría "Ingreso", aparecerá en tus estadísticas de flujo de caja.

### Caso Práctico: Préstamos a Terceros
Para gestionar una deuda que una **Persona A** tiene contigo de $28.000:
1.  **Inicio**: Crea la cuenta "Persona A" (CxC) con Saldo Inicial y Actual de $28.000.
2.  **El Pago**: Registra una **Transferencia** desde "Persona A" hacia tu "Cuenta Corriente" por $28.000.
3.  **Resultado Contextual**: 
    - Al filtrar por **Persona A**, verás un egreso (la deuda desaparece).
    - Al filtrar por **Cuenta Corriente**, verás un ingreso de dinero real.

---

## 3. Gráficos e Inteligencia Contextual
Los gráficos se adaptan a lo que estás mirando para darte la respuesta correcta:

- **Vista Global (Sin filtros)**: Muestra tu **Riqueza Neta**. Las transferencias internas se ocultan para no "inflar" tus ingresos.
- **Vista de Cuenta (Con filtro)**: Muestra el **Flujo de Caja**. Si seleccionas tu banco, verás *todo* lo que pasó allí, incluyendo las transferencias. 

---

## 4. Conciliación y "Descuadres"
Si una cuenta marca **"DESCUADRADA"**:
1. Revisa si olvidaste registrar algún movimiento.
2. Si no sabes por qué falta dinero, usa el botón de **Reconciliar** (icono de balanza).
3. Ingresa el monto que ves exactamente en tu banco hoy. La App ajustará la "Realidad" automáticamente.

---

## 5. Funciones Avanzadas
- **Optimización de Pantalla**: La App funciona en **pantalla dividida**. La interfaz se compactará sola para que veas tus saldos mientras revisas tu banco.
- **Selección Masiva**: Pasa el ratón por la izquierda de los movimientos para borrarlos por lotes.
- **Alertas de Presupuesto**: Las barras se pondrán rojas si superas lo planeado en el "Control Mensual".

---

## 6. Validador de Liquidez y Planes
Esta sección de la App no es para adivinar el futuro, sino un **Laboratorio de Validación** para asegurar que tus planes sean financieramente viables.

### ⚖️ Patrimonio vs. Liquidez
A diferencia de otras apps, aquí distinguimos entre dos realidades:
- **Patrimonio (Línea Azul)**: Representa todo lo que posees (dinero, bienes, cuentas por cobrar) menos tus deudas. Es tu "riqueza teórica".
- **Liquidez (Línea Verde)**: Representa el **dinero real en tu bolsillo/banco** hoy. 

> [!TIP]
> **El "Peligro"**: Puedes tener un patrimonio altísimo (porque te deben mucha plata), pero tener **liquidez negativa** hoy. El Validador te ayuda a ver cuándo podrías quedarte sin caja.

### 💰 Cómo validar un pago o cobro
En la barra lateral ("Saldos por Liquidar"), verás tus deudas y cobros pendientes. 
1.  **Pulsar "Planear"**: Al hacerlo sobre un cobro pendiente (ej. "Cliente X"), podrás elegir en qué mes esperas recibir ese dinero.
2.  **Efecto en el Gráfico**: Verás que en ese mes exacto, tu **Línea de Liquidez (Verde)** sube, pero tu **Línea de Patrimonio (Azul)** no cambia (porque ese dinero ya era técnicamente tuyo desde el principio).
3.  **Resultado**: Si la línea verde baja de cero antes de que ocurra ese cobro, significa que tu plan de gastos actual no es viable y debes ajustar tus egresos.

### 💹 Indicador de Autonomía (Runway)
En el cabezal del Dashboard verás un nuevo indicador: **"Autonomía"**.
- **Qué es**: Representa cuántos meses puedes vivir con tu dinero actual si hoy mismo dejaras de tener ingresos.
- **Cómo se calcula**: `Liquidez Total / Promedio de Gastos (últimos 6 meses)`.
- **Importancia**: Es tu medidor de libertad. Entre más alto sea el número, mayor es tu margen de maniobra ante imprevistos o cambios de vida.

---

*Este manual se actualiza periódicamente con las últimas mejoras de Guapacha Intelligence.*
