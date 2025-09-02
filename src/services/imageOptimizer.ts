// // import sharp from "sharp";

export const optimizeImage = async (file: Express.Multer.File) => {
  try {
    // TEMPORALMENTE COMENTADO - Optimización de imagen con Sharp
    // const image = sharp(file.buffer);
    
    // Por ahora, retornar el archivo sin procesar
    console.log("Optimización de imagen temporalmente deshabilitada");
    
    return {
      ...file,
      optimized: false,
      message: "Optimización temporalmente deshabilitada"
    };
  } catch (error) {
    console.error("Error optimizing image:", error);
    return file;
  }
};

export const resizeImage = async (file: Express.Multer.File, width: number, height: number) => {
  try {
    // TEMPORALMENTE COMENTADO - Redimensionar imagen con Sharp
    // const resizedImage = await sharp(file.buffer)
    //   .resize(width, height)
    //   .toBuffer();
    
    // Por ahora, retornar el archivo original
    console.log("Redimensionado de imagen temporalmente deshabilitado");
    
    return {
      ...file,
      resized: false,
      message: "Redimensionado temporalmente deshabilitado"
    };
  } catch (error) {
    console.error("Error resizing image:", error);
    return file;
  }
};

export const compressImage = async (file: Express.Multer.File, quality: number = 80) => {
  try {
    // TEMPORALMENTE COMENTADO - Comprimir imagen con Sharp
    // const compressedImage = await sharp(file.buffer)
    //   .jpeg({ quality })
    //   .toBuffer();
    
    // Por ahora, retornar el archivo original
    console.log("Compresión de imagen temporalmente deshabilitada");
    
    return {
      ...file,
      compressed: false,
      message: "Compresión temporalmente deshabilitada"
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    return file;
  }
};

export const convertImageFormat = async (file: Express.Multer.File, format: string) => {
  try {
    // TEMPORALMENTE COMENTADO - Convertir formato de imagen con Sharp
    // const convertedImage = await sharp(file.buffer)
    //   .toFormat(format as any)
    //   .toBuffer();
    
    // Por ahora, retornar el archivo original
    console.log("Conversión de formato temporalmente deshabilitada");
    
    return {
      ...file,
      converted: false,
      message: "Conversión de formato temporalmente deshabilitada"
    };
  } catch (error) {
    console.error("Error converting image format:", error);
    return file;
  }
};
