import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Acceso | Mi Cartera" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="login-visual-inner">
          <Brand />
          <p className="login-eyebrow">Tu dinero, en perspectiva</p>
          <h1>Claridad para cada decisión.</h1>
          <p className="login-quote">
            Controla lo que tienes, lo que llega y lo que está por pagar desde
            un único lugar.
          </p>
          <div className="visual-balance-card">
            <span>Balance proyectado</span>
            <strong>Todo bajo control</strong>
            <div className="visual-line">
              <i />
            </div>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-form-wrap">
          <p className="login-kicker">Área privada</p>
          <h2>Qué bueno verte de nuevo</h2>
          <p className="login-intro">
            Introduce tu contraseña para acceder a tu cartera personal.
          </p>
          <LoginForm />
          <p className="privacy-note">Acceso cifrado y protegido</p>
        </div>
      </section>
    </main>
  );
}
