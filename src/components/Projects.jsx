import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const Projects = () => {
  const projects = [
    {
      title: "Contpaqi Nóminas",
      description:
        "Robot tipo GPT especializado en CONTPAQi Nóminas, capaz de responder preguntas y guiar procesos de cálculo, timbrado y dispersión de nómina, así como resolver incidencias y optimizar configuraciones.",
      image: "/images/InterfazdeChatbotconRobotAmistosomorado.png",
      technologies: ["Go", "TypeScript", "JavaScript ", "HTML / CSS","SQL","JSON","React","Vite","Tailwind","Zustand", "Dockerfile"],
      liveUrl: "https://chatgpt.com/g/g-FiQYFKIA0-contpaqi-nominas",
      githubUrl: "https://github.com/FranciscoEmmanuel1998/Catbot-de-IA-local",
    },
    {
      title: "Contpaqi Facatura Electrónica",
      description:
        "Robot tipo GPT especializado en CONTPAQi Factura Electrónica: emisión, recepción y cancelación de CFDI 4.0, resolución de errores de timbrado y configuración de catálogos conforme al SAT.",
      image: "/images/InterfazdeChatbotconRobotAmistosoVerde.png",
      technologies: ["Go", "TypeScript", "JavaScript ", "HTML / CSS","SQL","JSON","React","Vite","Tailwind","Zustand", "Dockerfile"],
      liveUrl: "https://chatgpt.com/g/g-it5u2DYzv-contpaqi-factura-electronica",
      githubUrl: "https://github.com/FranciscoEmmanuel1998/Catbot-de-IA-local",
    },
    {
      title: "Contpaqi Contabilidad",
      description:
        "Robot tipo GPT para CONTPAQi Contabilidad: pólizas, balanzas, contabilidad electrónica y reportes fiscales, garantizando la correcta generación de XML y DIOT.",
      image: "/images/InterfazdeChatconRobotAmistosoazul.png",
      technologies: ["Go", "TypeScript", "JavaScript ", "HTML / CSS","SQL","JSON","React","Vite","Tailwind","Zustand", "Dockerfile"],
      liveUrl: "https://chatgpt.com/g/g-hkjPAVdUN-contpaqi-contabilidad",
      githubUrl: "https://github.com/FranciscoEmmanuel1998/Catbot-de-IA-local",
    },
    {
      title: "Cotpaqi Bancos",
      description:
        "Robot tipo GPT para CONTPAQi Bancos: conciliación de movimientos, importación de estados de cuenta, detección de diferencias y reglas de automatización.",
      image: "/images/InterfazdeChatbotconRobotAmistosoblanco.png",
      technologies: ["Go", "TypeScript", "JavaScript ", "HTML / CSS","SQL","JSON","React","Vite","Tailwind","Zustand", "Dockerfile"],
      liveUrl: "https://chatgpt.com/g/g-P2OsJeMl1-contpaqi-bancos",
      githubUrl: "https://github.com/FranciscoEmmanuel1998/Catbot-de-IA-local",
    },
    {
      title: "Contpaqi Comercial Premium",
      description:
        "Robot tipo GPT para CONTPAQi Comercial Premium: inventarios, compras, ventas y CxC/CxP; automatización de reportes y depuración de inconsistencias.",
      image: "/images/InterfazdeChatbotconRobotAmistosoGris.png",
      technologies: ["Go", "TypeScript", "JavaScript ", "HTML / CSS","SQL","JSON","React","Vite","Tailwind","Zustand", "Dockerfile"],
      liveUrl: "https://chatgpt.com/g/g-qoudqMUnj-contpaqi-comercial",
      githubUrl: "https://github.com/FranciscoEmmanuel1998/Catbot-de-IA-local",
    },
    {
      title: "Contpaqi Comercial Start Pro",
      description:
        "Robot tipo GPT para CONTPAQi Comercial Start/Pro (pymes): flujo de operaciones, folios, listas de precios y generación de documentos comerciales.",
      image: "/images/InterfazdeChatbotconRobotAmistosoRojo.png",
      technologies: ["Go", "TypeScript", "JavaScript ", "HTML / CSS","SQL","JSON","React","Vite","Tailwind","Zustand", "Dockerfileceq x"],
      liveUrl:
        "https://chatgpt.com/g/g-FfEt5t2MU-contpaqi-comercial-start-pro",
      githubUrl: "https://github.com/FranciscoEmmanuel1998/Catbot-de-IA-local",
    },
  ];

  return (
    <section id="projects" className="py-16 sm:py-20 relative overflow-hidden">
      {/* glows (suaves en mobile) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 left-4 sm:left-20 w-40 h-40 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-4 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: false }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            <span className="text-gradient">Proyectos Destacados</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Una selección de mis trabajos que demuestran habilidades en
            desarrollo web e IA aplicada.
          </p>
        </motion.div>

        {/* Grid responsive: 1 → 2 → 3 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
          {projects.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.06 }}
              viewport={{ once: false }}
              whileHover={{ y: -6 }}
              className="group glass-effect rounded-2xl overflow-hidden hover:glow-effect transition-all duration-300 flex flex-col"
            >
              {/* Media con aspect-ratio para que no salte el layout */}
              <div className="relative overflow-hidden">
                <div className="aspect-[16/10] w-full bg-black/30">
                  <img
                    src={project.image}
                    alt={`Captura de ${project.title}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </div>

                {/* Overlay accesible: aparece en hover y focus dentro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 p-3">
                  <Button asChild size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir demo en vivo de ${project.title}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir repositorio de ${project.title}`}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  {project.title}
                </h3>

                <p className="text-sm sm:text-base text-gray-300 mb-4 leading-relaxed">
                  {project.description}
                </p>

                {/* Chips responsive */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {project.technologies.map((tech) => (
                    <span
                      key={`${project.title}-${tech}`}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 text-xs sm:text-sm rounded-full border border-blue-500/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* CTAs: apilan en mobile, lado a lado en >=sm */}
                <div className="mt-auto flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ver proyecto: ${project.title}`}
                    >
                      Ver Proyecto
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ver código en GitHub: ${project.title}`}
                    >
                      <Github className="w-4 h-4 inline-block mr-2" />
                      Código
                    </a>
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
