import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Zap } from 'lucide-react';

const SymbioticDialog = () => {
  const dialogModes = [
    { name: "Modo Espejo", description: "Reflexión y auto-descubrimiento a través de la IA.", icon: MessageSquare },
    { name: "Modo Resonancia", description: "Exploración colaborativa de ideas con otros usuarios (simulado).", icon: Users },
    { name: "Modo Núcleo", description: "Profundización en conceptos centrales con la IA generativa.", icon: Zap },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 h-full"
    >
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-primary text-glow">Espacios de Diálogo Simbiótico</h2>
        <p className="text-muted-foreground">Interactúa y expande tus ideas en diferentes modos de diálogo.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {dialogModes.map((mode, index) => (
          <motion.div
            key={mode.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="border border-primary/50 p-6 rounded-lg bg-background/30 hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <mode.icon className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">{mode.name}</h3>
            <p className="text-sm text-muted-foreground">{mode.description}</p>
            <button className="mt-4 px-4 py-2 bg-primary/80 text-primary-foreground hover:bg-primary text-sm rounded transition-colors w-full">
              Iniciar {mode.name}
            </button>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-10 p-6 border border-dashed border-primary/30 rounded-lg bg-background/20">
        <h4 className="text-lg font-semibold text-primary mb-2">Área de Interacción (Placeholder)</h4>
        <p className="text-sm text-muted-foreground">
          Aquí se desarrollará la interfaz de diálogo específica para el modo seleccionado.
          Por ahora, es un marcador de posición.
        </p>
        <textarea
          className="w-full mt-4 p-3 bg-input border border-primary/50 rounded-md text-foreground placeholder-muted-foreground focus:ring-primary focus:border-primary min-h-[100px]"
          placeholder="Escribe tu pensamiento inicial aquí..."
        />
      </div>
    </motion.div>
  );
};

export default SymbioticDialog;