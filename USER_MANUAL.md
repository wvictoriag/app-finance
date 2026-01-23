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

---

## 2. Gestión de Transacciones
La aplicación permite tres tipos de movimientos:

1.  **Ingreso (Verde)**: Dinero que entra a una cuenta. El sistema filtrará automáticamente las categorías de tipo "Ingreso".
2.  **Egreso (Rojo)**: Dinero que sale de una cuenta (gastos). El sistema filtrará las categorías de gastos y ahorros.
3.  **Transferencia (Azul)**: Movimiento de dinero entre dos cuentas propias. No requiere categoría.

### Caso Práctico: Préstamos y Pagos (Caso "Frank")
Si alguien te debe dinero y hay movimientos, se registra así:
- **Préstamo nuevo**: Haz una **Transferencia** desde tu "Cuenta Corriente" hacia la "Cuenta por Cobrar (Frank)". Esto disminuye tu banco y aumenta lo que Frank te debe.
- **Te pagan lo que deben**: Haz una **Transferencia** desde la "Cuenta por Cobrar (Frank)" hacia tu "Cuenta Corriente". Esto disminuye la deuda y aumenta tu dinero en el banco.

---

## 3. Conciliación y "Descuadre"
La aplicación tiene un sistema de seguridad para asegurar que no olvides registrar transacciones.

- **Saldo en App**: Es el resultado de tu saldo inicial más todos los movimientos registrados.
- **Saldo Real**: Es el saldo que ves en tu banco real.
- **Descuadre**: Si el Saldo Real y el de la App no coinciden, verás un aviso de **"DESCUADRADA"**.
- **Solución**: Debes registrar las transacciones que te faltan hasta que el descuadre llegue a $0. Si no sabes por qué falta dinero, puedes usar el botón de **Reconciliar** (icono de balanza) para forzar el saldo al valor real, lo cual actualizará la fecha de actualización de la cuenta.

---

## 4. Funciones Avanzadas
- **Selección Masiva**: En la lista de movimientos, puedes pasar el ratón para ver casillas de verificación. Permite borrar múltiples transacciones de una sola vez.
- **Filtros por URL**: Si filtras una cuenta o una fecha y refrescas la página, la aplicación recordará dónde estabas.
- **Alertas de Presupuesto**: En el panel de "Control Mensual", las categorías se pondrán en rojo si te has pasado del presupuesto asignado.

---

*Este manual se actualiza automáticamente con cada mejora del sistema.*
