import React from 'react';
import { toast } from '@/components/ui/use-toast';

export default function useTourActions() {
  const scrollTo = (selector: string): void => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadModule = (name: string): React.LazyExoticComponent<React.ComponentType<any>> => {
    return React.lazy(() => import(`@/pages/${name}.jsx`));
  };

  const showCertificate = (): void => {
    toast({
      title: 'Certificado',
      description: 'TODO: Implementar CertificateCanvas',
    });
  };

  return { scrollTo, loadModule, showCertificate };
}
