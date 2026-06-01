import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconWallet } from '@tabler/icons-react'

export function Terminos() {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Términos de Uso</h1>
            <p className="text-sm text-gray-400">Última actualización: junio 2026</p>
          </div>

          <Section title="1. Aceptación de los términos">
            <p>Al acceder y usar MyWalli, aceptás estos Términos de Uso. Si no estás de acuerdo con alguno de ellos, por favor no utilices la aplicación.</p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>MyWalli es una aplicación de gestión de finanzas personales que permite registrar ingresos, gastos, presupuestos y movimientos financieros para uso personal. La aplicación <strong>no es un servicio financiero, bancario ni de asesoramiento de inversiones</strong>.</p>
          </Section>

          <Section title="3. Uso permitido">
            <p>Podés usar MyWalli para:</p>
            <ul>
              <li>Registrar y visualizar tus transacciones personales.</li>
              <li>Organizar tus finanzas por categorías y cuentas.</li>
              <li>Generar reportes y estadísticas de tu actividad financiera.</li>
            </ul>
            <p>Queda prohibido usar la aplicación para:</p>
            <ul>
              <li>Registrar transacciones de terceros sin su consentimiento.</li>
              <li>Intentar vulnerar la seguridad de la plataforma.</li>
              <li>Cualquier uso contrario a la legislación vigente.</li>
            </ul>
          </Section>

          <Section title="4. Responsabilidad de los datos">
            <p>Vos sos el único responsable de la información que ingresás en MyWalli. La aplicación es una herramienta de registro personal; <strong>no verificamos, validamos ni auditamos los datos financieros ingresados</strong>.</p>
          </Section>

          <Section title="5. Sin asesoramiento financiero">
            <p>MyWalli no brinda asesoramiento financiero, fiscal, contable ni de inversiones. Los reportes y estadísticas que genera la app son únicamente informativos y no deben tomarse como recomendaciones profesionales.</p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>Hacemos nuestro mejor esfuerzo para mantener la aplicación disponible, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos, actualizaciones o interrupciones del servicio sin previo aviso.</p>
          </Section>

          <Section title="7. Cuentas de usuario">
            <p>Sos responsable de mantener la confidencialidad de tus credenciales de acceso. Notificanos de inmediato si detectás acceso no autorizado a tu cuenta. Nos reservamos el derecho de suspender cuentas que violen estos términos.</p>
          </Section>

          <Section title="8. Modificaciones">
            <p>Podemos modificar estos Términos de Uso en cualquier momento. Los cambios entran en vigencia al publicarlos en la aplicación. El uso continuado de MyWalli implica la aceptación de los términos actualizados.</p>
          </Section>

          <Section title="9. Contacto">
            <p>Para consultas sobre estos términos:</p>
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
