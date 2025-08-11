import { useEffect } from 'react';

// Página placeholder: la animación interna fue eliminada.
// Al montar, abrimos la versión externa y mostramos un aviso / enlace de respaldo.
const AnimationPlaceholder = () => {
  const externalUrl = 'http://192.168.1.70:8080/';

  useEffect(() => {
    // Intento de apertura en nueva pestaña; algunos navegadores pueden bloquearlo si no proviene de interacción.
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-amber-300 font-mono p-6 text-center space-y-6">
      <h1 className="text-2xl">Animación trasladada</h1>
      <p className="max-w-md text-amber-200/80 text-sm leading-relaxed">
        La simulación/animación original ahora vive fuera de este build. Se intentó abrir automáticamente
        en una nueva pestaña. Si no se abrió (bloqueo de pop-up), puedes acceder manualmente aquí:
      </p>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-3 rounded-md bg-amber-600/20 border border-amber-400/30 hover:bg-amber-500/30 hover:border-amber-300 transition-colors"
      >
        Abrir Animación Externa
      </a>
      <p className="text-xs text-amber-400/50">Ruta interna /animation convertida a redirección externa.</p>
    </div>
  );
};

export default AnimationPlaceholder;