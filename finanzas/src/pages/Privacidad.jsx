import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconWallet } from '@tabler/icons-react'

export function Privacidad() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-5 py-8">

        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white border border-gray-200 text-gray-500 transition">
            <IconArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
              <IconWallet size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">MyWalli</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Política de Privacidad</h1>
            <p className="text-sm text-gray-400">Última actualización: junio 2026</p>
          </div>

          <Section title="1. Información que recopilamos">
            <p>MyWalli recopila únicamente la información necesaria para brindar el servicio de gestión de finanzas personales:</p>
            <ul>
              <li><strong>Datos de cuenta:</strong> dirección de correo electrónico utilizada para registrarse.</li>
              <li><strong>Datos financieros:</strong> transacciones (montos, fechas, notas), categorías, métodos de pago y cuentas que el usuario crea voluntariamente.</li>
              <li><strong>Datos de uso:</strong> información técnica básica para el funcionamiento de la aplicación (no utilizamos análisis de comportamiento ni publicidad).</li>
            </ul>
          </Section>

          <Section title="2. Cómo usamos tu información">
            <p>La información recopilada se utiliza exclusivamente para:</p>
            <ul>
              <li>Mostrar y sincronizar tus finanzas personales entre dispositivos.</li>
              <li>Generar reportes y estadísticas visibles únicamente para vos.</li>
              <li>Mantener tu sesión activa de forma segura.</li>
            </ul>
            <p className="font-semibold text-gray-800">No vendemos, compartimos ni cedemos tus datos a terceros bajo ninguna circunstancia.</p>
          </Section>

          <Section title="3. Almacenamiento de datos">
            <p>Tus datos se almacenan de forma segura en <strong>Supabase</strong> (Supabase Inc., EE.UU.), una plataforma de base de datos en la nube que cumple con estándares de seguridad SOC 2. La comunicación con el servidor se realiza siempre mediante conexiones cifradas (HTTPS/TLS).</p>
          </Section>

          <Section title="4. Retención y eliminación de datos">
            <p>Podés eliminar tu cuenta y todos tus datos en cualquier momento desde la sección <strong>Mi cuenta</strong> dentro de la aplicación. Una vez confirmada la eliminación, todos tus datos son borrados de forma permanente e irrecuperable en un plazo máximo de 24 horas.</p>
          </Section>

          <Section title="5. Seguridad">
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo cifrado en tránsito y en reposo, autenticación segura y acceso restringido a los datos.</p>
          </Section>

          <Section title="6. Menores de edad">
            <p>MyWalli no está dirigido a menores de 13 años. No recopilamos conscientemente información de menores. Si detectamos que se ha registrado un menor, eliminaremos su cuenta.</p>
          </Section>

          <Section title="7. Cambios a esta política">
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos mediante un aviso en la aplicación. El uso continuado de MyWalli después de los cambios implica la aceptación de la nueva política.</p>
          </Section>

          <Section title="8. Contacto">
            <p>Si tenés preguntas sobre esta política de privacidad o querés ejercer tus derechos sobre tus datos, podés contactarnos en:</p>
            <p><a href="mailto:fefe1carini@gmail.com" className="text-primary-600 hover:underline font-medium">fefe1carini@gmail.com</a></p>
          </Section>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© {new Date().getFullYear()} MyWalli. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <div className="text-sm text-gray-600 space-y-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}
