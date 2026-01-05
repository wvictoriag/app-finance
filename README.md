# App Finance 💰

Aplicación de control financiero personal construida con React, Vite, Tailwind CSS y Supabase.

## Requisitos Previos

- Node.js instalado.
- Cuenta en Supabase.
- (Opcional) Git instalado para despliegue automático.

## Instalación

1. Clona el repositorio o descarga los archivos.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
   ```

## Desarrollo

Para ejecutar la aplicación localmente:
```bash
npm run dev
```

Para acceder desde otros dispositivos (como un iPad) en la misma red:
```bash
npm run dev -- --host
```

## Despliegue

Esta aplicación está lista para ser desplegada en **Vercel** o **Netlify**. Si usas Vercel, asegúrate de añadir las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel de configuración del proyecto.
