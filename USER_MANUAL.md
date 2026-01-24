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

### Caso Práctico: Caso "Frank"
Para gestionar una deuda que Frank tiene contigo de $28.000:
1.  **Inicio**: Crea la cuenta "Frank" (CxC) con Saldo Inicial y Actual de $28.000.
2.  **El Pago**: Registra una **Transferencia** desde "Frank" hacia tu "Cuenta Corriente" por $28.000.
3.  **Resultado Contextual**: 
    - Al filtrar por **Frank**, verás un egreso (la deuda desaparece).
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

## 6. Simulaciones Patrimoniales (Proyecciones)
Esta sección de la App no es un oráculo, sino un **Laboratorio Financiero** donde puedes jugar a "Qué pasaría si...".

### 🤔 ¿Por qué se llama "Simulación"?
Se llama así porque crea un modelo matemático basado en tu comportamiento real para proyectar el futuro. 
- **Línea Base (Azul)**: Es tu futuro si no haces nada distinto a los últimos 6 meses.
- **Línea Simulada (Roja)**: Es como cambiaría tu riqueza si ocurrieran eventos específicos que tú definas.

### 💰 ¿Dónde están mis deudas y la plata por cobrar?
El simulador **YA LOS INCLUYE** desde el primer punto del gráfico:
1.  **Mes 0 (Hoy)**: El punto de inicio del gráfico coincide exactamente con tu **Patrimonio Neto** actual (Cuentas + Por Cobrar - Deudas).
2.  **Transparencia**: Si pasas el ratón sobre el ícono de Información (i) junto al Patrimonio Neto en el encabezado, verás el desglose de cuánto de tu riqueza está en efectivo, cuánto es deuda y cuánto te deben.
3.  **Saldos por Liquidar**: En la barra lateral verás tus deudas y cobros pendientes. El gráfico asume que esos saldos se mantienen "vivos" a menos que tú simules su pago o cobro.

### 🛠️ Cómo sacarle provecho
- **Simular una Compra**: Si quieres ver cómo te afecta comprar un auto en el Mes 12, agrega un escenario de tipo "Compra". Verás el "bajón" inmediato en la línea roja.
- **Simular un Aumento**: Agrega un "Nuevo Ingreso" permanente para ver cómo se acelera tu crecimiento patrimonial en el tiempo.
- **Deudas/Cuotas**: Si tienes un crédito que termina en 6 meses, agrégalo en la sección de "Cuotas". Verás que en el Mes 7, tu proyección empieza a subir más rápido porque ya no tienes ese gasto fijo.

---

*Este manual se actualiza periódicamente con las últimas mejoras de Guapacha Intelligence.*
