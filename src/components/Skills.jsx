import React from 'react';
import { motion } from 'framer-motion';

const Skills = () => {
  const skillCategories = [
    {
      title: 'Frontend',
      skills: [
        { name: 'React 18', level: 95 },
        { name: 'Next.js (SSR/SSG)', level: 90 },
        { name: 'TypeScript', level: 90 },
        { name: 'Tailwind CSS', level: 92 },
        { name: 'Vite', level: 88 },
        { name: 'Framer Motion', level: 85 },
      ],
    },
    {
      title: 'Backend & APIs',
      skills: [
        { name: 'Node.js', level: 90 },
        { name: 'Express', level: 88 },
        { name: 'Python 3.11', level: 86 },
        { name: 'REST APIs', level: 90 },
        { name: 'WebSockets', level: 85 },
      ],
    },
    {
      title: 'IA & Automatización',
      skills: [
        { name: 'ChatGPT (integración)', level: 92 },
        { name: 'LangChain', level: 88 },
        { name: 'LLMs locales (Ollama)', level: 85 },
        { name: 'RAG / FAISS (vector DB)', level: 82 },
        { name: 'Asistentes internos', level: 84 },
      ],
    },
    {
      title: 'Herramientas & DevOps',
      skills: [
        { name: 'Git / GitHub', level: 95 },
        { name: 'Docker', level: 88 },
        { name: 'Cloudflare Tunnel', level: 86 },
        { name: 'Hostinger (deploy)', level: 85 },
        { name: 'AWS (básico)', level: 70 },
      ],
    },
  ];

  return (
    <section id="skills" className="py-20 relative overflow-hidden">
      {/* glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Habilidades</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Tecnologías y herramientas que utilizo para crear plataformas modernas,
            escalables y con automatización inteligente.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {skillCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              viewport={{ once: false }}
              className="glass-effect rounded-2xl p-6 hover:glow-effect transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-white mb-5 text-center">
                {category.title}
              </h3>

              <div className="space-y-5">
                {category.skills.map((skill, skillIndex) => (
                  <motion.div
                    key={`${category.title}-${skill.name}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: skillIndex * 0.08 }}
                    viewport={{ once: false }}
                    aria-label={`${skill.name} ${skill.level}%`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90">{skill.name}</span>
                      <span className="text-blue-400 font-semibold">{skill.level}%</span>
                    </div>

                    <div className="w-full bg-gray-700/80 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 0.9, delay: skillIndex * 0.08 }}
                        viewport={{ once: false }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
