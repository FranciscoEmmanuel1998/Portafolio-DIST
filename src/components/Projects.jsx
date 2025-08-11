import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Projects = () => {
  const projects = [
    {
      title: 'Contpaqi Nóminas',
      description: 'Robot tipo GPT especializado en CONTPAQi Nóminas, capaz de responder preguntas y guiar procesos de cálculo, timbrado y dispersión de nómina, así como resolver incidencias comunes y optimizar configuraciones de periodos, percepciones y deducciones.',
      image: 'src/images/Interfaz de Chatbot con Robot Amistoso morado.png',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      liveUrl: 'https://chatgpt.com/g/g-FiQYFKIA0-contpaqi-nominas',
      githubUrl: '#'
    },
    {
      title: 'Contpaqi Facatura Electrónica',
      description: 'Robot tipo GPT especializado en CONTPAQi Factura Electrónica, capaz de explicar y asistir en la emisión, recepción y cancelación de CFDI 4.0, resolver errores de timbrado y configurar catálogos de clientes y productos conforme a requisitos del SAT.',
      image: 'src/images/Interfaz de Chatbot con Robot Amistoso Verde.png',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Socket.io'],
      liveUrl: 'https://chatgpt.com/g/g-it5u2DYzv-contpaqi-factura-electronica',
      githubUrl: '#'
    },
    {
      title: 'Contpaqi Contabilidad',
      description: 'Robot tipo GPT especializado en CONTPAQi Contabilidad, capaz de responder preguntas y realizar tareas relacionadas con pólizas, balanzas, contabilidad electrónica y reportes fiscales, garantizando la correcta generación de XML y DIOT.',
      image: 'src/images/Interfaz de Chat con Robot Amistoso azul.png',
      technologies: ['React', 'D3.js', 'OpenWeather API', 'Tailwind'],
      liveUrl: 'https://chatgpt.com/g/g-hkjPAVdUN-contpaqi-contabilidad',
      githubUrl: '#'
    },
    {
      title: 'Cotpaqi Bancos',
      description: 'Robot tipo GPT especializado en CONTPAQi Bancos, capaz de conciliar movimientos bancarios, importar estados de cuenta, detectar diferencias y sugerir reglas de automatización para agilizar la conciliación y el control de flujo efectivo.',
      image: 'src/images/Interfaz de Chatbot con Robot Amistoso blanco.png',
      technologies: ['Vue.js', 'Python', 'FastAPI', 'Chart.js'],
      liveUrl: 'https://chatgpt.com/g/g-P2OsJeMl1-contpaqi-bancos',
      githubUrl: '#'
    },
    {
      title: 'Contpaqi Comercial Premium',
      description: 'Robot tipo GPT especializado en CONTPAQi Comercial Premium, capaz de asesorar sobre inventarios, compras, ventas y cuentas por cobrar / pagar, además de automatizar reportes avanzados y depurar inconsistencias de existencias o pólizas ligadas.',
      image: 'src/images/Interfaz de Chatbot con Robot Amistoso Gris.png',
      technologies: ['React', 'Express', 'MySQL', 'AWS S3'],
      liveUrl: 'https://chatgpt.com/g/g-qoudqMUnj-contpaqi-comercial',
      githubUrl: '#'
    },
    {
      title: 'Contpaqi Comercial Start Pro',
      description: 'Robot tipo GPT especializado en CONTPAQi Comercial Start/Pro, orientado a pymes; responde dudas sobre flujo de operaciones básicas, configuración de folios, listas de precios y generación de documentos comerciales de forma ágil y guiada.',
      image: 'src/images/Interfaz de Chatbot con Robot Amistoso Rojo.png',
      technologies: ['React Native', 'Redux', 'CoinGecko API', 'Firebase'],
      liveUrl: 'https://chatgpt.com/g/g-FfEt5t2MU-contpaqi-comercial-start-pro',
      githubUrl: '#'
    }
  ];

  return (
    <section id="projects" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl floating"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-8">
            <span className="text-gradient">Proyectos Destacados</span>
          </h2>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
            Una selección de mis trabajos más recientes que demuestran mis habilidades
            y pasión por el desarrollo web
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: false }}
              whileHover={{ y: -10 }}
              className="glass-effect rounded-2xl overflow-hidden hover:glow-effect transition-all duration-300"
            >
              <div className="relative overflow-hidden">
                <img  
                  className="w-full max-h-61 object-contain object-center transition-transform duration-300 hover:scale-110" 
                  alt={`${project.title} project screenshot`}
                  src={project.image} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                  <Button
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    onClick={() => window.open(project.liveUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => window.open(project.githubUrl, '_blank')}
                  >
                    <Github className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-3xl font-bold text-white mb-4">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-5 text-2xl leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 text-sm rounded-full border border-blue-500/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    onClick={() => window.open(project.liveUrl, '_blank')}
                  >
                    Ver Proyecto
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => window.open(project.githubUrl, '_blank')}
                  >
                    <Github className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;