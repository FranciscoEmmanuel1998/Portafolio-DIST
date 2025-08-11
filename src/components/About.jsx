import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Palette, Zap, Code, FileJson, Database } from 'lucide-react';
import image from '../images/fondo.jpg';

const About = () => {
  const features = [
    {
      icon: Database,
      title: 'Desarrollo Full-Stack',
      description: 'Front-end y back-end con JavaScript/TypeScript (React, Tailwind), Python y SQL Server.'
    },  
    {
      icon: Palette,
      title: 'Diseño UI/UX Funcional',
      description: 'Creo interfaces claras, limpias y enfocadas en la acción. Diseño experiencias que no solo se ven bien, sino que mejoran la eficiencia real del usuario en cada clic.'
    },
    {
      icon: FileJson,
      title: 'Especialista CONTPAQi & Fiscal',
      description: 'Conocimiento completo de interfaces y dominio de Comercial Premium, Start/Pro, Contabilidad, Bancos, Nóminas y Factura Electrónica.'
    },
    {
      icon: Zap,
      title: 'Diagnóstico, Soporte y Resolución Real',
      description: 'Transformo usuarios en expertos mediante cursos prácticos y guías paso a paso; dejo procesos claros, reproducibles y libres de dependencia técnica'
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
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Ingeniero de soporte senior y Full-Stack Developer. Domino JavaScript/TypeScript (React, Tailwind), Python (LangChain, Ollama) y SQL Server.
Cuento con 2 años de experiencia especializada en el ecosistema CONTPAQi (Factura Electrónica, Comercial Premium, Start/Pro, Contabilidad, Bancos y Nóminas), donde he resuelto más de 2 000 tickets de soporte técnico, configuración, capacitación y personalización, con un índice de satisfacción del 96 %.
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
              <img  
                className="w-full h-80 object-cover rounded-xl mb-6" 
                alt="Desarrollador trabajando en código"
                src={image} 
              />
              <p className="text-gray-300 leading-relaxed">
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
            className="space-y-6"
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