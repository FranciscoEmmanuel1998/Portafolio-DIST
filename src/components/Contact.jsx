import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import emailjs from "@emailjs/browser";

const Contact = () => {
  // Imágenes
  const setupImages = useMemo(
    () => [
      { src: "/images/IMG_20221022_190406.jpg", alt: "Setup de escritorio con tres monitores y teclado RGB" },
      { src: "/images/image.jpg",             alt: "Setup de escritorio con varios monitores y ambiente profesional" },
      { src: "/images/Dungeon.jpg",           alt: "Interfaz de videojuego" },
      { src: "/images/Aprendizaje.jpg",       alt: "Interfaz de sistema de aprendizaje no lineal" },
      { src: "/images/Trading.jpg",           alt: "Interfaz de sistema de IA trading" },
      { src: "/images/Notas.jpg",             alt: "Interfaz de sistema de gestión de notas web" },
      { src: "/images/trading2.jpg",          alt: "Interfaz secundaria de IA trading" }
    ],
    []
  );

  // Carrusel accesible
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % setupImages.length);
  const prev = () => setIdx((i) => (i - 1 + setupImages.length) % setupImages.length);

  const sliderRef = useRef(null);
  useEffect(() => {
    let id;
    const start = () => (id = setInterval(next, 5000));
    const stop = () => clearInterval(id);
    start();
    const el = sliderRef.current;
    el?.addEventListener("mouseenter", stop);
    el?.addEventListener("mouseleave", start);
    return () => {
      stop();
      el?.removeEventListener("mouseenter", stop);
      el?.removeEventListener("mouseleave", start);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------------- Altura dinámica animada ----------------
  const fullRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  const [ratios, setRatios] = useState({}); // idx -> (w/h)

  // Medir ancho del contenedor
  useEffect(() => {
    const update = () => setContainerW(fullRef.current?.clientWidth || 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Guardar proporción real al cargar cada imagen
  const onImgLoad = (i, e) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
    if (nw && nh) setRatios((r) => ({ ...r, [i]: nw / nh }));
  };

  const currentRatio = ratios[idx] || 16 / 9; // fallback
  // Limita la altura animada (ajusta min/max a gusto)
  const targetH = Math.max(360, Math.min(920, containerW / currentRatio));
  // ---------------------------------------------------------

  // Form
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState(0);

  const safe = (s) => (s || "").replace(/[\r\n]/g, "").trim();
  const validate = () => {
    const errs = {};
    const name = safe(formData.name).slice(0, 50).replace(/[^\p{L}\p{N} .,'-]/gu, "");
    const email = safe(formData.email).slice(0, 128).replace(/[^\w@.\-]/g, "");
    if (!name || name.length < 2) errs.name = "Nombre muy corto";
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) errs.email = "Email inválido";
    if (!safe(formData.message) || formData.message.trim().length < 10) errs.message = "Mensaje muy corto";
    if ((formData.message || "").length > 2000) errs.message = "Mensaje demasiado largo";
    return errs;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const canSubmit =
    safe(formData.name).length >= 2 &&
    /^[^@]+@[^@]+\.[^@]+$/.test(safe(formData.email)) &&
    safe(formData.message).length >= 10 &&
    (formData.message || "").length <= 2000 &&
    !loading &&
    Date.now() - lastSent >= 15000;

  // Envío EmailJS
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Date.now() - lastSent < 15000) {
      toast({ title: "Espera unos segundos antes de enviar otro mensaje." });
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.warn("ENV faltantes:", { serviceId, templateId, publicKey });
        toast({ title: "Config incompleta", description: "Revisa tus variables de entorno." });
        setLoading(false);
        return;
      }

      const params = {
        from_name: formData.name,
        from_email: formData.email,
        reply_to:  formData.email,
        message:   formData.message,
        email:     formData.email,
        to_email:  formData.email,
        to_name:   formData.name
      };

      const result = await emailjs.send(serviceId, templateId, params, publicKey);
      console.log("EmailJS:", result.status, result.text);

      toast({ title: "¡Mensaje enviado!", description: "Te respondí por correo." });
      setFormData({ name: "", email: "", message: "" });
      setLastSent(Date.now());
    } catch (err) {
      console.error("EmailJS error:", err);
      toast({ title: "Error", description: "No se pudo enviar." });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: Mail,   title: "Email",     value: "ceo@boutiquest.shop", href: "mailto:ceo@boutiquest.shop" },
    { icon: Phone,  title: "Teléfono",  value: "+52 81 3412 1519",    href: "tel:+528134121519" },
    { icon: MapPin, title: "Ubicación", value: "Monterrey, México",   href: "#" }
  ];

  return (
    <section id="contact" className="relative overflow-hidden py-16 sm:py-20">
      {/* glows suaves en mobile */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-3 top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl sm:right-10 sm:h-64 sm:w-64" />
        <div className="absolute left-3 bottom-10 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl sm:left-10 sm:h-72 sm:w-72" />
      </div>

      {/* Aumentado a 2xl para más nitidez */}
      <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10 text-center sm:mb-14">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl md:text-5xl"><span className="text-gradient">Contáctame</span></h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-300 sm:text-base md:text-lg">Transformemos tu idea en código: cuéntame qué necesitas y empecemos hoy.</p>
        </motion.div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* IZQUIERDA: info */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-6 lg:space-y-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-6">
              <h3 className="mb-4 text-xl font-bold sm:text-2xl">Información de Contacto</h3>
              <ul className="space-y-4">
                {contactInfo.map(({ icon: Icon, title, value, href }) => (
                  <li key={title} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/60">{title}</p>
                      {href.startsWith("mailto") || href.startsWith("tel") ? (
                        <a className="text-sm sm:text-base hover:underline" href={href}>{value}</a>
                      ) : (
                        <p className="text-sm sm:text-base">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* DERECHA: formulario */}
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-6">
              <h3 className="mb-4 text-xl font-bold sm:text-2xl">Envíame un Mensaje</h3>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" aria-busy={loading}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1 block text-xs font-medium text-white/80">Nombre</label>
                    <input
                      id="name" name="name" value={formData.name} onChange={handleChange} required
                      className="h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-white placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="Tu nombre"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-400" aria-live="polite">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1 block text-xs font-medium text-white/80">Email</label>
                    <input
                      id="email" name="email" type="email" value={formData.email} onChange={handleChange} required
                      className="h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-white placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="tu@email.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-400" aria-live="polite">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1 block text-xs font-medium text-white/80">Mensaje</label>
                  <textarea
                    id="message" name="message" value={formData.message} onChange={handleChange} required rows={5}
                    className="min-h-[140px] w-full resize-none rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Cuéntame sobre tu proyecto..."
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-400" aria-live="polite">{errors.message}</p>}
                </div>

                <Button type="submit" disabled={!canSubmit} className="h-12 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-base font-semibold hover:from-blue-600 hover:to-purple-700 sm:h-12 sm:text-lg">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="mr-2 h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" d="M4 12a8 8 0 018-8v8z" fill="currentColor" />
                      </svg>
                      Enviando…
                    </span>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Carrusel full-width con ALTURA DINÁMICA (95% de ancho) */}
        <div className="mt-8 lg:mt-10">
          <div className="group relative mx-auto w-[95%] rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 backdrop-blur-sm">
            <div ref={sliderRef} className="relative overflow-hidden rounded-xl">
              <motion.div
                ref={fullRef}
                className="relative w-full overflow-hidden rounded-xl"
                animate={{ height: targetH }}
                initial={false}
                transition={{ duration: 0.45 }}
              >
                {setupImages.map((img, i) => (
                  <img
                    key={img.src}
                    src={img.src}
                    alt={img.alt}
                    onLoad={(e) => onImgLoad(i, e)}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchpriority={i === idx ? "high" : "low"}
                    className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
                      i === idx ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="95vw"
                  />
                ))}
              </motion.div>

              {/* Controles */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prev}
                  aria-label="Imagen anterior"
                  className="pointer-events-auto border-white/30 bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={next}
                  aria-label="Siguiente imagen"
                  className="pointer-events-auto border-white/30 bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {setupImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Ir a la imagen ${i + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Fin carrusel */}
      </div>
    </section>
  );
};

export default Contact;
