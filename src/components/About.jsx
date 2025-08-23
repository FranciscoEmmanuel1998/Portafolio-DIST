import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Palette, Zap, Code, FileJson, Database,Brain } from 'lucide-react';
import image from '../images/fondo.jpg';

const About = () => {
   const setupImages = [
    {
      src: '/images/yo.jpg',
      alt: 'Setup de escritorio con tres monitores y teclado RGB',
      className: 'h-96 object-contain rounded-xl', // <- mostrar completa sin recorte
    },
    {
      src: '/images/fondo.jpg',
      alt: 'Setup de escritorio con varios monitores y ambiente profesional',
      className: 'w-full h-80 object-cover rounded-xl mb-6',
    },
  ];
    const [currentImage, setCurrentImage] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % setupImages.length);
      }, 3000); // Cambia cada 3 segundos
      return () => clearInterval(interval);
    }, []);
  const features = [
    {
      icon: Database,
      title: 'Desarrollo Full-Stack',
      description: 'React, Next.js, TypeScript, Tailwind, Node.js, WebSockets, APIs REST.'
    },
     {
      icon: Brain,
      title: 'Automatización e IA',
      description: 'Integración de ChatGPT, LangChain, Ollama y desarrollo de asistentes internos.'
    },
    {
      icon: Palette,
      title: 'Diseño UI/UX Funcional',
      description: 'Experiencia en UI/UX centrada en la acción y la usabilidad.'
    },
    {
      icon: FileJson,
      title: 'Sistemas Empresariales',
      description: 'Experto en ecosistema CONTPAQi (Comercial Premium, Bancos, Contabilidad, Nóminas).'
    },
    {
      icon: Zap,
      title: 'Optimización de Procesos',
      description: 'Documentación clara, capacitación efectiva y soporte técnico avanzado.'
    }
  ];

  return (
    <section id="about" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient">Acerca de Mí</span>
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto w-full">
            Desarrollador Full-Stack | Especialista en Automatización e IA
Apasionado por crear soluciones que combinan tecnología, diseño y estrategia
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
          >
            <div className="glass-effect rounded-2xl p-8 hover:glow-effect transition-all duration-300">
              <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            viewport={{ once: true }}
                            className="glass-effect rounded-2xl p-8"
                          >
                            <div className="w-full h-64 flex items-center justify-center">
                              <img
  className={`w-full ${setupImages[currentImage].className} transition-all duration-700`}
  alt={setupImages[currentImage].alt}
  src={setupImages[currentImage].src}
/>
                            </div>
                          </motion.div>
              <p className="text-gray-300 leading-relaxed" style={{ paddingTop: '2rem' }}>
                Me apasiona la automatización de procesos y en mis tiempos libres diseño arquitecturas de inteligencia artificial con enfoque innovador.
Mi lema es claro: convertir datos en decisiones estratégicas.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            className="space-y-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: false }}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-xl p-6 hover:glow-effect transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
