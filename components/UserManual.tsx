import React from 'react';
import { DownloadIcon, BookOpenIcon } from './Icons';

export const UserManual: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  const SectionHeader: React.FC<{ icon: string; title: string; colorClass: string; sectionNumber: number }> = ({ icon, title, colorClass, sectionNumber }) => (
    <h3 className={`text-2xl font-bold ${colorClass} mb-4 flex items-center border-b-2 border-gray-200 pb-2`}>
      <span className={`bg-gray-100 ${colorClass} w-8 h-8 rounded-full flex items-center justify-center mr-4 font-sans text-sm`}>{sectionNumber}</span>
      {icon} <span className="ml-2">{title}</span>
    </h3>
  );

  const Feature: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <div className="font-bold text-gray-900 w-full sm:w-48 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 pb-1 sm:pb-0 sm:pr-3">
        {title}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8 no-print">
        <div className="flex items-center gap-4">
          <div className="bg-[var(--primary-red)] p-3 rounded-xl text-white shadow-lg">
            <BookOpenIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white font-bangers tracking-wide">MANUAL DE USUARIO</h2>
            <p className="text-gray-400">Guía operativa para Loco Alitas Pro</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-emerald-700 transition-all font-bold gap-2 hover:scale-105"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>Imprimir / PDF</span>
        </button>
      </div>

      <div className="printable-content bg-white text-gray-800 p-8 rounded-xl shadow-2xl space-y-10 font-sans">
        {/* HEADER FOR PDF */}
        <div className="text-center border-b-2 border-red-600 pb-6 mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">Loco Alitas Pro</h1>
          <p className="text-lg text-gray-600">Documentación Oficial del Sistema de Gestión</p>
          <p className="text-sm text-gray-500 mt-2">Versión 3.0 | Generado el {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* 1. AI CORE */}
        <section>
          <SectionHeader icon="🧠" title="El Núcleo IA: Funciones Inteligentes" colorClass="text-purple-700" sectionNumber={1} />
          <p className="text-gray-600 mb-4 text-sm">
            Estas funciones utilizan Google Gemini para potenciar la gestión de tu restaurante, automatizando tareas y ofreciendo análisis avanzados.
          </p>
          <div className="space-y-4">
            <Feature title="Asistente de Compras IA">
              Desde el <strong>Dashboard</strong>, presiona el botón <code className="text-sm">Asistente de Compras IA</code>. Se abrirá un panel donde puedes usar tu voz para pedir la lista de compras (ej: "genera la lista para mañana"). La IA analizará el inventario actual, las ventas del día y las recetas para crear una lista de compras priorizada y justificada, que puedes copiar, imprimir o enviar por WhatsApp.
            </Feature>
            <Feature title="Clientes Pro (CRM con IA)">
              Cada venta de <strong>Delivery</strong> o <strong>Para Llevar</strong> crea o actualiza un perfil de cliente automáticamente. En el módulo <code className="text-sm">Clientes Pro</code>, puedes ver el historial de cada cliente y usar el botón <code className="text-sm">Generar Análisis con IA</code> para obtener etiquetas de comportamiento (ej: "Fan de las Hamburguesas") y una sugerencia de beneficio personalizado para fidelizarlo.
            </Feature>
            <Feature title="Comandos de Voz (Manos Libres)">
              Acelera tu operación hablando con el sistema:
              <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                <li><strong>POS:</strong> Usa el micrófono flotante para tomar pedidos completos. Ej: <code className="text-xs">"Mesa 5, dos hamburguesas y una limonada de coco"</code>.</li>
                <li><strong>Monitor de Cocina:</strong> Marca órdenes como listas. Ej: <code className="text-xs">"El pedido de la mesa 5 está listo"</code>.</li>
                <li><strong>Inventario:</strong> Crea, ajusta o actualiza el stock. Ej: <code className="text-xs">"Ajustar stock de papas a 30 kilos"</code>.</li>
              </ul>
            </Feature>
            <Feature title="Profe Loco (Entrenador IA)">
              El Profe Loco es tu coach personal. En el <strong>Dashboard</strong>, te dará consejos y retos diarios basados en las ventas. También puedes abrir su <strong>Chat de Entrenamiento</strong> (botón flotante) para preguntarle CUALQUIER duda sobre cómo usar la aplicación.
            </Feature>
          </div>
        </section>

        {/* 2. DAILY OPERATIONS */}
        <section>
          <SectionHeader icon="⚙️" title="Operación Diaria" colorClass="text-blue-700" sectionNumber={2} />
           <div className="space-y-4">
            <Feature title="POS (Punto de Venta)">
              El corazón de la operación. Selecciona el tipo de orden (Restaurante, Delivery, Llevar), añade productos y gestiona las personalizaciones. Usa <code className="text-sm">Importar (IA)</code> para crear órdenes de Delivery/Llevar pegando el texto de un chat de WhatsApp.
            </Feature>
             <Feature title="Gestión de Mesas">
              Organiza el mapa de tu restaurante. Primero crea "Salones" (ej: Terraza), luego tus mesas. En la vista <code className="text-sm">Mapa</code>, arrastra y suelta cada mesa para replicar tu distribución física. El mapa se guarda automáticamente.
            </Feature>
            <Feature title="Monitor de Cocina (KDS)">
              Visualiza en tiempo real todas las órdenes activas, separadas por tarjetas que indican su destino (Mesa, Delivery, etc.) y el tiempo transcurrido. Usa comandos de voz para marcar una orden como <code className="text-sm">"Lista"</code> sin tocar la pantalla.
            </Feature>
            <Feature title="Delivery Pro">
               Un tablero Kanban para gestionar domicilios. Las órdenes avanzan por las columnas: <strong>Cotización</strong> (contactas al domiciliario), <strong>En Cocina</strong> (cliente confirmó) y <strong>Despacho</strong> (entregado al conductor). La IA te ayuda a generar enlaces de mapa y a extraer el costo y tiempo de la respuesta del domiciliario.
            </Feature>
          </div>
        </section>

        {/* 3. ADMIN & STRATEGY */}
        <section>
          <SectionHeader icon="📈" title="Administración y Estrategia" colorClass="text-green-700" sectionNumber={3} />
          <div className="space-y-4">
            <Feature title="Gestión de Menú">
              Crea y edita tus platillos. Usa la IA para <code className="text-sm">Generar Descripciones</code> atractivas, <code className="text-sm">Crear Imágenes</code> profesionales y <code className="text-sm">Analizar Precios</code> basados en el costo de la receta para asegurar tu rentabilidad.
            </Feature>
            <Feature title="Reportes">
              Analiza tus ventas con filtros por fecha y salón. Visualiza gráficos de tendencias, productos más vendidos y métodos de pago. Presiona el botón <code className="text-sm">IA</code> para que Gemini te genere un resumen ejecutivo con conclusiones y recomendaciones estratégicas.
            </Feature>
             <Feature title="Configuración">
              El panel de control. Gestiona <strong>Usuarios y Roles</strong> para dar permisos específicos a tu personal. En <strong>Negocio</strong>, configura los datos que aparecen en los recibos. Y lo más importante, en <strong>IA & API</strong>, pega tu API Key de Google Gemini para activar todas las funciones Pro.
            </Feature>
          </div>
        </section>

        {/* 4. QUICKSTART */}
        <section>
          <SectionHeader icon="🚀" title="Guía de Inicio Rápido" colorClass="text-red-700" sectionNumber={4} />
          <p className="text-gray-600 mb-4 text-sm">
            Estas son las credenciales por defecto para explorar el sistema. Se recomienda cambiarlas en <strong>Configuración &gt; Usuarios</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900">Administrador</h4>
              <p className="text-xs text-gray-600 mb-2">Acceso total al sistema.</p>
              <code className="block bg-gray-200 p-2 rounded text-sm font-mono">User: admin</code>
              <code className="block bg-gray-200 p-2 rounded text-sm font-mono mt-1">Pass: 123</code>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900">Cajero / Mesero</h4>
              <p className="text-xs text-gray-600 mb-2">POS, Delivery y WhatsApp.</p>
              <code className="block bg-gray-200 p-2 rounded text-sm font-mono">User: mesero</code>
              <code className="block bg-gray-200 p-2 rounded text-sm font-mono mt-1">Pass: 123</code>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900">Cocinero</h4>
              <p className="text-xs text-gray-600 mb-2">Solo Monitor de Cocina (KDS).</p>
              <code className="block bg-gray-200 p-2 rounded text-sm font-mono">User: chef</code>
              <code className="block bg-gray-200 p-2 rounded text-sm font-mono mt-1">Pass: 123</code>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="text-center text-gray-500 text-xs pt-8 border-t border-gray-200 mt-10">
            © {new Date().getFullYear()} Loco Alitas Pro | Powered by Google Gemini
        </div>
      </div>
    </div>
  );
};