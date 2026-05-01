
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Genera un PDF a partir de un elemento HTML.
 * Corte inteligente: no parte bloques marcados con [data-pdf-avoid].
 * Filtro final: descarta páginas casi vacías (< 80px) para evitar hoja en blanco al final.
 */
export const generatePDF = async (
    element: HTMLElement,
    fileName: string
): Promise<boolean> => {
    try {
        // 1. Renderizar a canvas — NO forzamos height para que sea exactamente lo que hay
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: element.scrollWidth,
            // height y windowHeight los omitimos: html2canvas los calcula del elemento
        });

        const totalW = canvas.width;
        const totalH = canvas.height;
        const SCALE  = 2;

        // 2. PDF A4
        const pdf    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW  = pdf.internal.pageSize.getWidth();   // 210 mm
        const pageH  = pdf.internal.pageSize.getHeight();  // 297 mm
        const ratio  = pageW / totalW;
        const pageHpx = pageH / ratio;

        // 3. Posiciones de bloques que no deben partirse
        const templateRect = element.getBoundingClientRect();
        const avoidBlocks: { top: number; bottom: number }[] = [];

        element.querySelectorAll<HTMLElement>("[data-pdf-avoid]").forEach((el) => {
            const r  = el.getBoundingClientRect();
            const top    = (r.top    - templateRect.top) * SCALE;
            const bottom = (r.bottom - templateRect.top) * SCALE;
            if (bottom > top) avoidBlocks.push({ top: Math.round(top), bottom: Math.round(bottom) });
        });

        // 4. Construir puntos de corte inteligentes
        const cutPoints: number[] = [0];
        let cursor = 0;

        while (cursor < totalH) {
            let nextCut = cursor + pageHpx;
            if (nextCut >= totalH) break;

            // Si el corte cae dentro de un bloque protegido, subir al inicio del bloque
            for (const block of avoidBlocks) {
                if (block.top < nextCut && block.bottom > nextCut) {
                    nextCut = block.top;
                    break;
                }
            }

            // Evitar bucle infinito si un bloque ocupa más de una página
            if (nextCut <= cursor) nextCut = cursor + pageHpx;

            cutPoints.push(Math.round(nextCut));
            cursor = nextCut;
        }
        cutPoints.push(totalH);

        // 5. Construir slices y filtrar los casi vacíos (< 80px = evita hoja en blanco)
        const MIN_SLICE_PX = 80;
        const slices = cutPoints
            .slice(0, -1)
            .map((srcY, i) => ({ srcY, srcH: cutPoints[i + 1] - srcY }))
            .filter(s => s.srcH >= MIN_SLICE_PX);

        // 6. Generar páginas PDF
        for (let i = 0; i < slices.length; i++) {
            if (i > 0) pdf.addPage();

            const { srcY, srcH } = slices[i];
            const heightMM = srcH * ratio;

            const slice = document.createElement("canvas");
            slice.width  = totalW;
            slice.height = Math.ceil(srcH);

            const ctx = slice.getContext("2d")!;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, slice.width, slice.height);
            ctx.drawImage(canvas, 0, srcY, totalW, srcH, 0, 0, totalW, srcH);

            const imgData = slice.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", 0, 0, pageW, heightMM);
        }

        pdf.save(`${fileName}.pdf`);
        return true;

    } catch (err) {
        console.error("Error al generar PDF:", err);
        return false;
    }
};