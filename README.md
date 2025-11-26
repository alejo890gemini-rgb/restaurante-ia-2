# 🍗 Restaurante IA Pro - Guía de Despliegue Completa

Esta guía te llevará paso a paso para desplegar tu aplicación en la nube usando Supabase para la base de datos y Netlify para el frontend.

---

## 🚀 PASO 1: Configurar la Base de Datos (Supabase)

Aquí crearemos la "mente" de tu aplicación donde se guardarán todos los datos.

1.  **Crear Cuenta y Proyecto:**
    *   Ve a [Supabase.com](https://supabase.com/) y crea una cuenta gratuita.
    *   Dentro de tu panel, haz clic en **"New Project"**. Dale un nombre (ej. `restaurante-ia-pro`), genera una contraseña segura (guárdala en un lugar seguro) y elige la región más cercana.
    *   Espera unos minutos mientras se crea tu base de datos.

2.  **Ejecutar el Script SQL:**
    *   Una vez creado el proyecto, en el menú de la izquierda, busca el icono **SQL Editor** (parece una hoja con `SQL` escrito).
    *   Haz clic en **"+ New query"**.
    *   Abre el archivo `supabase_schema.sql` que se encuentra en este proyecto.
    *   Copia **todo el contenido** de ese archivo.
    *   Pega el contenido en la ventana del SQL Editor en Supabase.
    *   Haz clic en el botón verde **"RUN"**. Deberías ver un mensaje de "Success" al terminar. ¡Tus tablas ya están creadas!

3.  **Obtener las Claves de Conexión (API Keys):**
    *   En el menú de la izquierda, ve a **Project Settings** (el icono de engranaje).
    *   Selecciona la pestaña **"API"**.
    *   Busca la sección **"Project API Keys"**. Necesitarás dos cosas para el siguiente paso. Mantenlas a la mano:
        1.  `Project URL`
        2.  La clave que dice `public` y `anon key`

¡Listo! Tu base de datos está preparada para recibir datos.

---

## 🌐 PASO 2: Desplegar el Frontend (Netlify)

Ahora subiremos la parte visual de tu aplicación para que sea accesible desde cualquier lugar.

1.  **Sube tu código a GitHub:**
    *   Asegúrate de que todo tu código, incluyendo los nuevos archivos `supabase_schema.sql` y `netlify.toml`, esté subido a un repositorio de GitHub.

2.  **Crear Cuenta y Sitio en Netlify:**
    *   Ve a [Netlify.com](https://www.netlify.com/) y crea una cuenta gratuita.
    *   En tu panel, haz clic en **"Add new site"** -> **"Import an existing project"**.
    *   Conecta con **GitHub** y autoriza el acceso.
    *   Selecciona el repositorio de tu proyecto de restaurante.

3.  **Configurar el Despliegue:**
    *   Netlify detectará automáticamente la configuración gracias al archivo `netlify.toml`. Deberías ver:
        *   **Build command:** `npm run build` o `vite build`
        *   **Publish directory:** `dist`
    *   Antes de desplegar, haz clic en **"Show advanced"** y luego en **"Add environment variables"**.

4.  **Añadir Variables de Entorno (¡El paso más importante!):**
    *   Aquí conectarás Netlify con Supabase. Usa las claves que copiaste en el paso 1.3.
    *   Crea dos variables:
        *   **Key:** `VITE_SUPABASE_URL` -> **Value:** (Pega aquí tu `Project URL` de Supabase).
        *   **Key:** `VITE_SUPABASE_ANON_KEY` -> **Value:** (Pega aquí tu `anon key` de Supabase).
    *   Asegúrate de que no haya espacios extra al principio o al final de las claves.

5.  **Desplegar:**
    *   Haz clic en el botón **"Deploy site"**. Netlify comenzará a construir y desplegar tu aplicación. ¡Esto puede tardar unos minutos!
    *   Cuando termine, Netlify te dará una URL pública (ej: `https://mi-restaurante-genial.netlify.app`).

---

## 🤖 PASO 3: Configurar la Inteligencia Artificial

Tu app ya está en línea, pero las funciones de IA aún no están activas.

1.  **Obtener tu API Key de Gemini:**
    *   Ve a [aistudio.google.com](https://aistudio.google.com/app/apikey).
    *   Inicia sesión con tu cuenta de Google y haz clic en **"Create API key"**.
    *   Copia la clave que se genera.

2.  **Configurar en la Aplicación:**
    *   Abre la URL de tu aplicación que te dio Netlify.
    *   Inicia sesión con las credenciales por defecto:
        *   **Usuario:** `admin`
        *   **Contraseña:** `123`
    *   En el menú lateral, ve a **Configuración**.
    *   Selecciona la pestaña **IA & API**.
    *   Pega tu **Google Gemini API Key** en el campo correspondiente.
    *   Haz clic en **"Guardar y Recargar"**.

¡Felicidades! Tu sistema está 100% funcional en la nube.

---

## 📱 Instalar como Aplicación (PWA)

Para una experiencia más nativa, puedes instalar la web como una aplicación en tu dispositivo:

*   **PC (Chrome/Edge):** Busca un icono de un monitor con una flecha hacia abajo en la barra de direcciones y haz clic en "Instalar".
*   **Android (Chrome):** Abre el menú de Chrome (tres puntos) y selecciona "Instalar aplicación".
*   **iOS (Safari):** Toca el icono de "Compartir" y selecciona "Agregar a la pantalla de inicio".
