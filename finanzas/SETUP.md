# Guía de instalación — WallyDeRulo

## Paso 1: Crear cuenta en Supabase

1. Ir a https://supabase.com y hacer click en "Start your project"
2. Registrarse con tu email
3. Crear un nuevo proyecto:
   - Ponerle un nombre (ej: "wallyderulo")
   - Elegir una contraseña para la base de datos (guardala en algún lugar seguro)
   - Elegir la región más cercana (South America São Paulo)
   - Click en "Create new project" y esperar ~2 minutos

## Paso 2: Crear las tablas en Supabase

1. En tu proyecto de Supabase, ir al menú izquierdo → **SQL Editor**
2. Click en "New query"
3. Abrir el archivo `supabase_schema.sql` que está en esta carpeta
4. Copiar TODO el contenido y pegarlo en el SQL Editor
5. Click en **"Run"** (botón verde)
6. Si todo sale bien, vas a ver "Success" abajo

## Paso 3: Obtener las credenciales de Supabase

1. En el menú izquierdo → **Project Settings** → **API**
2. Copiar dos valores:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **anon public** key (la clave larga de abajo)

## Paso 4: Configurar el archivo .env

1. Abrir el archivo `.env` que está en la carpeta `finanzas/`
2. Reemplazar los valores:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

## Paso 5: Crear cuenta en Vercel (para subir la app)

1. Ir a https://vercel.com y registrarse (puede ser con GitHub o Google)
2. Instalar Vercel CLI en la terminal:
   ```
   npm install -g vercel
   ```

## Paso 6: Subir la app a Vercel

Abrir la terminal en la carpeta `finanzas/` y ejecutar:

```bash
vercel
```

Cuando pregunte:
- "Set up and deploy?" → Y (Enter)
- "Which scope?" → tu usuario
- "Link to existing project?" → N
- "What's your project name?" → wallyderulo (o el nombre que quieras)
- "In which directory is your code located?" → ./ (Enter)

Luego configurar las variables de entorno en Vercel:

```bash
vercel env add VITE_SUPABASE_URL
# Pegar tu URL de Supabase y Enter

vercel env add VITE_SUPABASE_ANON_KEY  
# Pegar tu clave anon y Enter
```

Hacer el deploy final:

```bash
vercel --prod
```

Al final te va a dar una URL tipo `https://wallyderulo-xxx.vercel.app` — esa es tu app online!

## Paso 7: Probar la app

1. Entrar a la URL de Vercel
2. Registrarte con tu email
3. Confirmar el email (revisar la bandeja de entrada)
4. Empezar configurando categorías y métodos de pago

---

## Para usar en el celular

Una vez que la app esté online en Vercel:

**Android:**
1. Abrir Chrome y entrar a la URL de tu app
2. Menú (3 puntos) → "Agregar a la pantalla de inicio"
3. La app aparece como ícono en tu celular

**iPhone:**
1. Abrir Safari y entrar a la URL de tu app
2. Botón de compartir (cuadrado con flecha) → "Agregar a inicio"
3. La app aparece como ícono en tu celular

---

## Desarrollo local (opcional)

Para correr la app en tu PC mientras la desarrollás:

```bash
cd finanzas
npm run dev
```

Abre http://localhost:5173 en el browser.
