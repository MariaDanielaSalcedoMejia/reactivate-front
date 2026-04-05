import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>↯ ReActívate</h4>
          <p>Tu compañero en el camino hacia una vida más activa y saludable.</p>
        </div>
        <div class="footer-section">
          <h4>Enlaces Rápidos</h4>
          <ul>
            <li><a href="#health">Salud</a></li>
            <li><a href="#exercises">Ejercicios</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#forum">Foro</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Contacto</h4>
          <p>¿Necesitas ayuda? Estamos aquí para apoyarte.</p>
          <p>📧 contacto@reactivate.com</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 ReActívate. Todos los derechos reservados.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e2e8f0;
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 3rem;
    }

    .footer-section h4 {
      color: #ffffff;
      font-size: 1.4rem;
      font-weight: 600;
      margin: 0 0 1.2rem;
      line-height: 1.3;
    }

    .footer-section p {
      color: #cbd5e0;
      line-height: 1.6;
      font-size: 1rem;
      margin: 0.5rem 0;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section li {
      margin: 0.8rem 0;
    }

    .footer-section a {
      color: #cbd5e0;
      text-decoration: none;
      font-size: 1rem;
      transition: all 0.2s ease;
      padding: 0.5rem 0;
      display: inline-block;
    }

    .footer-section a:hover {
      color: #ffffff;
      transform: translateX(4px);
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem 2rem;
      text-align: center;
      background: rgba(0, 0, 0, 0.2);
    }

    .footer-bottom p {
      margin: 0;
      color: #a0aec0;
      font-size: 0.95rem;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 2rem 1.5rem 1.5rem;
      }

      .footer-section h4 {
        font-size: 1.3rem;
      }

      .footer-bottom {
        padding: 1.2rem 1.5rem;
      }
    }
  `]
})
export class FooterComponent {

}
