# Hood Cerves

Marcador grupal de litros de cerveza. Sin login: se abre la URL y ya se puede
usar. Datos compartidos por todo el grupo (se refrescan cada 5 segundos).

Este proyecto está pensado para desplegarse en Vercel. Como no hace falta
Node.js en tu ordenador para desplegar (Vercel compila en la nube), estos
pasos funcionan enteramente desde el navegador.

## 1. Sube el proyecto a GitHub (sin usar git en tu ordenador)

1. Ve a [github.com](https://github.com) y crea una cuenta gratis si no
   tienes una.
2. Pulsa **New repository**, ponle de nombre `hood-cerves`, y créalo (puede
   ser público o privado, da igual).
3. En la página del repo recién creado, pulsa **Add file > Upload files**.
4. Arrastra ahí dentro TODA la carpeta `hood-cerves` (o todos sus archivos y
   subcarpetas: `app`, `components`, `lib`, `prisma`, `public`, `package.json`,
   `tsconfig.json`, `next.config.js`, `.gitignore`, `.env.example`,
   `README.md`). GitHub conserva la estructura de carpetas al arrastrar.
5. Pulsa **Commit changes**.

## 2. Crea cuenta en Vercel y conecta el repositorio

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta gratis
   (puedes registrarte directamente con tu cuenta de GitHub, es lo más
   cómodo).
2. Pulsa **Add New... > Project**.
3. Selecciona el repositorio `hood-cerves` que acabas de subir y pulsa
   **Import**.
4. Dejа el framework detectado como **Next.js** (Vercel lo detecta solo).
   Todavía NO despliegues: primero configura la base de datos (paso 3).

## 3. Configura la base de datos (Vercel Postgres)

1. Antes de pulsar Deploy (o después, no pasa nada), ve a la pestaña
   **Storage** del proyecto en Vercel.
2. Pulsa **Create Database** y elige **Postgres**.
3. Sigue el asistente (elige la región más cercana, por ejemplo Europa) y
   créala.
4. Cuando te lo pida, pulsa **Connect** para conectarla a tu proyecto
   `hood-cerves`. Esto añade automáticamente la variable de entorno
   `DATABASE_URL` que usa el proyecto (ya está referenciada en
   `prisma/schema.prisma`), no hay que tocar nada más.

## 4. Despliega

1. Vuelve a la pestaña **Deployments** (o pulsa **Deploy** si aún no lo has
   hecho) y lanza el despliegue.
2. Vercel instalará las dependencias, generará el cliente de Prisma, creará
   las tablas en la base de datos (`prisma db push`) y compilará la app.
3. Al terminar te dará una URL pública tipo `hood-cerves.vercel.app` — esa es
   la que le mandas al grupo. Cada vez que subas cambios al repo de GitHub,
   Vercel vuelve a desplegar solo.

## 5. Añadir a pantalla de inicio (móvil)

En iPhone (Safari): abre la URL, pulsa el botón compartir y luego
"Añadir a pantalla de inicio". En Android (Chrome): abre la URL y usa el
menú "Añadir a pantalla de inicio" / "Instalar app".

## 6. Notificaciones push (opcional pero ya integrado en el código)

Cada vez que alguien apunta una bebida, todos los que hayan activado las
notificaciones (botón "🔔 Activar notificaciones" en la web) reciben un
aviso tipo "¡Fernando se acaba de tomar: Pinta!".

**Importante en iPhone**: por restricción de Apple, las notificaciones push
solo funcionan si la web está añadida a la pantalla de inicio (paso 5) — en
una pestaña normal de Safari no llegan. En Android/Chrome funcionan también
sin instalarla.

Para activarlo, genera un par de claves propio (no reutilices ninguna que
haya aparecido antes en este README o en el historial de git — considérala
comprometida):

```
npx web-push generate-vapid-keys
```

Y añade estas variables de entorno en tu proyecto de Vercel (**Settings →
Environment Variables**, para Production y Preview) — ver `.env.example`
para la lista completa:

```
VAPID_PUBLIC_KEY=<la clave pública que te ha dado el comando de arriba>
VAPID_PRIVATE_KEY=<la clave privada que te ha dado el comando de arriba>
VAPID_SUBJECT=mailto:tu-email@ejemplo.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<la misma clave pública, repetida aquí>
```

(`NEXT_PUBLIC_VAPID_PUBLIC_KEY` debe tener el mismo valor que
`VAPID_PUBLIC_KEY` — una es para el servidor y otra para el navegador).
Cambia `VAPID_SUBJECT` por un email de contacto real tuyo, no se muestra a
nadie, es solo un requisito técnico del protocolo push. Después de añadir
las variables, vuelve a desplegar (Redeploy) para que se apliquen.

## 7. Resumen mensual automático

El día 1 de cada mes a las 9:00 (hora UTC), la app envía un push a todos los
que tengan notificaciones activadas con el total de litros del grupo en el
mes anterior y quién ha sido "el borracho del mes" (si no hay empate en el
primer puesto).

Añade esta variable de entorno en Vercel (**Settings → Environment
Variables**, Production y Preview) — genera un valor aleatorio propio (por
ejemplo `openssl rand -base64 32`), no reutilices ninguno que haya aparecido
antes en este README o en el historial de git:

```
CRON_SECRET=<tu valor aleatorio>
```

Esto protege la ruta para que solo Vercel (o tú, con el secreto) pueda
disparar el resumen. No hace falta hacer nada más: el archivo `vercel.json`
ya programa la tarea, Vercel la detecta sola al desplegar.

**Para probarlo manualmente** sin esperar al día 1, abre en el navegador
(con la web ya desplegada y con al menos una bebida apuntada este mes):

```
https://TU-URL-DE-VERCEL.vercel.app/api/cron/monthly-report?secret=TU_CRON_SECRET
```

Si todo va bien, verás un JSON con `"sent": true` y a quien tenga las
notificaciones activadas le llegará el aviso al momento.

## 8. Copia de seguridad diaria y recuperar a alguien borrado por error

Cada día a las 4:00 (hora UTC) se guarda automáticamente una copia completa
de todos los datos (personas, cervezas, cubatas, con sus fechas exactas)
dentro de la propia base de datos. Se conservan los últimos 30 días.

**Si borras a alguien por error** (el botón "Eliminar" es irreversible y
borra también todo su historial), puedes recuperarlo así:

1. Abre esta URL en el navegador, cambiando `NOMBRE` por el nombre exacto de
   la persona:

   ```
   https://TU-URL-DE-VERCEL.vercel.app/api/admin/restore-person?name=NOMBRE&secret=TU_CRON_SECRET
   ```

2. Si todo va bien, verás un JSON con `"ok": true` y el número de cervezas y
   cubatas restauradas. La persona reaparecerá en la web (haz refresco
   forzado, `Ctrl+F5`, si no la ves al momento).

**Limitación importante**: la copia se hace una vez al día, así que si
borras a alguien el mismo día que ha bebido algo, esa última copia (de esta
madrugada) no incluirá lo de hoy — se recupera todo excepto lo apuntado
ese mismo día. No hay forma de recuperar nada de un día que aún no ha
tenido su copia de seguridad.

Esta ruta usa la misma variable `CRON_SECRET` que ya tienes configurada
(ver punto 7).

## 9. Hora de robos: aviso en tiempo real con cron-job.org

La "hora de robos" se programa sola cada día (dentro de la copia de
seguridad del punto 8, con un 35% de probabilidad, en franjas horarias de
tarde/noche) y se guarda en la base de datos con su hora de inicio y fin.
Pero avisar por push de que "empieza la hora de robos" justo cuando toca
necesita que algo compruebe cada pocos minutos si ya ha llegado esa hora —
y eso **no puede ser el cron de Vercel**, porque en el plan gratuito de
Vercel los cron jobs solo se pueden ejecutar como mucho una vez al día (por
eso `vercel.json` no incluye esta ruta).

La solución es un servicio externo gratuito, [cron-job.org](https://cron-job.org),
que sí permite ejecuciones cada 1-2 minutos:

1. Crea una cuenta gratuita en <https://cron-job.org> y confirma tu email.
2. Pulsa **"Create cronjob"**.
3. En **Title**, pon algo como `Hood Cerves - aviso hora de robos`.
4. En **Address (URL)**, pon (cambiando la URL y el secreto por los tuyos):

   ```
   https://TU-URL-DE-VERCEL.vercel.app/api/cron/steal-notify?secret=TU_CRON_SECRET
   ```

   Es la misma variable `CRON_SECRET` que ya tienes configurada (ver punto 7).
5. En **Execution schedule**, elige "User-defined" y pon que se ejecute
   cada 1-2 minutos (el mínimo que te deje el plan gratuito; con cada 2
   minutos es más que suficiente para que el aviso llegue "de sorpresa").
6. Método: `GET` (el que viene por defecto). No hace falta tocar nada en la
   pestaña "Advanced" ni añadir cabeceras — el secreto va en la propia URL.
7. Guarda el cronjob.

**Para comprobar que está bien configurado**, en el propio cron-job.org
pulsa el botón de "Test run" (o espera a la siguiente ejecución programada)
y mira la respuesta: debería devolver un JSON como
`{"active":false,"notified":false}` si ahora mismo no hay hora de robos
activa, o `{"active":true,"notified":true}` la primera vez que se detecta
una activa (y `"notified":false` en las siguientes llamadas mientras siga
activa, para no duplicar el push). Si en vez de eso ves un error 401, el
`secret` de la URL no coincide con el `CRON_SECRET` de Vercel.

## 10. Contraseña de acceso compartida

Toda la web (excepto la propia pantalla de login y las rutas de cron/admin,
que ya tienen su propio secreto) queda protegida por una contraseña
compartida. La primera vez que alguien entra, le pide la contraseña; si la
acierta, se le guarda una cookie válida durante un año en ese navegador, así
que no se la vuelve a pedir salvo que borre las cookies, use otro
dispositivo, o cambies la contraseña.

Añade estas dos variables de entorno en Vercel (**Settings → Environment
Variables**, Production y Preview) — no reutilices ningún valor que haya
aparecido antes en este README o en el historial de git, considéralos
comprometidos:

```
SITE_PASSWORD=<la contraseña que elijas para el grupo>
SITE_AUTH_TOKEN=<un valor aleatorio propio, por ejemplo con: openssl rand -base64 32>
```

`SITE_PASSWORD` es la que escribirá la gente (elige la que quieras, no hace
falta que sea complicada ya que solo la vais a usar vosotros).
`SITE_AUTH_TOKEN` es un valor interno que no escribe nadie, solo se usa para
la cookie de sesión — genera uno propio, nunca lo compartas.

Si en algún momento quieres que todo el grupo tenga que volver a meter la
contraseña (por ejemplo, si se ha filtrado a alguien que no debería tenerla),
cambia el valor de `SITE_PASSWORD` (y opcionalmente también
`SITE_AUTH_TOKEN`) y haz Redeploy — invalida todas las cookies existentes de
golpe.

## Desarrollo local

Este proyecto no se ha podido instalar/probar localmente porque la máquina
donde se generó no tiene Node.js. Si en otro ordenador tienes Node.js (v18+)
instalado:

```bash
npm install
cp .env.example .env   # rellena con la connection string de tu base de datos
npm run dev
```
