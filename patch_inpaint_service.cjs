const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/services/inpaintService.ts';
let content = fs.readFileSync(file, 'utf8');

const newFunction = `
/**
 * Remove an object from an image using a pre-rendered binary mask canvas.
 */
export async function aiRemoveObjectWithCanvas(
  imageSrc: string,
  maskCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  prompt: string = 'Remove the object highlighted by the mask perfectly. Seamlessly fill in the background using the surrounding textures, colors, and lighting. Make it look like the object was never there.'
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = width;
      imgCanvas.height = height;
      const imgCtx = imgCanvas.getContext('2d')!;
      imgCtx.drawImage(img, 0, 0, width, height);
      const imageDataUrl = imgCanvas.toDataURL('image/png');
      const maskDataUrl = maskCanvas.toDataURL('image/png');

      const resultUrl = await aiInpaintBase64(imageDataUrl, maskDataUrl, prompt);
      resolve(resultUrl);
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}
`;

if (!content.includes('aiRemoveObjectWithCanvas')) {
  content += newFunction;
  fs.writeFileSync(file, content);
  console.log('Added aiRemoveObjectWithCanvas to inpaintService.ts');
} else {
  console.log('Already exists');
}
