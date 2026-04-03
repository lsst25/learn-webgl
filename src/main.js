"use strict";

const webglUtils = {
  resizeCanvasToDisplaySize: (canvas) => {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    return needResize;
  },
};

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL not supported in this browser.");
  throw new Error("WebGL not supported");
}

// Vertex shader - positions geometry
const vertexShaderSource = `
  attribute vec2 a_position;
  
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_rotation;

  void main() {
    vec2 rotatedPosition = vec2(
     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
     a_position.y * u_rotation.y - a_position.x * u_rotation.x);

    vec2 position = rotatedPosition + u_translation;

    vec2 zeroToOne = position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

// Fragment shader - colors pixels
const fragmentShaderSource = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// Create shaders and program
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// Look up attribute location
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");
const translationLocation = gl.getUniformLocation(program, "u_translation");
const rotationLocation = gl.getUniformLocation(program, "u_rotation");

const SIZE = 2;
const positions = [
  // left column
  0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

  // top rung
  30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

  // middle rung
  30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
];

// Create a buffer and put a triangle in it
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const translation = [150, 235];
const color = [Math.random(), Math.random(), Math.random(), 1];

const rotation = [0.5, 1];

setGeometry(gl);

drawScene();

webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
webglLessonsUI.setupSlider("#angle", {
  value: 0,
  slide: updateAngle,
  max: 360,
});

function updatePosition(index) {
  return function (event, ui) {
    translation[index] = ui.value;
    drawScene();
  };
}

function updateAngle(_, ui) {
  const angleInRadians = (ui.value * Math.PI) / 180;

  rotation[0] = Math.sin(angleInRadians);
  rotation[1] = Math.cos(angleInRadians);

  drawScene();
}

function drawScene() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  gl.vertexAttribPointer(positionAttributeLocation, SIZE, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform4f(colorUniformLocation, ...color);
  gl.uniform2fv(translationLocation, translation);
  gl.uniform2fv(rotationLocation, rotation);

  const count = positions.length / SIZE;

  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}

function setGeometry(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}
