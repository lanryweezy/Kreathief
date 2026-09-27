/**
 * WebGL Post-Processing Shader Engine
 * Applies real-time cinematic effects (Chromatic Aberration, VHS, CRT, Noise) to a 2D Canvas texture.
 */

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform float u_time;
  uniform float u_aberrationIntensity; // 0.0 to 1.0
  uniform float u_vhsIntensity;        // 0.0 to 1.0
  
  // Pseudo-random noise function
  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_texCoord;
    
    // --- VHS / CRT Distortion ---
    if (u_vhsIntensity > 0.0) {
      // Wavy tracking distortion
      float trackingY = mod(u_time * 0.5, 1.0);
      if (abs(uv.y - trackingY) < 0.05) {
        uv.x += sin(uv.y * 100.0 + u_time * 10.0) * 0.02 * u_vhsIntensity;
      }
      
      // Edge curvature (CRT barrel distortion)
      vec2 crtUV = uv * 2.0 - 1.0;
      float r = length(crtUV);
      crtUV *= 1.0 + crtUV.x * crtUV.x * crtUV.y * crtUV.y * 0.15 * u_vhsIntensity;
      uv = crtUV * 0.5 + 0.5;
    }
    
    // Prevent out-of-bounds UVs after distortion
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // --- Chromatic Aberration (RGB Split) ---
    float aberrationOffset = u_aberrationIntensity * 0.05; // Max 5% screen width split
    
    vec4 colorRed = texture2D(u_image, vec2(uv.x + aberrationOffset, uv.y));
    vec4 colorGreen = texture2D(u_image, uv);
    vec4 colorBlue = texture2D(u_image, vec2(uv.x - aberrationOffset, uv.y));
    
    vec4 baseColor = vec4(colorRed.r, colorGreen.g, colorBlue.b, colorGreen.a);
    
    // --- Scanlines & Noise ---
    if (u_vhsIntensity > 0.0) {
      float scanline = sin(uv.y * 800.0) * 0.04 * u_vhsIntensity;
      baseColor.rgb -= scanline;
      
      float noise = (rand(uv * u_time) - 0.5) * 0.1 * u_vhsIntensity;
      baseColor.rgb += noise;
    }
    
    gl_FragColor = baseColor;
  }
`;

export class ShaderPostProcessor {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  
  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;
  private texture: WebGLTexture;
  
  // Uniform locations
  private timeLocation: WebGLUniformLocation | null;
  private aberrationLocation: WebGLUniformLocation | null;
  private vhsLocation: WebGLUniformLocation | null;

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    
    const gl = this.canvas.getContext('webgl');
    if (!gl) {throw new Error('WebGL not supported');}
    this.gl = gl;

    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    this.gl.useProgram(this.program);

    // Setup Geometry (Full-screen quad)
    const positions = new Float32Array([
      -1.0, -1.0,  1.0, -1.0,  -1.0,  1.0,
      -1.0,  1.0,  1.0, -1.0,   1.0,  1.0,
    ]);
    this.positionBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // Setup Texture Coordinates (Flipped Y for WebGL vs Canvas2D mismatch)
    const texCoords = new Float32Array([
      0.0, 1.0,  1.0, 1.0,  0.0, 0.0,
      0.0, 0.0,  1.0, 1.0,  1.0, 0.0,
    ]);
    this.texCoordBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

    // Setup Texture
    this.texture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Uniform mapping
    this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
    this.aberrationLocation = this.gl.getUniformLocation(this.program, 'u_aberrationIntensity');
    this.vhsLocation = this.gl.getUniformLocation(this.program, 'u_vhsIntensity');
  }

  public getOutputCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Reads the 2D canvas frame, applies shaders, and renders to the WebGL canvas.
   */
  public renderFrame(
    sourceCanvas: HTMLCanvasElement | HTMLImageElement, 
    time: number, 
    aberrationIntensity: number, 
    vhsIntensity: number
  ) {
    const gl = this.gl;
    
    // Upload the 2D canvas frame as a texture to the GPU
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    // Set Uniforms
    gl.uniform1f(this.timeLocation, time);
    gl.uniform1f(this.aberrationLocation, aberrationIntensity);
    gl.uniform1f(this.vhsLocation, vhsIntensity);

    // Bind Vertices
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Bind Texture Coords
    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw Quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {throw new Error('Shader creation failed');}
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      throw new Error('Shader compilation error');
    }
    return shader;
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    
    const program = this.gl.createProgram();
    if (!program) {throw new Error('Program creation failed');}
    
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(program));
      throw new Error('Program link error');
    }
    return program;
  }
}
