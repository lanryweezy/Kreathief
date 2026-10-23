const fs = require('fs');

const filePath = 'services/aiDesignDirector.ts';
let content = fs.readFileSync(filePath, 'utf8');

const search = `      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
      },`;

const replace = `      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        // 🤖 Astra: Explicit responseSchema ensures structured JSON from Gemini to eliminate parsing crashes
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            canvas: {
              type: SchemaType.OBJECT,
              properties: {
                width: { type: SchemaType.NUMBER },
                height: { type: SchemaType.NUMBER },
                background: { type: SchemaType.STRING },
                backgroundGradient: {
                  type: SchemaType.OBJECT,
                  properties: {
                    type: { type: SchemaType.STRING },
                    angle: { type: SchemaType.NUMBER },
                    colors: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          color: { type: SchemaType.STRING },
                          position: { type: SchemaType.NUMBER }
                        },
                        required: ["color", "position"]
                      }
                    }
                  },
                  required: ["type", "angle", "colors"]
                }
              },
              required: ["width", "height", "background"]
            },
            layers: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  type: { type: SchemaType.STRING },
                  role: { type: SchemaType.STRING },
                  name: { type: SchemaType.STRING },
                  zIndex: { type: SchemaType.NUMBER },
                  properties: {
                    type: SchemaType.OBJECT,
                    properties: {
                      prompt: { type: SchemaType.STRING },
                      removeBackground: { type: SchemaType.BOOLEAN },
                      text: { type: SchemaType.STRING },
                      fontFamily: { type: SchemaType.STRING },
                      fontSize: { type: SchemaType.NUMBER },
                      fontWeight: { type: SchemaType.STRING },
                      align: { type: SchemaType.STRING },
                      color: { type: SchemaType.STRING },
                      letterSpacing: { type: SchemaType.NUMBER },
                      lineHeight: { type: SchemaType.NUMBER },
                      textTransform: { type: SchemaType.STRING },
                      fill: { type: SchemaType.STRING },
                      // Simplified gradient/cornerRadius/stroke/shadow to avoid excessively deep schema tree
                      // Gemini will still generate it correctly based on the system prompt
                      x: { type: SchemaType.NUMBER },
                      y: { type: SchemaType.NUMBER },
                      width: { type: SchemaType.NUMBER },
                      height: { type: SchemaType.NUMBER },
                      rotation: { type: SchemaType.NUMBER },
                      opacity: { type: SchemaType.NUMBER },
                      blendMode: { type: SchemaType.STRING }
                    },
                    required: ["x", "y", "width", "height"]
                  }
                },
                required: ["id", "type", "role", "name", "zIndex", "properties"]
              }
            },
            metadata: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                archetype: { type: SchemaType.STRING },
                colorPalette: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["title", "description", "archetype", "colorPalette"]
            }
          },
          required: ["canvas", "layers", "metadata"]
        }
      },`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Replaced successfully.");
} else {
    console.log("Could not find the target block.");
}
