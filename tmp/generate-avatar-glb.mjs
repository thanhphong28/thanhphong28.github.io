import fs from "node:fs";
import path from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import sharp from "sharp";

const projectRoot = process.cwd();
const inputPath = path.join(projectRoot, "images", "avatar-my-3d.png");
const outputPath = path.join(projectRoot, "models", "my-avatar.glb");

if (!fs.existsSync(inputPath)) {
  throw new Error(`Input image not found: ${inputPath}`);
}

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const width = info.width;
const height = info.height;

const segmentsX = 120;
const segmentsY = 150;
const vertexCount = (segmentsX + 1) * (segmentsY + 1);

const positions = new Float32Array(vertexCount * 3);
const normals = new Float32Array(vertexCount * 3);
const uvs = new Float32Array(vertexCount * 2);
const indices = new Uint32Array(segmentsX * segmentsY * 6);

const sample = (u, v) => {
  const x = Math.min(width - 1, Math.max(0, Math.round(u * (width - 1))));
  const y = Math.min(height - 1, Math.max(0, Math.round(v * (height - 1))));
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3]
  };
};

const depthAt = (u, v) => {
  const pixel = sample(u, v);
  const nearBlack = pixel.r < 20 && pixel.g < 20 && pixel.b < 20;
  const alpha = nearBlack ? 0 : pixel.a / 255;
  if (alpha < 0.08) return -0.3;

  const lum = (pixel.r * 0.299 + pixel.g * 0.587 + pixel.b * 0.114) / 255;
  const headBias = 1 - v;
  const centerBias = 1 - Math.min(1, Math.hypot(u - 0.5, v - 0.55) / 0.74);
  const depth = lum * 0.52 + headBias * 0.28 + centerBias * 0.2;
  return depth * 0.68 - 0.2;
};

let vertexIndex = 0;
for (let y = 0; y <= segmentsY; y += 1) {
  const v = y / segmentsY;
  for (let x = 0; x <= segmentsX; x += 1) {
    const u = x / segmentsX;
    const positionOffset = vertexIndex * 3;
    const uvOffset = vertexIndex * 2;

    const px = (u - 0.5) * 2.4;
    const py = (0.5 - v) * 3.2;
    const pz = depthAt(u, v);

    positions[positionOffset] = px;
    positions[positionOffset + 1] = py;
    positions[positionOffset + 2] = pz;
    uvs[uvOffset] = u;
    uvs[uvOffset + 1] = v;
    vertexIndex += 1;
  }
}

let indexOffset = 0;
for (let y = 0; y < segmentsY; y += 1) {
  for (let x = 0; x < segmentsX; x += 1) {
    const a = y * (segmentsX + 1) + x;
    const b = a + 1;
    const c = a + (segmentsX + 1);
    const d = c + 1;

    indices[indexOffset++] = a;
    indices[indexOffset++] = c;
    indices[indexOffset++] = b;
    indices[indexOffset++] = b;
    indices[indexOffset++] = c;
    indices[indexOffset++] = d;
  }
}

for (let y = 0; y <= segmentsY; y += 1) {
  for (let x = 0; x <= segmentsX; x += 1) {
    const i = y * (segmentsX + 1) + x;
    const left = y * (segmentsX + 1) + Math.max(0, x - 1);
    const right = y * (segmentsX + 1) + Math.min(segmentsX, x + 1);
    const up = Math.max(0, y - 1) * (segmentsX + 1) + x;
    const down = Math.min(segmentsY, y + 1) * (segmentsX + 1) + x;

    const dx =
      positions[right * 3 + 2] - positions[left * 3 + 2];
    const dy =
      positions[down * 3 + 2] - positions[up * 3 + 2];

    const nx = -dx * 1.8;
    const ny = -dy * 1.8;
    const nz = 1;
    const length = Math.hypot(nx, ny, nz) || 1;

    normals[i * 3] = nx / length;
    normals[i * 3 + 1] = ny / length;
    normals[i * 3 + 2] = nz / length;
  }
}

const document = new Document();
const root = document.getRoot();
const buffer = document.createBuffer("default");

const texture = document
  .createTexture("avatarTexture")
  .setImage(new Uint8Array(await sharp(inputPath).png().toBuffer()))
  .setMimeType("image/png");

const material = document
  .createMaterial("avatarMaterial")
  .setBaseColorTexture(texture)
  .setAlphaMode("BLEND")
  .setDoubleSided(true)
  .setMetallicFactor(0.05)
  .setRoughnessFactor(0.58);

const positionAccessor = document.createAccessor("positions").setType("VEC3").setArray(positions).setBuffer(buffer);
const normalAccessor = document.createAccessor("normals").setType("VEC3").setArray(normals).setBuffer(buffer);
const uvAccessor = document.createAccessor("uvs").setType("VEC2").setArray(uvs).setBuffer(buffer);
const indexAccessor = document.createAccessor("indices").setType("SCALAR").setArray(indices).setBuffer(buffer);

const mesh = document
  .createMesh("avatarHead")
  .addPrimitive(
    document
      .createPrimitive()
      .setAttribute("POSITION", positionAccessor)
      .setAttribute("NORMAL", normalAccessor)
      .setAttribute("TEXCOORD_0", uvAccessor)
      .setIndices(indexAccessor)
      .setMaterial(material)
  );

const modelNode = document.createNode("avatarNode").setMesh(mesh);
modelNode.setTranslation([0, -0.2, 0]);

const scene = document.createScene("Scene").addChild(modelNode);
root.setDefaultScene(scene);

const io = new NodeIO();
io.write(outputPath, document);

console.log(`Generated GLB: ${outputPath}`);
