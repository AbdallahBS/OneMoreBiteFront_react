import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-[#FAF3EA] border-t border-[#EFE4D7] pt-12 pb-8 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-1 flex flex-col">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              </div>
              <span className="text-[18px] font-extrabold text-primary">One More Bite</span>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed mb-4">
              Plateforme engagée pour la réduction du gaspillage alimentaire en Tunisie. Sauvez de
              délicieux repas tout en économisant votre budget !
            </p>
            <span className="font-handwriting text-primary text-[17px] font-bold">
              « Du bon goût à petit prix... » 🍃
            </span>
          </div>

          <div>
            <h5 className="text-[14px] font-bold text-[#231F20] mb-3">Navigation</h5>
            <ul className="space-y-2 text-[13px] text-on-surface-variant">
              <li>
                <Link className="hover:text-primary transition-colors" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/#produits">
                  Paniers disponibles
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/#commercants">
                  Commerçants partenaires
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/panier">
                  Mon Panier & Réservation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[14px] font-bold text-[#231F20] mb-3">Pour les commerçants</h5>
            <ul className="space-y-2 text-[13px] text-on-surface-variant">
              <li>
                <Link
                  className="hover:text-primary transition-colors"
                  to="/auth?mode=register&role=commercant"
                >
                  Inscrire mon commerce
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/auth?role=commercant">
                  Espace partenaire
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/#comment-ca-marche">
                  Avantages zéro-gaspi
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" to="/#faq">
                  FAQ Commerçants
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[14px] font-bold text-[#231F20] mb-3">Contact & Support</h5>
            <ul className="space-y-2 text-[13px] text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  location_on
                </span>
                <span>Tunis, Tunisie</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                <span>contact@onemorebite.tn</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">phone</span>
                <span>+216 71 000 000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8DDCE] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-on-surface-variant">
          <p>© {new Date().getFullYear()} One More Bite. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-primary transition-colors text-xs opacity-75 hover:opacity-100 flex items-center gap-1" to="/admin/auth">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              <span>Portail Admin</span>
            </Link>
            <a className="hover:text-primary transition-colors" href="#">
              Mentions légales
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Politique de confidentialité
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Conditions générales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
