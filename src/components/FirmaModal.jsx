import { useState, useEffect } from "react";

const FirmaModal = ({ isOpen, onClose, onSave, usuario }) => {
  const [htmlCode, setHtmlCode] = useState('');
  const [preview, setPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageMapping, setImageMapping] = useState({});
  const [detectedImages, setDetectedImages] = useState([]);

  useEffect(() => {
    if (usuario && usuario.firma_html) {
      setHtmlCode(usuario.firma_html);
    } else {
      setHtmlCode('');
    }
    setPreview('');
    setImageMapping({});
    setDetectedImages([]);
  }, [usuario]);

  // Función para detectar imágenes en el HTML
  const detectImages = (htmlContent) => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images = [];
    let match;
    
    while ((match = imgRegex.exec(htmlContent)) !== null) {
      const src = match[1];
      if (!src.startsWith('data:image/') && !src.startsWith('http')) {
        images.push({
          originalSrc: src,
          element: match[0],
          index: match.index
        });
      }
    }
    
    return images;
  };

  // Función para analizar el HTML y detectar imágenes
  const analyzeHtml = () => {
    const images = detectImages(htmlCode);
    setDetectedImages(images);
    
    if (images.length > 0) {
      alert(`Se detectaron ${images.length} imágenes que necesitan ser reemplazadas:\n\n${images.map((img, index) => `${index + 1}. ${img.originalSrc}`).join('\n')}`);
    } else {
      alert('No se detectaron imágenes que necesiten reemplazo.');
    }
  };

  // Función para manejar la subida de imágenes
  const handleImageUpload = (event, imageIndex) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        const image = detectedImages[imageIndex];
        
        if (image) {
          // Crear el nuevo elemento img con la imagen cargada
          const newImgElement = image.element.replace(
            /src=["'][^"']+["']/,
            `src="${imageData}"`
          );
          
          // Reemplazar en el HTML
          const updatedHtml = htmlCode.replace(image.element, newImgElement);
          setHtmlCode(updatedHtml);
          
          // Actualizar el mapeo
          setImageMapping(prev => ({
            ...prev,
            [image.originalSrc]: imageData
          }));
          
          alert(`✅ Imagen ${imageIndex + 1} reemplazada correctamente`);
        }
      };
      reader.readAsDataURL(file);
    }
  };



  const handlePreview = () => {
    setPreview(htmlCode);
  };

  const handleSave = async () => {
    if (!htmlCode.trim()) {
      alert('❌ No puedes guardar una firma vacía');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(htmlCode);
      alert('✅ Firma guardada correctamente');
      onClose();
    } catch (error) {
      console.error('Error al guardar firma:', error);
      alert(`❌ Error al guardar la firma: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Configurar Firma de Email
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {usuario && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Usuario:</strong> {usuario.nombre} ({usuario.email})
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor HTML */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código HTML de la Firma
            </label>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Pega aquí el código HTML de tu firma..."
            />
            
                         {/* Botones de análisis */}
             <div className="mt-3">
               <button
                 type="button"
                 onClick={analyzeHtml}
                 className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 🔍 Analizar Imágenes
               </button>
             </div>
          </div>

          {/* Gestión de Imágenes */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gestión de Imágenes
            </label>
            
            {detectedImages.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    Se detectaron {detectedImages.length} imágenes
                  </p>
                </div>
                
                {detectedImages.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Imagen {index + 1}
                      </span>
                      {imageMapping[image.originalSrc] && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✅ Reemplazada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {image.originalSrc}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-500">
                  Haz clic en "Analizar Imágenes" para detectar las imágenes que necesitan reemplazo
                </p>
              </div>
            )}
          </div>

          {/* Vista Previa */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vista Previa
            </label>
            <div className="border border-gray-300 rounded-lg p-4 h-80 overflow-y-auto bg-gray-50">
              {preview ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: preview }} 
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <div className="text-gray-500 text-center mt-32">
                  <div className="text-4xl mb-2">👁️</div>
                  <p>Haz clic en "Vista Previa" para ver tu firma</p>
                </div>
              )}
            </div>
            
            <button
              onClick={handlePreview}
              disabled={!htmlCode.trim()}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              👁️ Vista Previa
            </button>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">📋 Instrucciones:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Pega el código HTML de tu firma de Outlook</li>
            <li>2. Haz clic en "Analizar Imágenes" para detectar imágenes</li>
            <li>3. Sube las imágenes correspondientes una por una</li>
            <li>4. Haz clic en "Vista Previa" para verificar</li>
            <li>5. Guarda cuando esté listo</li>
          </ol>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !htmlCode.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar Firma
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirmaModal;
