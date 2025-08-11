
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import emailjs from '@emailjs/browser';

const Contact = () => {
  const setupImages = [
    {
      src: '/images/IMG_20221022_190406.jpg',
      alt: 'Setup de escritorio con tres monitores y teclado RGB',
      className: 'h-96 object-cover', // más alta
    },
    {
      src: '/images/image.jpg',
      alt: 'Setup de escritorio con varios monitores y ambiente profesional',
      className: 'h-64 object-contain', // más baja y sin recorte
    },
  ];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % setupImages.length);
    }, 3000); // Cambia cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState(0);

  // Validación robusta y limpieza
  const safe = (s) => s.replace(/[\r\n]/g, '').trim();
  const validate = () => {
    const errs = {};
    const name = safe(formData.name).slice(0,50).replace(/[^\p{L}\p{N} .,'-]/gu,'');
    const email = safe(formData.email).slice(0,128).replace(/[^\w@.\-]/g, '');
    if (!name || name.length < 2) errs.name = 'Nombre muy corto';
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) errs.email = 'Email inválido';
    if (!formData.message.trim() || formData.message.length < 10) errs.message = 'Mensaje muy corto';
    if (formData.message.length > 2000) errs.message = 'Mensaje demasiado largo';
    return errs;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Date.now() - lastSent < 15000) {
      toast({ title: 'Espera unos segundos antes de enviar otro mensaje.', role: 'alert' });
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          reply_to: formData.email,
          message: formData.message,
          email: [formData.email]
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      ).then((result) => {
        toast({ title: '¡Mensaje enviado!', description: 'Te responderé pronto.', role: 'alert' });
        setFormData({ name: '', email: '', message: '' });
        setLastSent(Date.now());
        setTimeout(() => {
          const toastEl = document.querySelector('[role="alert"]');
          toastEl?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        console.log('EmailJS status:', result.status, '→', result.text);
      }).catch((err) => {
        console.error('EmailJS status:', err.status, '→', err.text);
        toast({ title: 'Error', description: err.text || 'No se pudo enviar.', role: 'alert' });
      });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'ceo@boutiquest.shop',
      href: 'mailto:ceo@boutiquest.shop'
    },
    {
      icon: Phone,
      title: 'Teléfono',
      value: '+52 81 3412 1519',
      href: 'tel:+528134121519'
    },
    {
      icon: MapPin,
      title: 'Ubicación',
      value: 'Monterrey, México',
      href: '#'
    }
  ];

  return (
    <section id="contact" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl floating"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl floating" style={{ animationDelay: '1s' }}></div>
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
            <span className="text-gradient">Contáctame</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transformemos tu idea en código: cuéntame qué necesitas y empecemos hoy.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false }}
            className="space-y-8"
          >
            <div className="glass-effect rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                Información de Contacto
              </h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.a
                    key={info.title}
                    href={info.href}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: false }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-4 p-4 glass-effect rounded-xl hover:glow-effect transition-all duration-300"
                  >
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <info.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{info.title}</p>
                      <p className="text-white font-medium">{info.value}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-8"
            >
              <div className="w-full h-64 flex items-center justify-center">
                <img
                  className={`w-full h-64 object-cover rounded-xl transition-all duration-700 ${setupImages[currentImage].className}`}
                  alt={setupImages[currentImage].alt}
                  src={setupImages[currentImage].src}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="glass-effect rounded-2xl p-8 hover:glow-effect transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-6">
                Envíame un Mensaje
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-white font-medium mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Tu nombre"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-white font-medium mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Cuéntame sobre tu proyecto..."
                  />
                  {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 glow-effect pulse-glow"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center"><svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Cargando...</span>
                  ) : (
                    <><Send className="w-5 h-5 mr-2" />Enviar Mensaje</>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;