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
  let rigShell = null;
  let proceduralRig = null;
  let fallbackObjects = [];
  let fallbackState = null;
  let nextBlinkAt = 0.9 + Math.random() * 1.8;
  let blinkProgress = 1;
  let blinkDuration = 0.09;

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

        const characterGroup = new THREE.Group();

        const body = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.62, 1.3, 8, 16),
          new THREE.MeshStandardMaterial({
            color: 0x0d2a1c,
            roughness: 0.45,
            metalness: 0.12
          })
        );
        body.position.set(0, -1.65, -0.35);

        const shoulder = new THREE.Mesh(
          new THREE.SphereGeometry(0.92, 24, 16),
          new THREE.MeshStandardMaterial({
            color: 0x123726,
            roughness: 0.5,
            metalness: 0.08
          })
        );
        shoulder.scale.set(1.2, 0.68, 0.8);
        shoulder.position.set(0, -1.15, -0.42);

        const armMaterial = new THREE.MeshStandardMaterial({
          color: 0x184330,
          roughness: 0.48,
          metalness: 0.1
        });
        const forearmMaterial = new THREE.MeshStandardMaterial({
          color: 0x1f5a3f,
          roughness: 0.45,
          metalness: 0.12
        });

        const leftArmGroup = new THREE.Group();
        const leftUpperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.58, 6, 8), armMaterial);
        const leftForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.46, 6, 8), forearmMaterial);
        leftUpperArm.rotation.z = 0.42;
        leftUpperArm.position.set(-0.86, -1.12, -0.42);
        leftForearm.rotation.z = 0.26;
        leftForearm.position.set(-1.18, -1.56, -0.35);
        leftArmGroup.add(leftUpperArm, leftForearm);

        const rightArmGroup = new THREE.Group();
        const rightUpperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.58, 6, 8), armMaterial);
        const rightForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.46, 6, 8), forearmMaterial);
        rightUpperArm.rotation.z = -0.42;
        rightUpperArm.position.set(0.86, -1.12, -0.42);
        rightForearm.rotation.z = -0.26;
        rightForearm.position.set(1.18, -1.56, -0.35);
        rightArmGroup.add(rightUpperArm, rightForearm);

        const headCore = new THREE.Mesh(
          new THREE.SphereGeometry(1.02, 56, 40),
          new THREE.MeshStandardMaterial({
            color: 0xeac8a7,
            roughness: 0.56,
            metalness: 0.04
          })
        );
        headCore.position.set(0, -0.1, 0);
        headCore.scale.set(1.02, 1.12, 0.94);

        const hairCap = new THREE.Mesh(
          new THREE.SphereGeometry(1.02, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
          new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.74,
            metalness: 0.05
          })
        );
        hairCap.position.set(0, 0.42, 0.02);
        hairCap.scale.set(1.02, 0.88, 0.94);

        const eyeMaterial = new THREE.MeshBasicMaterial({
          color: 0x9effc7,
          transparent: true,
          opacity: 0.75
        });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), eyeMaterial);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), eyeMaterial.clone());
        leftEye.position.set(-0.24, 0.07, 0.86);
        rightEye.position.set(0.24, 0.07, 0.86);

        const eyeGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0x7dffb0,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const leftEyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), eyeGlowMaterial);
        const rightEyeGlow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), eyeGlowMaterial.clone());
        leftEyeGlow.position.copy(leftEye.position);
        rightEyeGlow.position.copy(rightEye.position);

        const facePlaneWidth = 2.02;
        const facePlaneHeight = facePlaneWidth / (avatarMaps.ratio || 0.72);
        const facePlane = new THREE.Mesh(
          new THREE.PlaneGeometry(facePlaneWidth, facePlaneHeight, 1, 1),
          new THREE.MeshStandardMaterial({
            map: avatarMaps.colorTexture,
            alphaMap: avatarMaps.alphaTexture,
            transparent: true,
            roughness: 0.5,
            metalness: 0.03,
            depthWrite: false
          })
        );
        facePlane.position.set(0, -0.02, 0.9);
        facePlane.scale.set(1, 1.08, 1);

        const faceGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(facePlaneWidth * 1.02, facePlaneHeight * 1.03, 1, 1),
          new THREE.MeshBasicMaterial({
            map: avatarMaps.alphaTexture,
            color: 0x9fffc9,
            transparent: true,
            opacity: 0.14,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        faceGlow.position.set(0.03, 0.02, 0.72);

        const frameOutline = new THREE.Mesh(
          new THREE.TorusGeometry(1.36, 0.024, 16, 120),
          new THREE.MeshBasicMaterial({
            color: 0x7dffb0,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        frameOutline.position.set(0, -0.14, -0.18);
        frameOutline.rotation.x = 0.08;

        const floorShadow = new THREE.Mesh(
          new THREE.CircleGeometry(1.32, 48),
          new THREE.MeshBasicMaterial({
            color: 0x06150e,
            transparent: true,
            opacity: 0.52,
            depthWrite: false
          })
        );
        floorShadow.position.set(0, -2.45, -0.78);
        floorShadow.rotation.x = -Math.PI / 2;
        floorShadow.scale.set(1.25, 0.74, 1);

        const floorShadowSoft = new THREE.Mesh(
          new THREE.CircleGeometry(1.76, 64),
          new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.24,
            depthWrite: false
          })
        );
        floorShadowSoft.position.set(0, -2.5, -1.08);
        floorShadowSoft.rotation.x = -Math.PI / 2;
        floorShadowSoft.scale.set(1.48, 0.9, 1);

        characterGroup.add(
          floorShadow,
          floorShadowSoft,
          body,
          shoulder,
          leftArmGroup,
          rightArmGroup,
          headCore,
          hairCap,
          leftEyeGlow,
          rightEyeGlow,
          leftEye,
          rightEye,
          faceGlow,
          facePlane,
          frameOutline
        );
        avatar.add(characterGroup);
        avatar.position.set(0, -0.38, 0.22);

        fallbackObjects = [characterGroup];
        fallbackState = {
          characterGroup,
          headCore,
          hairCap,
          leftArmGroup,
          rightArmGroup,
          leftEye,
          rightEye,
          leftEyeGlow,
          rightEyeGlow,
          floorShadow,
          floorShadowSoft,
          facePlane,
          faceGlow,
          frameOutline
        };
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

        // Add a dark shell behind the generated head to make depth clearer when rotating.
        rigShell = rigModel.clone(true);
        rigShell.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshBasicMaterial({
              color: 0x0c2418,
              transparent: true,
              opacity: 0.55,
              side: THREE.BackSide,
              depthWrite: false
            });
          }
        });
        rigShell.scale.setScalar(1.03);
        rigShell.position.z = -0.18;
        avatar.add(rigShell);
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
      rigModel.rotation.y = pointer.x * 0.34 - 0.08;
      rigModel.rotation.x = pointer.y * 0.12;
      if (proceduralRig) {
        const breath = Math.sin(elapsed * 1.35);
        const sway = Math.sin(elapsed * 0.8);
        const turn = Math.sin(elapsed * 0.62);
        rigModel.position.y = proceduralRig.baseY + breath * 0.08;
        rigModel.position.z = proceduralRig.baseZ + Math.cos(elapsed * 1.1) * 0.03;
        rigModel.rotation.y = proceduralRig.baseRotY + pointer.x * 0.28 + sway * 0.08 + turn * 0.22;
        rigModel.rotation.x = pointer.y * 0.1 + Math.sin(elapsed * 0.95) * 0.03;
        rigModel.rotation.z = Math.sin(elapsed * 1.15) * 0.02;
        const scalePulse = proceduralRig.baseScale + Math.sin(elapsed * 1.35) * 0.018;
        rigModel.scale.setScalar(scalePulse);
      }
      if (rigShell) {
        rigShell.position.y = rigModel.position.y;
        rigShell.position.z = rigModel.position.z - 0.2;
        rigShell.rotation.copy(rigModel.rotation);
        rigShell.scale.copy(rigModel.scale).multiplyScalar(1.03);
      }
    } else if (fallbackState) {
      const {
        characterGroup,
        headCore,
        hairCap,
        leftArmGroup,
        rightArmGroup,
        leftEye,
        rightEye,
        leftEyeGlow,
        rightEyeGlow,
        floorShadow,
        floorShadowSoft,
        facePlane,
        faceGlow,
        frameOutline
      } = fallbackState;
      characterGroup.position.y = Math.sin(elapsed * 1.28) * 0.08;
      characterGroup.rotation.y = pointer.x * 0.3 + Math.sin(elapsed * 0.65) * 0.2;
      characterGroup.rotation.x = pointer.y * 0.12 + Math.sin(elapsed * 0.82) * 0.03;
      if (headCore && hairCap) {
        headCore.rotation.y = pointer.x * 0.08;
        hairCap.rotation.y = pointer.x * 0.1;
      }
      if (facePlane && faceGlow) {
        facePlane.position.x = pointer.x * 0.12;
        facePlane.position.y = -0.02 + pointer.y * 0.08;
        faceGlow.position.x = 0.03 + pointer.x * 0.16;
        faceGlow.position.y = 0.02 + pointer.y * 0.1;
      }
      if (leftArmGroup && rightArmGroup) {
        leftArmGroup.rotation.x = Math.sin(elapsed * 2.15) * 0.28 + pointer.y * 0.14;
        leftArmGroup.rotation.z = Math.sin(elapsed * 1.45) * 0.18 - pointer.x * 0.08;
        rightArmGroup.rotation.x = Math.sin(elapsed * 2.15 + Math.PI) * 0.28 + pointer.y * 0.14;
        rightArmGroup.rotation.z = Math.sin(elapsed * 1.45 + Math.PI) * 0.18 + pointer.x * 0.08;
      }
      if (leftEye && rightEye && leftEyeGlow && rightEyeGlow) {
        if (elapsed >= nextBlinkAt) {
          blinkProgress = Math.min(1, blinkProgress + delta / blinkDuration);
          if (blinkProgress >= 1) {
            blinkProgress = 0;
            blinkDuration = 0.07 + Math.random() * 0.08;
            nextBlinkAt = elapsed + 1.2 + Math.random() * 2.8;
          }
        }
        const blinkCurve = blinkProgress < 1 ? Math.sin(blinkProgress * Math.PI) : 0;
        const blinkAmount = 1 - blinkCurve * 0.9;
        leftEye.scale.y = blinkAmount;
        rightEye.scale.y = blinkAmount;
        leftEyeGlow.scale.y = 0.9 + blinkAmount * 0.2;
        rightEyeGlow.scale.y = 0.9 + blinkAmount * 0.2;
        const eyeOpacity = 0.55 + Math.sin(elapsed * 4.8) * 0.18;
        leftEye.material.opacity = eyeOpacity;
        rightEye.material.opacity = eyeOpacity;
      }
      if (floorShadow) {
        const shadowPulse = 1 + Math.sin(elapsed * 1.28) * 0.06;
        floorShadow.scale.set(1.25 * shadowPulse, 0.74 * shadowPulse, 1);
        floorShadow.material.opacity = 0.44 + Math.sin(elapsed * 1.28 + 0.3) * 0.06;
      }
      if (floorShadowSoft) {
        const softPulse = 1 + Math.sin(elapsed * 1.1 + 0.5) * 0.04;
        floorShadowSoft.scale.set(1.48 * softPulse, 0.9 * softPulse, 1);
        floorShadowSoft.material.opacity = 0.2 + Math.sin(elapsed * 1.1 + 0.5) * 0.035;
      }
      if (frameOutline) {
        frameOutline.rotation.z = elapsed * 0.3;
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
