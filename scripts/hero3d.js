import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const sceneRoot = document.querySelector(".character-scene");
const canvas = document.querySelector(".character-canvas");

if (sceneRoot && canvas) {
  const avatarSource = sceneRoot.dataset.avatarSrc || "images/avatar-3d-cutout.png";
  const characterGlb = sceneRoot.dataset.characterGlb?.trim() || "";
  const characterAnimation = Number.parseInt(sceneRoot.dataset.characterAnimation || "0", 10);
  const characterScale = Number.parseFloat(sceneRoot.dataset.characterScale || "2.55");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.35, 10.8);

  const root = new THREE.Group();
  const avatar = new THREE.Group();
  const rings = new THREE.Group();
  const particles = new THREE.Group();
  scene.add(root);
  root.add(rings, particles, avatar);

  const ambient = new THREE.AmbientLight(0xffffff, 1.3);
  const keyLight = new THREE.PointLight(0x7dffb0, 38, 20);
  const fillLight = new THREE.PointLight(0x95ffc3, 18, 14);
  const rimLight = new THREE.PointLight(0x76d8ff, 12, 10);
  keyLight.position.set(0, 2.8, 4.5);
  fillLight.position.set(-3, 1.2, 3);
  rimLight.position.set(3, 1.6, 4);
  scene.add(ambient, keyLight, fillLight, rimLight);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let mixer = null;
  let rigModel = null;
  let proceduralRig = null;
  let fallbackObjects = [];
  let fallbackState = null;

  function buildAvatarMaps(image) {
    const width = image.width;
    const height = image.height;
    const maskCanvas = document.createElement("canvas");
    const depthCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    depthCanvas.width = width;
    depthCanvas.height = height;
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    const depthContext = depthCanvas.getContext("2d", { willReadFrequently: true });

    maskContext.drawImage(image, 0, 0, width, height);
    const imageData = maskContext.getImageData(0, 0, width, height);
    const data = imageData.data;
    const depthData = depthContext.createImageData(width, height);

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      const pixel = index / 4;
      const y = Math.floor(pixel / width);
      const headBias = 1 - y / height;
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const nearBlack = r < 20 && g < 20 && b < 20;
      const alpha = nearBlack ? 0 : a;

      data[index + 3] = alpha;

      const depthValue = Math.max(
        0,
        Math.min(255, Math.round((luminance * 0.62 + headBias * 0.38) * 255))
      );
      depthData.data[index] = depthValue;
      depthData.data[index + 1] = depthValue;
      depthData.data[index + 2] = depthValue;
      depthData.data[index + 3] = alpha;
    }

    maskContext.putImageData(imageData, 0, 0);
    depthContext.putImageData(depthData, 0, 0);

    return {
      colorTexture: new THREE.CanvasTexture(maskCanvas),
      alphaTexture: new THREE.CanvasTexture(maskCanvas),
      depthTexture: new THREE.CanvasTexture(depthCanvas),
      ratio: width / height
    };
  }

  function createFallbackAvatar() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    textureLoader.load(
      avatarSource,
      (avatarTexture) => {
        const source = avatarTexture.source?.data;
        const avatarMaps =
          source?.width && source?.height ? buildAvatarMaps(source) : null;

        if (!avatarMaps) {
          sceneRoot.classList.add("is-webgl-ready");
          return;
        }

        avatarMaps.colorTexture.colorSpace = THREE.SRGBColorSpace;
        avatarMaps.colorTexture.anisotropy = 8;
        avatarMaps.alphaTexture.anisotropy = 8;
        avatarMaps.depthTexture.anisotropy = 8;

        const ratio = avatarMaps.ratio || 0.72;
        const planeHeight = 7.2;
        const planeWidth = planeHeight * ratio;
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 160, 160);

        const auraLayer = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            map: avatarMaps.colorTexture,
            alphaMap: avatarMaps.alphaTexture,
            color: 0x36de78,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
          })
        );
        auraLayer.position.set(0.18, -0.08, -0.28);
        auraLayer.scale.set(1.04, 1.04, 1);

        const ghostLayer = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            map: avatarMaps.colorTexture,
            alphaMap: avatarMaps.alphaTexture,
            color: 0x9fffc9,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
          })
        );
        ghostLayer.position.set(-0.08, 0.02, 0.04);
        ghostLayer.scale.set(1.01, 1.01, 1);

        const mainLayer = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({
            map: avatarMaps.colorTexture,
            alphaMap: avatarMaps.alphaTexture,
            displacementMap: avatarMaps.depthTexture,
            displacementScale: 0.42,
            displacementBias: -0.18,
            normalScale: new THREE.Vector2(0.5, 0.5),
            transparent: true,
            roughness: 0.46,
            metalness: 0.1,
            depthWrite: true,
            side: THREE.DoubleSide
          })
        );
        mainLayer.position.z = 0.14;

        const edgeLayer = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            map: avatarMaps.alphaTexture,
            color: 0xb9ffdb,
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        );
        edgeLayer.position.z = -0.05;
        edgeLayer.scale.set(1.03, 1.03, 1);

        const frameOutline = new THREE.Mesh(
          new THREE.RingGeometry(Math.max(planeWidth, planeHeight) * 0.35, Math.max(planeWidth, planeHeight) * 0.37, 128),
          new THREE.MeshBasicMaterial({
            color: 0x7dffb0,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        frameOutline.position.set(0, -0.1, -0.1);

        avatar.add(auraLayer, ghostLayer, edgeLayer, mainLayer, frameOutline);
        avatar.position.set(0, -0.42, 0.2);
        fallbackObjects = [auraLayer, ghostLayer, edgeLayer, mainLayer, frameOutline];
        fallbackState = { mainLayer, frameOutline, auraLayer, ghostLayer, edgeLayer };
        sceneRoot.classList.add("is-webgl-ready");
      },
      undefined,
      () => {
        sceneRoot.classList.add("is-webgl-ready");
      }
    );
  }

  function createWorldFx() {
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x7dffb0,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    [
      { radius: 2.9, tube: 0.008, y: -2.58, z: -0.4, rx: 1.32, speed: 0.42 },
      { radius: 3.8, tube: 0.006, y: -2.5, z: -0.9, rx: 1.2, speed: -0.25 },
      { radius: 2.18, tube: 0.006, y: -1.6, z: 0.68, rx: 1.48, speed: 0.32 }
    ].forEach((config) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(config.radius, config.tube, 12, 160),
        ringMaterial.clone()
      );
      ring.position.set(0, config.y, config.z);
      ring.rotation.x = config.rx;
      ring.userData.speed = config.speed;
      rings.add(ring);
    });

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    const randoms = [];
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 1.8 + Math.random() * 3.4;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -2.4 + Math.random() * 5.5;
      positions[i * 3 + 2] = -1.9 + Math.random() * 3.6;
      randoms.push({ speed: 0.25 + Math.random() * 0.75, phase: Math.random() * Math.PI * 2 });
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x7dffb0,
        size: 0.032,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    particles.add(particleSystem);
    particles.userData = { particleSystem, particleGeometry, randoms, particleCount };
  }

  function loadRiggedCharacter(glbPath) {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      glbPath,
      (gltf) => {
        rigModel = gltf.scene;
        rigModel.scale.setScalar(Number.isFinite(characterScale) ? characterScale : 2.55);
        rigModel.position.set(0, -3.45, 0.25);
        rigModel.rotation.y = -0.08;
        rigModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = false;
            node.receiveShadow = false;
            if (node.material) {
              node.material.envMapIntensity = 0.95;
              node.material.needsUpdate = true;
            }
          }
        });
        avatar.add(rigModel);
        sceneRoot.classList.add("is-webgl-ready");

        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(rigModel);
          const clip = gltf.animations[Math.max(0, Math.min(characterAnimation, gltf.animations.length - 1))];
          const action = mixer.clipAction(clip);
          action.enabled = true;
          action.clampWhenFinished = false;
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
          proceduralRig = null;
        } else {
          // Procedural fallback motion when GLB has no embedded animation clips.
          proceduralRig = {
            baseY: rigModel.position.y,
            baseZ: rigModel.position.z,
            baseRotY: rigModel.rotation.y,
            baseScale: rigModel.scale.x
          };
        }

        fallbackObjects.forEach((object) => {
          avatar.remove(object);
        });
        fallbackObjects = [];
      },
      undefined,
      () => {
        createFallbackAvatar();
      }
    );
  }

  function resize() {
    const { clientWidth, clientHeight } = sceneRoot;
    const width = Math.max(1, clientWidth);
    const height = Math.max(1, clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    root.scale.setScalar(width < 520 ? 0.78 : 1);
  }

  function handlePointer(event) {
    const rect = sceneRoot.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = -(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  }

  createWorldFx();
  if (characterGlb) {
    loadRiggedCharacter(characterGlb);
  } else {
    createFallbackAvatar();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", handlePointer, { passive: true });
  resize();

  function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;
    const reduced = prefersReducedMotion.matches;

    pointer.x += (target.x - pointer.x) * 0.08;
    pointer.y += (target.y - pointer.y) * 0.08;

    root.rotation.y = pointer.x * 0.26;
    root.rotation.x = pointer.y * 0.14;
    avatar.position.y = -0.42 + Math.sin(elapsed * 1.25) * (reduced ? 0.01 : 0.07);

    if (rigModel) {
      rigModel.rotation.y = pointer.x * 0.16 - 0.08;
      rigModel.rotation.x = pointer.y * 0.08;
      if (proceduralRig) {
        const breath = Math.sin(elapsed * 1.35);
        const sway = Math.sin(elapsed * 0.8);
        rigModel.position.y = proceduralRig.baseY + breath * 0.08;
        rigModel.position.z = proceduralRig.baseZ + Math.cos(elapsed * 1.1) * 0.03;
        rigModel.rotation.y = proceduralRig.baseRotY + pointer.x * 0.24 + sway * 0.07;
        rigModel.rotation.x = pointer.y * 0.1 + Math.sin(elapsed * 0.95) * 0.03;
        rigModel.rotation.z = Math.sin(elapsed * 1.15) * 0.02;
        const scalePulse = proceduralRig.baseScale + Math.sin(elapsed * 1.35) * 0.018;
        rigModel.scale.setScalar(scalePulse);
      }
    } else if (fallbackState) {
      const { auraLayer, ghostLayer, mainLayer, frameOutline, edgeLayer } = fallbackState;
      auraLayer.position.x = 0.18 - pointer.x * 0.12;
      auraLayer.position.y = -0.08 + pointer.y * 0.08;
      ghostLayer.position.x = -0.08 + pointer.x * 0.09;
      ghostLayer.position.y = 0.02 - pointer.y * 0.06;
      if (edgeLayer) {
        edgeLayer.position.x = pointer.x * 0.03;
        edgeLayer.position.y = pointer.y * 0.02;
      }
      mainLayer.rotation.y = pointer.x * 0.12;
      mainLayer.rotation.x = pointer.y * 0.06;
      mainLayer.position.z = 0.14 + Math.sin(elapsed * 1.8) * 0.02;
      if (frameOutline) {
        frameOutline.rotation.z = elapsed * 0.25;
      }
    }

    if (mixer) {
      mixer.update(delta);
    }

    rings.children.forEach((ring) => {
      ring.rotation.z += (ring.userData.speed || 0.08) * 0.01;
    });

    const particleData = particles.userData;
    if (particleData?.particleGeometry) {
      const array = particleData.particleGeometry.attributes.position.array;
      for (let i = 0; i < particleData.particleCount; i += 1) {
        const data = particleData.randoms[i];
        array[i * 3 + 1] += Math.sin(elapsed * data.speed + data.phase) * 0.0015;
        array[i * 3] += Math.cos(elapsed * data.speed + data.phase) * 0.001;
      }
      particleData.particleGeometry.attributes.position.needsUpdate = true;
      particleData.particleSystem.rotation.y = elapsed * 0.03;
    }

    camera.position.x = pointer.x * 0.28;
    camera.position.y = 0.35 + pointer.y * 0.16;
    camera.lookAt(0, -0.25, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
