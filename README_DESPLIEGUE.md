# 🧉 Tienda Matecitos — Guía de Despliegue Gratuito

Esta guía te acompaña paso a paso para tener tu tienda online funcionando en internet **sin costo**, usando las capas gratuitas de MongoDB Atlas, Render y Vercel.

---

## Arquitectura del Proyecto

```
tienda-matecitos/
├── client/          → Frontend React (Vite) → Vercel
├── server/          → Backend Node.js/Express → Render
└── README_DESPLIEGUE.md
```

```
[Vercel - Frontend]  ←→  [Render - Backend API]  ←→  [MongoDB Atlas - BD]
```

---

## Requisitos Previos

- Una cuenta de [GitHub](https://github.com) con el proyecto subido como repositorio.
- Cuentas gratuitas en [MongoDB Atlas](https://www.mongodb.com/atlas), [Render](https://render.com) y [Vercel](https://vercel.com).

### Subir el proyecto a GitHub

```bash
cd tienda-matecitos
git init
git add .
git commit -m "feat: inicializar proyecto Tienda Matecitos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tienda-matecitos.git
git push -u origin main
```

---

## Paso A: MongoDB Atlas (Base de Datos Gratuita — Cluster M0)

### 1. Crear cuenta y cluster

1. Entrá a [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) y creá una cuenta gratuita.
2. Hacé clic en **"Build a Database"**.
3. Elegí **M0 FREE** (Shared) — es permanentemente gratis.
4. Seleccioná la región más cercana (ej. `São Paulo` para Argentina).
5. Ponele un nombre al cluster (ej. `tienda-matecitos-cluster`).
6. Hacé clic en **"Create Deployment"**.

### 2. Crear usuario de base de datos

1. En la sección de seguridad, creá un usuario:
   - **Username:** `admin_matecitos`
   - **Password:** Generá una contraseña segura y **guardala** — la vas a necesitar.
2. Hacé clic en **"Create User"**.

### 3. Configurar acceso de red

1. Andá a **Network Access** en el menú lateral.
2. Hacé clic en **"Add IP Address"**.
3. Seleccioná **"Allow Access from Anywhere"** (`0.0.0.0/0`).
   > ⚠️ Esto es necesario para que Render pueda conectarse. En producción real usarías IPs específicas.
4. Hacé clic en **"Confirm"**.

### 4. Obtener la URI de conexión

1. Volvé al cluster y hacé clic en **"Connect"**.
2. Elegí **"Drivers"** (Connect your application).
3. Copiá la URI. Se ve así:
   ```
   mongodb+srv://admin_matecitos:<password>@tienda-matecitos-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Reemplazá `<password>` con la contraseña que creaste.
5. Agregá el nombre de la base de datos antes del `?`:
   ```
   mongodb+srv://admin_matecitos:TU_PASSWORD@tienda-matecitos-cluster.xxxxx.mongodb.net/tienda-matecitos?retryWrites=true&w=majority
   ```

**Guardá esta URI completa** — la necesitás en el siguiente paso.

---

## Paso B: Render (Backend Gratuito)

### 1. Crear el servicio

1. Entrá a [https://dashboard.render.com](https://dashboard.render.com) y conectá tu cuenta de GitHub.
2. Hacé clic en **"New +"** → **"Web Service"**.
3. Conectá el repositorio `tienda-matecitos`.

### 2. Configurar el servicio

Completá los campos así:

| Campo              | Valor                                        |
|--------------------|----------------------------------------------|
| **Name**           | `tienda-matecitos-api`                       |
| **Region**         | El más cercano (ej. `Oregon` o `Ohio`)       |
| **Branch**         | `main`                                       |
| **Root Directory** | `server`                                     |
| **Runtime**        | `Node`                                       |
| **Build Command**  | `npm install`                                |
| **Start Command**  | `npm start`                                  |
| **Instance Type**  | **Free**                                     |

### 3. Configurar variables de entorno

En la sección **"Environment Variables"**, agregá:

| Variable       | Valor                                                  |
|----------------|--------------------------------------------------------|
| `MONGODB_URI`  | La URI completa de MongoDB Atlas (del Paso A)          |
| `CLIENT_URL`   | `https://tienda-matecitos.vercel.app` (lo ajustás después) |

### 4. Desplegar

Hacé clic en **"Create Web Service"**. Render va a:
1. Clonar tu repo.
2. Ejecutar `npm install` en `/server`.
3. Ejecutar `npm start`.

Cuando termine, te va a dar una URL como:
```
https://tienda-matecitos-api.onrender.com
```

**Verificá** entrando a:
```
https://tienda-matecitos-api.onrender.com/api/status
```

Deberías ver:
```json
{
  "exito": true,
  "mensaje": "🧉 API de Tienda Matecitos funcionando correctamente"
}
```

### ⚠️ Limitación importante de la capa gratuita de Render

El servicio gratuito se **"duerme" después de 15 minutos de inactividad**. La primera visita después de estar dormido puede tardar **30-60 segundos** en responder mientras el servidor se reactiva.

**Soluciones posibles:**
- Usar un servicio como [UptimeRobot](https://uptimerobot.com) (gratuito) para hacer un ping cada 14 minutos y mantenerlo activo.
- Aceptar el delay para un MVP/prototipo.
- Migrar a un plan pago cuando el tráfico lo justifique.

---

## Paso C: Vercel (Frontend Gratuito)

### 1. Importar el proyecto

1. Entrá a [https://vercel.com](https://vercel.com) y conectá tu cuenta de GitHub.
2. Hacé clic en **"Add New..."** → **"Project"**.
3. Importá el repositorio `tienda-matecitos`.

### 2. Configurar el proyecto

| Campo                  | Valor                                          |
|------------------------|-------------------------------------------------|
| **Framework Preset**   | `Vite` (Vercel lo detecta automáticamente)      |
| **Root Directory**     | `client`                                        |
| **Build Command**      | `npm run build`                                 |
| **Output Directory**   | `dist`                                          |

### 3. Configurar variables de entorno

En la sección **"Environment Variables"**, agregá:

| Variable       | Valor                                                        |
|----------------|--------------------------------------------------------------|
| `VITE_API_URL` | `https://tienda-matecitos-api.onrender.com` (tu URL de Render) |

> ⚠️ En Vite, las variables de entorno **deben** empezar con `VITE_` para ser accesibles desde el código del frontend.

### 4. Desplegar

Hacé clic en **"Deploy"**. Vercel va a:
1. Detectar que es un proyecto Vite/React.
2. Ejecutar `npm run build` en `/client`.
3. Servir la carpeta `dist`.

Tu tienda va a estar disponible en:
```
https://tienda-matecitos.vercel.app
```
(o el subdominio que Vercel te asigne).

### 5. Actualizar CORS en Render

Una vez que tengas la URL final de Vercel, volvé a Render y actualizá la variable `CLIENT_URL` con la URL exacta de tu frontend (sin barra final).

---

## Verificación Final

1. ✅ Entrá a tu URL de Vercel → debería cargar la tienda.
2. ✅ Entrá a `TU_URL_RENDER/api/status` → debería responder con JSON de estado.
3. ✅ La tienda debería mostrar "No se encontraron productos" (porque la BD está vacía todavía).

### Cargar productos de prueba

Podés usar **curl**, **Postman** o **Thunder Client** (extensión de VS Code) para insertar productos directamente en MongoDB Atlas:

1. Andá a tu cluster en MongoDB Atlas.
2. Hacé clic en **"Browse Collections"**.
3. Seleccioná la base de datos `tienda-matecitos`.
4. En la colección `productos`, hacé clic en **"Insert Document"**.
5. Insertá un documento como:

```json
{
  "nombre": "Mate Imperial de Algarrobo",
  "descripcion": "Mate artesanal de algarrobo con virola y bombilla de alpaca incluida",
  "precio": 15500,
  "stock": 25,
  "imagenUrl": "",
  "categoria": "Mates",
  "destacado": true,
  "activo": true
}
```

---

## Próximos Pasos Sugeridos

- [ ] Agregar endpoints POST/PUT/DELETE con autenticación admin.
- [ ] Integrar WhatsApp Business API para consultas.
- [ ] Agregar pasarela de pagos (MercadoPago).
- [ ] Implementar carga y almacenamiento de imágenes (Cloudinary).
- [ ] Configurar un dominio personalizado.

---

## Desarrollo Local

```bash
# Terminal 1 — Backend
cd server
cp .env.example .env    # Completar con tu MONGODB_URI
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

El frontend corre en `http://localhost:5173` y el backend en `http://localhost:5000`.
