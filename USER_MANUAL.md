# 📘 Manual de Usuario - Guapacha Finance Intelligence (v2.0)

Bienvenido a **Guapacha Finance**, tu sistema inteligente de gestión financiera personal. Este manual está diseñado para guiarte en el uso de la plataforma durante la fase de pruebas.

---

## 1. Acceso y Seguridad 🔐

### Inicio de Sesión
- **Acceso**: Ingresa con tu correo electrónico y contraseña registrados.
- **Seguridad**: El sistema cuenta con indicadores de conexión en tiempo real.
    - 🟢 **Sistema Activo**: Conexión estable.
    - 🔴 **Falla Crítica**: Sin conexión a internet o servidor.
    - ⚪ **Sincronizando**: Estableciendo comunicación.

### Configuración Regional (NUEVO) 🌎
Si estás en **Colombia** o quieres cambiar la moneda:
- En la parte superior del Dashboard, verás un botón con la bandera de tu región actual (ej: 🇨🇱 Chile).
- Haz clic allí y selecciona **Colombia (COP)**.
- El sistema actualizará automáticamente todos los símbolos de moneda y formatos de fecha.

### Recuperación de Contraseña
- En la pantalla de login, utiliza la opción **"¿Olvidaste tu contraseña?"** para recibir un enlace de recuperación en tu correo.

---

## 2. Panel Principal (Dashboard) 🖥️

El escritorio se divide en tres columnas estratégicas para un control total:

### A. Columna Izquierda: Mis Cuentas 💳
Aquí gestionas tu patrimonio líquido.
- **Resumen**: Muestra el saldo total y estado de cada cuenta (Cuenta Corriente, Efectivo, Línea de Crédito, etc.).
- **Indicadores de Estado**:
    - **Círculo Verde ✅**: Cuenta cuadrada (el saldo coincide con los movimientos).
    - **Etiqueta Naranja "DESCUADRADA" ⚠️**: El saldo real difiere de la suma de transacciones.
- **Acciones**:
    - **Añadir Cuenta**: Botón `+` en la esquina superior derecha.
    - **Reconciliar**: Haz clic en el botón de lápiz (✏️) al pasar el mouse sobre una cuenta para ajustar su saldo real manualmente.

### B. Columna Central: Ejecución (Presupuesto) 📊
El corazón de tu estrategia financiera. Controla ingresos vs. gastos del mes seleccionado.
- **Navegación**: Usa las flechas `<` `>` en la parte superior para cambiar de mes.
- **Categorías**: Tus gastos se agrupan en Ingresos, Gastos Fijos, Gastos Variables y Ahorro.
- **Barras de Progreso**:
    - **Verde**: Dentro del presupuesto.
    - **Rojo**: Presupuesto excedido.
- **NUEVO: Visualización Gráfica (Insights)** 🚀
    - Haz clic en el icono de **Gráfico (📊)** junto al título "CONTROL MENSUAL".
    - **Distribución**: Mira un gráfico de dona con tus gastos por categoría.
    - **Flujo**: Compara tus Ingresos vs. Gastos en un gráfico de barras.

### C. Columna Derecha: Movimientos (Transacciones) 💸
Bitácora de tu actividad financiera reciente.
- **Filtros Rápidos**: Alterna entre `TODO`, `INGRESOS`, `EGRESOS` y `TRANSF`.
- **Buscador**: Encuentra gastos antiguos por nombre (ej: "Netflix").
- **Nueva Transacción**: Botón flotante gigante `+` en la esquina inferior derecha.

---

## 3. Gestión de Transacciones 📝

### Registrar un Movimiento
Al pulsar el botón `+`, se abrirá el formulario:
1.  **Tipo**: Elige entre Gasto, Ingreso o Transferencia.
2.  **Monto**: Ingresa el valor.
3.  **Cuenta**: Selecciona de dónde sale o entra el dinero.
4.  **Categoría**: Clasifícalo correctamente (ej: Supermercado, Transporte). 
    *   *Nota*: Las transferencias no requieren categoría.
5.  **Descripción**: Detalle opcional (ej: "Compra semanal").

### Editar / Eliminar
- Haz clic sobre cualquier transacción en la lista de la derecha para editar sus datos o eliminarla si fue un error.

---

## 4. Funciones Avanzadas 🚀

### Modo Oscuro 🌙
- En la barra lateral izquierda (menú), el icono de "Luna" activa el modo oscuro para reducir la fatiga visual nocturna.

### Proyecciones (Futuro) 🔮
Accede desde el menú lateral para ver simulaciones financieras:
- **Proyección 5 Años**: Estimación de tu patrimonio a mediano plazo basado en tu ahorro actual.
- **Proyección 30 Años**: Simulación de largo plazo para planificación de retiro.

---

## 5. Glosario de Iconos ℹ️

| Icono | Significado |
| :---: | :--- |
| 📊 / ☰ | Alternar entre vista de Gráficos y Lista en el panel central. |
| ✏️ | Editar cuenta o transacción. |
| 🗑️ | Eliminar elemento. |
| 🔄 | Reconciliar (ajustar saldo) cuenta. |

---

> **Nota para el Tester**: Si encuentras algún comportamiento inesperado, por favor repórtalo indicando qué estabas haciendo y qué mensaje de error apareció (si hubo uno).
