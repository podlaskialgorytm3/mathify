import { PDFDocument, rgb } from "pdf-lib";
import { Jimp } from "jimp";

/**
 * Konwertuje zdjęcia do PDF
 * @param imageBuffers - Bufory zdjęć do konwersji
 * @returns Buffer zawierający PDF ze zdjęciami
 */
export async function convertImagesToPDF(
  imageBuffers: Buffer[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const imageBuffer of imageBuffers) {
    try {
      // Użyj Jimp do odczytu i przetworzenia obrazu
      const image = await Jimp.read(imageBuffer);

      // Zmień rozmiar obrazu jeśli jest zbyt duży (max 1500px w szerokości)
      if (image.bitmap.width > 1500) {
        await image.resize({ w: 1500 });
      }

      // Konwertuj do JPEG (lepsze dla PDF) z jakością 85%
      const processedBuffer = await image.getBuffer("image/jpeg", {
        quality: 85,
      });

      // Osadź obraz w PDF
      const pdfImage = await pdfDoc.embedJpg(processedBuffer);

      // Oblicz wymiary strony (A4 ratio ale dostosowany do obrazu)
      const imgWidth = pdfImage.width;
      const imgHeight = pdfImage.height;
      const ratio = imgWidth / imgHeight;

      // A4 w punktach: 595 x 842
      let pageWidth = 595;
      let pageHeight = 842;

      // Dostosuj rozmiar strony do proporcji obrazu
      if (ratio > pageWidth / pageHeight) {
        // Obraz szerszy - dopasuj do szerokości
        pageHeight = pageWidth / ratio;
      } else {
        // Obraz wyższy - dopasuj do wysokości
        pageWidth = pageHeight * ratio;
      }

      // Dodaj stronę z obliczonymi wymiarami
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Rysuj obraz na całej stronie
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error("Nie udało się przetworzyć jednego ze zdjęć");
    }
  }

  // Zwróć PDF jako buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Łączy dwa pliki PDF w jeden
 * @param pdf1Buffer - Buffer pierwszego PDF
 * @param pdf2Buffer - Buffer drugiego PDF
 * @returns Buffer zawierający połączone PDF
 */
export async function mergePDFs(
  pdf1Buffer: Buffer,
  pdf2Buffer: Buffer
): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();

  // Załaduj pierwszy PDF
  const pdf1 = await PDFDocument.load(pdf1Buffer);
  const pdf1Pages = await mergedPdf.copyPages(pdf1, pdf1.getPageIndices());
  pdf1Pages.forEach((page) => mergedPdf.addPage(page));

  // Załaduj drugi PDF
  const pdf2 = await PDFDocument.load(pdf2Buffer);
  const pdf2Pages = await mergedPdf.copyPages(pdf2, pdf2.getPageIndices());
  pdf2Pages.forEach((page) => mergedPdf.addPage(page));

  // Zwróć połączone PDF jako buffer
  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
}

/**
 * Tworzy PDF z nagłówkiem i łączy go z istniejącym PDF
 * @param homeworkPdfBuffer - Buffer PDF pracy domowej
 * @param headerText - Tekst nagłówka
 * @param imagesPdfBuffer - Opcjonalny buffer PDF ze zdjęć
 * @returns Buffer zawierający końcowy PDF
 */
export async function createHomeworkPDF(
  homeworkPdfBuffer: Buffer,
  headerText: string,
  imagesPdfBuffer?: Buffer
): Promise<Buffer> {
  // Jeśli nie ma zdjęć, zwróć oryginalny PDF
  if (!imagesPdfBuffer) {
    return homeworkPdfBuffer;
  }

  // Łącz PDF ze zdjęć z pracą domową
  const mergedPdf = await mergePDFs(imagesPdfBuffer, homeworkPdfBuffer);

  return mergedPdf;
}
