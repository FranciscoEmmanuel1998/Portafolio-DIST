import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Edit3, PlusCircle, Save, Trash2, Copy, Search, StickyNote, Calendar, Tag, Pin, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const initialNotes = [
  { 
    id: 'note1', 
    title: 'Ideas para Proyecto DIST', 
    content: 'Desarrollar un sistema de aprendizaje no-lineal que permita a los usuarios explorar conceptos de manera interconectada. Integrar IA simbiótica para recomendaciones personalizadas. Considerar gamificación con badges y progreso.\n\nTareas pendientes:\n- Diseñar interfaz de fragmentos\n- Implementar sistema de prerequisitos\n- Crear algoritmo de recomendaciones', 
    category: 'Trabajo',
    tags: ['proyecto', 'ia', 'aprendizaje'],
    lastModified: new Date().toISOString(),
    isPinned: true
  },
  { 
    id: 'note2', 
    title: 'Receta Favorita - Pasta Carbonara', 
    content: 'Ingredientes:\n- 400g pasta (spaghetti o fettuccine)\n- 200g panceta o tocino\n- 4 huevos\n- 100g queso parmesano rallado\n- Pimienta negra\n- Sal\n\nPreparación:\n1. Cocinar la pasta al dente\n2. Dorar la panceta hasta que esté crujiente\n3. Mezclar huevos con queso y pimienta\n4. Combinar todo fuera del fuego\n5. Servir inmediatamente', 
    category: 'Personal',
    tags: ['cocina', 'receta', 'italiana'],
    lastModified: new Date(Date.now() - 3600000).toISOString(),
    isPinned: false
  },
  { 
    id: 'note3', 
    title: 'Notas de Reunión - Q1 2025', 
    content: 'Puntos clave discutidos:\n\n✓ Incremento en productividad del 23%\n✓ Implementación de nuevas tecnologías\n• Migración a React 18 completada\n• Adopción de TypeScript en progreso\n\nAcciones a seguir:\n- Capacitación del equipo en nuevas herramientas\n- Revisión de procesos actuales\n- Planificación del Q2', 
    category: 'Trabajo',
    tags: ['reunión', 'productividad', 'q1'],
    lastModified: new Date(Date.now() - 86400000).toISOString(),
    isPinned: false
  }
];

const categories = ['Todas', 'Trabajo', 'Personal', 'Estudio', 'Ideas'];

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Personal');
  const [currentTags, setCurrentTags] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isPinned, setIsPinned] = useState(false);

  // Referencias para debounce
  const debounceTimerRef = useRef(null);

  // Función debounce personalizada
  const debounce = useCallback((func, delay) => {
    return (...args) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Función de guardado con debounce
  const saveNotesToStorage = useCallback(
    debounce((notesToSave) => {
      localStorage.setItem('distNotes', JSON.stringify(notesToSave));
      console.log('📝 Notas guardadas automáticamente');
    }, 500),
    [debounce]
  );

  useEffect(() => {
    const storedNotes = localStorage.getItem('distNotes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    } else {
      setNotes(initialNotes);
      localStorage.setItem('distNotes', JSON.stringify(initialNotes));
    }
  }, []);

  // Effect para autosave con debounce
  useEffect(() => {
    if (notes.length > 0) {
      saveNotesToStorage(notes);
    }
  }, [notes, saveNotesToStorage]);

  // Cleanup del timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedNote) {
      setCurrentTitle(selectedNote.title);
      setCurrentContent(selectedNote.content);
      setCurrentCategory(selectedNote.category);
      setCurrentTags(selectedNote.tags.join(', '));
      setIsPinned(selectedNote.isPinned);
    } else {
      setCurrentTitle('');
      setCurrentContent('');
      setCurrentCategory('Personal');
      setCurrentTags('');
      setIsPinned(false);
    }
  }, [selectedNote]);

  // Filtrar notas por búsqueda y categoría
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Notas fijadas primero, luego por fecha de modificación
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastModified) - new Date(a.lastModified);
  });

  const handleNoteSelect = (note) => {
    setSelectedNote(note);
    setCurrentTitle(note.title);
    setCurrentContent(note.content);
    setCurrentCategory(note.category);
    setCurrentTags(note.tags.join(', '));
    setIsPinned(note.isPinned);
  };

  const handleSaveNote = () => {
    if (!currentTitle.trim() || !currentContent.trim()) {
      toast({ title: "Error", description: "El título y el contenido de la nota no pueden estar vacíos.", variant: "destructive" });
      return;
    }
    
    const tags = currentTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    let updatedNotes;
    if (selectedNote) {
      updatedNotes = notes.map(note =>
        note.id === selectedNote.id ? { 
          ...note, 
          title: currentTitle, 
          content: currentContent, 
          category: currentCategory,
          tags: tags,
          isPinned: isPinned,
          lastModified: new Date().toISOString() 
        } : note
      );
    } else {
      const newNote = {
        id: `note${Date.now()}`,
        title: currentTitle,
        content: currentContent,
        category: currentCategory,
        tags: tags,
        isPinned: isPinned,
        lastModified: new Date().toISOString()
      };
      updatedNotes = [...notes, newNote];
      setSelectedNote(newNote);
    }
    setNotes(updatedNotes);
    // El autosave se encargará de guardar en localStorage
    toast({ title: "¡Nota Guardada!", description: `"${currentTitle}" ha sido guardada exitosamente.` });
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setCurrentTitle('Nueva Nota Sin Título');
    setCurrentContent('Escribe aquí el contenido de tu nota...');
    setCurrentCategory('Personal');
    setCurrentTags('');
    setIsPinned(false);
  };

  const handleDeleteNote = () => {
    if (!selectedNote) return;
    const updatedNotes = notes.filter(note => note.id !== selectedNote.id);
    setNotes(updatedNotes);
    // El autosave se encargará de guardar en localStorage
    setSelectedNote(null);
    toast({ title: "Nota Eliminada", description: `"${selectedNote.title}" ha sido eliminada.` });
  };

  const handleCopyNote = () => {
    if (!selectedNote) return;
    const noteText = `${selectedNote.title}\n\n${selectedNote.content}`;
    navigator.clipboard.writeText(noteText);
    toast({ title: "Nota Copiada", description: "El contenido de la nota ha sido copiado al portapapeles." });
  };

  const handleTogglePin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    
    // Si hay una nota seleccionada, actualizar también en la lista de notas
    if (selectedNote) {
      const updatedNotes = notes.map(note =>
        note.id === selectedNote.id ? { 
          ...note, 
          isPinned: newPinnedState,
          lastModified: new Date().toISOString() 
        } : note
      );
      setNotes(updatedNotes);
      // El autosave se encargará de guardar en localStorage
      
      // Actualizar la nota seleccionada
      setSelectedNote({ ...selectedNote, isPinned: newPinnedState });
      
      toast({ 
        title: newPinnedState ? "Nota Anclada" : "Nota Desanclada", 
        description: `"${selectedNote.title}" ha sido ${newPinnedState ? 'anclada' : 'desanclada'}.` 
      });
    }
  };

  // Función para exportar notas
  const handleExportNotes = () => {
    try {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        totalNotes: notes.length,
        notes: notes
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notas_dist_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ 
        title: "Notas Exportadas", 
        description: `${notes.length} notas han sido exportadas exitosamente.` 
      });
    } catch (error) {
      toast({ 
        title: "Error al Exportar", 
        description: "Hubo un problema al exportar las notas.", 
        variant: "destructive" 
      });
    }
  };

  // Función para importar notas
  const handleImportNotes = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validar estructura del archivo
        if (!importedData.notes || !Array.isArray(importedData.notes)) {
          throw new Error("Formato de archivo inválido");
        }

        // Validar que las notas tengan la estructura correcta
        const validNotes = importedData.notes.filter(note => 
          note.id && note.title && note.content && note.category
        );

        if (validNotes.length === 0) {
          throw new Error("No se encontraron notas válidas en el archivo");
        }

        // Combinar con notas existentes, evitando duplicados por ID
        const existingIds = new Set(notes.map(note => note.id));
        const newNotes = validNotes.filter(note => !existingIds.has(note.id));
        const updatedNotes = [...notes, ...newNotes];

        setNotes(updatedNotes);
        // El autosave se encargará de guardar en localStorage
        
        toast({ 
          title: "Notas Importadas", 
          description: `${newNotes.length} nuevas notas han sido importadas. ${validNotes.length - newNotes.length} notas ya existían.` 
        });
        
        // Limpiar el input file
        event.target.value = '';
        
      } catch (error) {
        toast({ 
          title: "Error al Importar", 
          description: "El archivo no tiene un formato válido o está corrupto.", 
          variant: "destructive" 
        });
      }
    };
    
    reader.readAsText(file);
  };


  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      {/* Notes List Sidebar */}
      <motion.div 
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-1/3 md:w-1/4 glass-effect rounded-xl p-4 flex flex-col border border-blue-500/30"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center"><StickyNote className="w-5 h-5 mr-2 text-blue-400"/>Notas</h2>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={handleExportNotes} className="text-green-400 hover:text-green-300" title="Exportar notas">
              <Download className="w-5 h-5" />
            </Button>
            <label htmlFor="import-notes" className="cursor-pointer">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300" title="Importar notas" asChild>
                <span>
                  <Upload className="w-5 h-5" />
                </span>
              </Button>
            </label>
            <input
              id="import-notes"
              type="file"
              accept=".json"
              onChange={handleImportNotes}
              className="hidden"
            />
            <Button variant="ghost" size="icon" onClick={handleNewNote} className="text-blue-400 hover:text-blue-300" title="Nueva nota">
              <PlusCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="mb-4 space-y-3">
          <Input
            type="text"
            placeholder="Buscar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/50 border-blue-500/30 text-white placeholder-gray-400"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-slate-800/50 border-blue-500/30 text-white">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
              <SelectItem value="Trabajo">Trabajo</SelectItem>
              <SelectItem value="Ideas">Ideas</SelectItem>
              <SelectItem value="Tareas">Tareas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-slate-800">
          {filteredNotes.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleNoteSelect(note)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-600/30 ${selectedNote?.id === note.id ? 'bg-blue-600/40 shadow-md' : 'bg-slate-800/30'} ${note.isPinned ? 'border-l-2 border-yellow-400' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white truncate flex items-center">
                  {note.isPinned && <Pin className="w-3 h-3 mr-1 text-yellow-400" />}
                  {note.title}
                </h3>
                <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">{note.category}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{note.content.substring(0, 60)}...</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-slate-700 text-gray-300 px-1 rounded">{tag}</span>
                  ))}
                  {note.tags.length > 2 && <span className="text-xs text-gray-400">+{note.tags.length - 2}</span>}
                </div>
                <p className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(note.lastModified).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Editor Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 glass-effect rounded-xl p-6 flex flex-col border border-blue-500/30"
      >
        { (selectedNote || currentTitle) ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <Input
                type="text"
                placeholder="Título de la Nota"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="text-xl font-semibold bg-transparent border-0 border-b-2 border-blue-500/50 focus:ring-0 focus:border-blue-400 text-white placeholder-gray-500 flex-grow"
              />
              <div className="flex space-x-2 flex-shrink-0">
                <Button variant="outline" size="icon" onClick={handleTogglePin} className={`${isPinned ? 'text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20' : 'text-blue-400 border-blue-500/50 hover:bg-blue-500/20'}`}><Pin className="w-5 h-5"/></Button>
                <Button variant="outline" size="icon" onClick={handleCopyNote} disabled={!selectedNote} className="text-blue-400 border-blue-500/50 hover:bg-blue-500/20"><Copy className="w-5 h-5"/></Button>
                <Button variant="outline" size="icon" onClick={handleDeleteNote} disabled={!selectedNote} className="text-red-400 border-red-500/50 hover:bg-red-500/20"><Trash2 className="w-5 h-5"/></Button>
                <Button onClick={handleSaveNote} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"><Save className="w-5 h-5 mr-2"/>Guardar</Button>
              </div>
            </div>
            
            {/* Category and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                <Select value={currentCategory} onValueChange={setCurrentCategory}>
                  <SelectTrigger className="bg-slate-800/50 border-blue-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Trabajo">Trabajo</SelectItem>
                    <SelectItem value="Ideas">Ideas</SelectItem>
                    <SelectItem value="Tareas">Tareas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Etiquetas (separadas por comas)</label>
                <Input
                  type="text"
                  placeholder="ej: importante, urgente, proyecto"
                  value={currentTags}
                  onChange={(e) => setCurrentTags(e.target.value)}
                  className="bg-slate-800/50 border-blue-500/30 text-white placeholder-gray-400"
                />
              </div>
            </div>
            
            <Textarea
              placeholder="Escribe el contenido de tu nota aquí..."
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              className="flex-1 w-full bg-slate-800/50 border-slate-700/70 rounded-md p-4 text-gray-200 placeholder-gray-500 focus:border-blue-400 focus:ring-blue-400 resize-none scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-slate-800 text-base"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <StickyNote className="w-16 h-16 text-blue-400 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">Editor de Notas</h3>
            <p className="text-gray-400 mb-4">Selecciona una nota de la lista para editar o crea una nueva.</p>
            <Button onClick={handleNewNote} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <PlusCircle className="w-5 h-5 mr-2"/>Nueva Nota
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotesPage;
