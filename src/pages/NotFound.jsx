import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-surface px-6 pt-20">
        <div className="flex max-w-lg flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[32px]">explore_off</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Page introuvable</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            La page que vous cherchez n&apos;existe pas ou a été déplacée. Revenez à l&apos;accueil
            pour continuer à sauver de bons petits plats.
          </p>
          <Link
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-container px-6 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary"
            to="/"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
