# Manual de Usuario - Guapacha Finance

Bienvenido al manual oficial de **Guapacha Finance**. Este documento te ayudará a entender cómo configurar y sacar el máximo provecho de la aplicación para llevar un control total de tus finanzas.

## 1. Configuración Inicial
Al entrar por primera vez, verás el panel principal. Lo primero es configurar tus cuentas y categorías.

### Tipos de Cuentas
Al crear una cuenta, debes seleccionar el tipo correcto para que el **Patrimonio Neto** se calcule bien:
- **Cuentas Corrientes/Vista/Ahorro/Efectivo**: Suman a tu patrimonio. Ingresa saldos positivos.
- **Tarjetas/Líneas de Crédito**: Restan de tu patrimonio si están usadas. Ingresa el límite total y el saldo actual (el saldo suele ser negativo si debes dinero).
- **Cuentas por Cobrar (CxC)**: Dinero que te deben a ti. **Ingresa siempre saldos POSITIVOS**.
- **Cuentas por Pagar (CxP)**: Dinero que tú debes a otros. **Ingresa siempre saldos NEGATIVOS**.

> [!IMPORTANT]
> **Sincronización Inicial**: Al crear una cuenta por primera vez, asegúrate de que el **Saldo Inicial** (lo que había antes de empezar a registrar) y el **Saldo Actual** coincidan en ese momento. Esto permite que la aplicación empiece a "contar" desde el punto correcto.

---

## 2. Gestión de Transacciones
La aplicación permite tres tipos de movimientos:

1.  **Ingreso (Verde)**: Dinero que entra a una cuenta.
2.  **Egreso (Rojo)**: Dinero que sale de una cuenta.
3.  **Transferencia (Azul)**: Movimiento entre dos cuentas. 
    - **Categorización**: ¡Ahora puedes categorizar las transferencias! 
    - **Uso PRO**: Si Frank te paga, marca la transferencia con la categoría "Cobros Frank" o similar. Esto hará que el dinero aparezca en tus gráficos de ingresos del mes.

### Caso Práctico: Préstamos y Pagos (Caso "Frank")
Si Frank te debe $28.000:
1.  **Configuración**: Creas la cuenta "Frank" (CxC) con Saldo Inicial $28.000 y Saldo Actual $28.000.
2.  **El Pago**: Creas una **Transferencia** desde "Frank" hacia tu "Cuenta Corriente" por $28.000 y asígnale una categoría (opcional).
3.  **Resultado**: 
    - En la vista de ** Frank**, verás un egreso de $28.000 (deuda saldada).
    - En la vista de **Cuenta Corriente**, verás un **ingreso de $28.000** reflejado tanto en la lista como en los gráficos de barra.

---

## 3. Gráficos e Inteligencia de Datos
Los gráficos de "Ejecución" han sido mejorados para ser **contextuales**:

- **Vista Global (Sin filtro)**: Los totales de "Ingresos Mes" y "Gastos Mes" en la parte superior solo muestran el dinero que entró o salió de tu patrimonio total. Las transferencias internas se ignoran para no dar falsos positivos.
- **Vista de Cuenta (Con filtro)**: Si seleccionas una cuenta específica (ej: Cuenta Corriente), los gráficos y totales cambiarán para mostrar el **Flujo de Caja** de esa cuenta. Las transferencias aparecerán como ingresos o egresos según corresponda, para que coincidan exactamente con lo que ves en tu banco.

---

## 4. Funciones Avanzadas
- **Selección Masiva**: En la lista de movimientos, puedes pasar el ratón para ver casillas de verificación. Permite borrar múltiples transacciones de una sola vez.
- **Filtros por URL**: Si filtras una cuenta o una fecha y refrescas la página, la aplicación recordará dónde estabas.
- **Alertas de Presupuesto**: En el panel de "Control Mensual", las categorías se pondrán en rojo si te has pasado del presupuesto asignado.

---

## 5. Optimización de Pantalla (Pantalla Dividida)
Si usas la aplicación en **pantalla dividida** (junto a la web de tu banco, por ejemplo):
- La interfaz se adaptará automáticamente a una vista más compacta.
- Los textos y espacios se reducirán para que puedas ver toda la información sin necesidad de scroll horizontal.
- En vistas muy estrechas, el menú lateral se moverá a la parte inferior para maximizar el espacio de trabajo.

---

*Este manual se actualiza automáticamente con cada mejora del sistema.*
