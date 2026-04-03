"use strict";

const m3 = {
  multiply: function (a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },

  identity: function () {
    // prettier-ignore
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ];
  },

  projection: function (width, height) {
    // prettier-ignore
    return [
      2 / width, 0, 0,
      0, -2 / height, 0,
      -1, 1, 1
    ];
  },

  translation: function (tx, ty) {
    // prettier-ignore
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1,
    ];
  },

  rotation: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      c,-s, 0,
      s, c, 0,
      0, 0, 1,
    ];
  },

  scaling: function (sx, sy) {
    // prettier-ignore
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];
  },

  translate: function (m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function (m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function (m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
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

  uniform mat3 u_matrix;

  void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
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

const program = webglUtils.createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);

// Look up attribute location
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");

const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");

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

const translation = [100, 100];
const color = [Math.random(), Math.random(), Math.random(), 1];

let angleInRadians = 0;
const scale = [0.9, 0.9];

setGeometry(gl);

drawScene();

webglLessonsUI.setupSlider("#x", { value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
webglLessonsUI.setupSlider("#y", { value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
webglLessonsUI.setupSlider("#angle", { value: 0, slide: updateAngle, max: 360 });
webglLessonsUI.setupSlider("#scaleX", {
  value: scale[0],
  slide: updateScale(0),
  min: -5,
  max: 5,
  step: 0.01,
  precision: 2,
});
webglLessonsUI.setupSlider("#scaleY", {
  value: scale[1],
  slide: updateScale(1),
  min: -5,
  max: 5,
  step: 0.01,
  precision: 2,
});

function updatePosition(index) {
  return function (event, ui) {
    translation[index] = ui.value;
    drawScene();
  };
}

function updateScale(index) {
  return function (_, ui) {
    scale[index] = ui.value;
    drawScene();
  };
}

function updateAngle(event, ui) {
  const angleInDegrees = 360 - ui.value;
  angleInRadians = (angleInDegrees * Math.PI) / 180;
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

  gl.uniform4fv(colorUniformLocation, color);

  const { clientWidth, clientHeight } = gl.canvas;

  let matrix = m3.projection(clientWidth, clientHeight);
  matrix = m3.translate(matrix, ...translation);
  matrix = m3.rotate(matrix, angleInRadians);
  matrix = m3.scale(matrix, ...scale);
  matrix = m3.translate(matrix, -50, -75);

  gl.uniformMatrix3fv(matrixUniformLocation, false, matrix);

  const count = positions.length / SIZE;

  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}

function setGeometry(gl) {
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
}
