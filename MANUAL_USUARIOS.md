# Manual de Usuarios - Sistema CAE TalkChile

---

## 1. ADMINISTRADOR

El administrador tiene acceso completo al sistema. Gestiona alumnos, profesores, vendedores y otros administradores.

### 1.1 Dashboard
Al iniciar sesion veras un resumen general con:
- **Total de alumnos**, alumnos activos y bloqueados
- **Profesores** activos
- **Clases de hoy** programadas
- **Alertas pendientes**
- Lista de **alumnos sin profesor asignado** con boton para asignar

### 1.2 Gestion de Alumnos
**Menu: Alumnos**

Veras una tabla con todos los alumnos, filtrable por pestanas:
- **Todos** - Lista completa
- **Activos** - Con horas disponibles y sin bloqueo
- **Sin horas** - Sin horas restantes
- **Bloqueados** - Cuentas bloqueadas

**Acciones disponibles:**
- **Nuevo Alumno** - Abre formulario para registrar alumno con:
  - Datos personales (nombre, apellido, email, telefono, RUT)
  - Datos del curso (nivel MCER, modalidad, horas contratadas)
  - Horarios de clase (dia, hora inicio, hora fin)
  - Al crearse, se envia email de bienvenida con credenciales al alumno
- **Carga Masiva** - Importar multiples alumnos desde archivo Excel
- **Exportar Excel** - Descargar lista de alumnos en Excel

**Detalle de alumno** (click en el icono del ojo):
- Informacion personal y del curso
- Modalidad y nivel MCER
- Horas restantes y contratadas
- Profesor asignado
- Horarios activos
- Ultimas 10 clases con estado
- Acciones: asignar profesor, editar horas, editar datos, bloquear/desbloquear, eliminar

### 1.3 Gestion de Profesores
**Menu: Profesores**

Tabla con todos los profesores mostrando:
- Nombre y contacto
- Especialidades (niveles MCER)
- Cantidad de alumnos asignados
- Estado (activo/inactivo)

**Acciones:**
- **Nuevo Profesor** - Formulario con nombre, apellido, email, telefono, especialidades y link de Zoom
- **Carga Masiva** - Importar desde Excel
- **Ver detalle** - Informacion completa, alumnos asignados, clases del dia
- **Eliminar profesor**

### 1.4 Gestion de Vendedores
**Menu: Vendedores**

Tabla con vendedores registrados mostrando:
- Nombre y contacto
- Cantidad de alumnos creados
- Boton para eliminar

**Acciones:**
- **Nuevo Vendedor** - Formulario con nombre, apellido, email y telefono
- Al crearse, se envia email con credenciales

### 1.5 Administradores
**Menu: Administradores**

Lista de todos los administradores del sistema.
- Solo el **Super Administrador** puede crear nuevos administradores
- Los demas administradores pueden ver la lista pero no crear

### 1.6 Horarios
**Menu: Horarios**

Vista de las clases organizadas por fecha:
- **Clases de hoy** - Hora, alumno, profesor y estado
- **Proximos 7 dias** - Agrupadas por fecha
- **Generar Clases** - Boton para generar las clases segun los horarios configurados de cada alumno

### 1.7 Reportes
**Menu: Reportes**

Estadisticas del sistema:
- Total de alumnos y activos
- Profesores activos
- Horas disponibles en total
- Clases del mes actual
- **Distribucion por nivel MCER** - Grafico de barras con porcentajes
- **Distribucion por modalidad** - Privado, Livemode, Kids, Presencial, Espanol, Nativo
- **Estado de clases del mes** - Completadas, no asistio, canceladas y tasa de asistencia

---

## 2. VENDEDOR

El vendedor registra nuevos alumnos y hace seguimiento de sus horas.

### 2.1 Dashboard
Resumen con:
- **Alumnos registrados** por este vendedor
- **Alumnos activos**
- **Alertas pendientes**
- Boton rapido **Registrar Nuevo Alumno**
- Lista de los ultimos 5 alumnos registrados

### 2.2 Nuevo Alumno
**Menu: Nuevo Alumno**

Formulario completo para registrar un alumno:
1. **Datos Personales**: nombre, apellido, email, telefono, RUT (opcional)
2. **Datos del Curso**: nivel MCER, modalidad del curso, horas contratadas
3. **Horarios de Clase**: agregar uno o mas horarios (dia, hora inicio, hora fin)

Al guardar:
- Se crea la cuenta del alumno automaticamente
- Se muestra la contrasena temporal en pantalla (copiar y guardar)
- Se envia email de bienvenida al alumno con sus credenciales y la carta de bienvenida segun la modalidad del curso

### 2.3 Mis Alumnos
**Menu: Mis Alumnos**

Tabla con todos los alumnos registrados por este vendedor:
- Nombre, email, nivel, modalidad, horas restantes y estado
- Click en el ojo para ver detalle del alumno

### 2.4 Alertas
**Menu: Alertas**

Notificaciones sobre tus alumnos:
- **Alertas sin leer** - Destacadas con borde naranja
- **Alertas anteriores** - Ya leidas, en gris
- Las alertas se generan cuando un alumno tiene 5 horas o menos restantes

---

## 3. PROFESOR

El profesor ve sus clases del dia, marca asistencia y gestiona a sus alumnos.

### 3.1 Dashboard
Resumen con:
- **Alumnos asignados**
- **Clases de hoy**
- **Horas esta semana**
- **Proxima clase** - Muestra el alumno, hora y boton "Iniciar Clase"
- Lista de todas las clases del dia con estado

### 3.2 Clases Hoy
**Menu: Clases Hoy**

Vista detallada de las clases del dia:
- **Sala de Zoom** - Si tienes link de Zoom configurado, aparece un boton para abrir la sala
- **Clases pendientes** - Cada clase muestra:
  - Nombre del alumno
  - Horario
  - Nivel y horas restantes
  - Telefono del alumno
  - Boton **Marcar Asistencia**
- **Clases completadas** - Clases ya marcadas del dia

**Marcar Asistencia** - Al hacer click se abre una pagina con:
- Informacion del alumno (nombre, nivel, horas)
- Link para abrir Zoom
- Opciones para marcar:
  - **Clase Completada** - Se descuenta la hora al alumno
  - **No Asistio** - Se registra inasistencia
  - **Cancelar Clase** - Se cancela sin descontar
- Campo para agregar notas del profesor

### 3.3 Mis Alumnos
**Menu: Mis Alumnos**

Tarjetas con los alumnos asignados mostrando:
- Nombre y nivel
- Horas restantes (en rojo si quedan 5 o menos)
- Email y telefono de contacto
- Horarios de clase programados

### 3.4 Materiales por Alumno
**Menu: Materiales**

Permite subir archivos o compartir enlaces especificos para cada alumno.

**Pasos:**
1. Selecciona un alumno del listado desplegable
2. Click en **Agregar Material**
3. Elige el modo:
   - **Enlace URL** - Pega un link externo (YouTube, Google Drive, sitio web, etc.)
   - **Subir Archivo** - Sube un archivo desde tu computador
4. Completa los campos:
   - **Titulo** - Nombre descriptivo del material
   - **Tipo** - Documento, Video, Audio o Ejercicio
   - **Descripcion** (opcional) - Detalle adicional
5. Click en **Agregar Material**

**Archivos permitidos:**
- Formatos: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, MP3, MP4
- Tamano maximo: 10MB

**Acciones sobre materiales existentes:**
- **Descargar** - Para archivos subidos, genera un enlace de descarga
- **Abrir enlace** - Para links externos, abre en nueva pestana
- **Eliminar** - Boton de papelera, pide confirmacion antes de eliminar

El alumno vera automaticamente estos materiales en su pagina de Material, en la seccion "Material de mi Profesor".

---

## 4. ALUMNO

El alumno ve sus clases, se une a las sesiones y accede al material de estudio.

### 4.1 Dashboard
Al iniciar sesion veras:
- **Horas restantes** - Numero grande con el total de horas disponibles
  - Si te quedan 5 horas o menos, aparece una alerta
  - Si tu cuenta esta bloqueada, veras un mensaje de bloqueo
- **Proxima clase** - Fecha, hora y boton "Unirse a la Clase" (abre Zoom)
- **Mi Profesor** - Nombre y email de tu profesor asignado
- **Mis Horarios** - Dias y horas de tus clases regulares
- **Accesos rapidos** - Botones para calendario, historial y material

### 4.2 Mi Clase
**Menu: Mi Clase**

- Si tienes clase hoy, aparece la **Clase Activa** con:
  - Informacion del profesor
  - Horario
  - Boton para unirte por Zoom
- **Calendario de clases** - Vista de todas tus clases programadas del mes actual y siguiente
- Boton para **descargar calendario**
- Si no tienes horas disponibles, aparece un aviso para contactar a tu vendedor

### 4.3 Historial
**Menu: Historial**

Resumen de tu actividad:
- **Clases completadas** (total)
- **Inasistencias** (total)
- **Canceladas** (total)
- Lista de todas tus clases con:
  - Fecha y hora
  - Nombre del profesor
  - Notas del profesor (si las hay)
  - Estado de la clase

### 4.4 Material de Estudio
**Menu: Material**

La pagina de material tiene dos secciones:

**Material de mi Profesor:**
- Material personalizado que tu profesor sube especificamente para ti
- Puede ser archivos (PDF, documentos, imagenes, audio, video) o enlaces externos
- Para archivos: boton **Descargar** abre el archivo en nueva pestana
- Para enlaces: boton **Abrir enlace** abre el link directamente
- Muestra la fecha en que fue compartido

**Material por Nivel:**
- Material global organizado por nivel MCER
- Puedes ver material de tu nivel actual y los niveles anteriores
- Cada material muestra:
  - Tipo (documento, video, audio, ejercicio)
  - Titulo y descripcion
  - Boton "Abrir" para acceder al recurso

---

## MODALIDADES DE CURSO

Cada alumno tiene una modalidad asignada al momento de su registro:

| Modalidad | Descripcion |
|-----------|-------------|
| **Privado** | Clase privada online 1 a 1 |
| **Livemode** | Clase online LiveMode 1 a 1 |
| **Kids** | Clase para ninos |
| **Presencial** | Clase presencial 1 a 1 |
| **Espanol** | Curso de espanol |
| **Nativo** | Clase con profesor nativo |

La modalidad se muestra en la tabla de alumnos, en el detalle del alumno y en los reportes de distribucion.

---

## CORREOS AUTOMATICOS

El sistema envia los siguientes correos automaticamente:

1. **Bienvenida al alumno** - Al crear un alumno, se envia carta de bienvenida con:
   - Mensaje adaptado segun la modalidad del curso
   - Detalles del curso (nivel, horas, modalidad)
   - Credenciales de acceso (email y contrasena temporal)
   - Politicas de cancelacion, suspension y reemplazo de profesor

2. **Bienvenida a profesor/vendedor/admin** - Credenciales de acceso al sistema

3. **Recordatorio de clase** - 10 minutos antes de la clase, el alumno recibe un email con link de Zoom

4. **Clases sin marcar** - Si un profesor no marca asistencia, recibe un recordatorio

5. **Clase cancelada** - Cuando un alumno cancela, el profesor recibe notificacion

---

## ACCESO AL SISTEMA

- **URL**: https://sistema-cae.onrender.com
- Cada usuario inicia sesion con su email y contrasena temporal
- Se recomienda cambiar la contrasena despues del primer ingreso
- Los correos del sistema se envian desde: livemode@talkchile.cl
