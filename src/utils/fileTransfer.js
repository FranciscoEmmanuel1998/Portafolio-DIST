// 📦 File Transfer Utilities for NonLinear Learning
// Utilities para manejo de archivos JSON - descargar y leer

export const downloadJson = (data, filename = 'progreso-aprendizaje.json') => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[downloadJson] Error creando blob', error);
  }
};

export const readJsonFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
