import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Heart } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  return (
    <footer className="py-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="glass-effect rounded-2xl p-8 max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-3xl font-bold text-gradient mb-6"
            >
              Francisco Developer
            </motion.div>
            
            <p className="text-gray-300 mb-8">
              Desarrollador Full Stack apasionado por crear experiencias digitales excepcionales
            </p>

            <div className="flex justify-center space-x-6 mb-8">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 glass-effect rounded-full hover:glow-effect transition-all duration-300"
                  aria-label={link.label}
                >
                  <link.icon className="w-6 h-6 text-white" />
                </motion.a>
              ))}
            </div>

            <div className="border-t border-white/20 pt-6">
              <p className="text-gray-400 flex items-center justify-center">
                <span>Hecho con</span>
                <Heart className="w-4 h-4 mx-2 text-red-500" />
                <span>por Francisco Emmanuel Developer © 2025</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;