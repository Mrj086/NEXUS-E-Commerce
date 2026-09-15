import { useEffect, useRef } from "react";
import * as THREE from "three";

// Renders a 3D yellow shopping bag with "NEXUS" branding and "Happy Shopping" text
export default function Hero3D(){
  const mountRef = useRef(null);

  useEffect(()=>{
    const mount = mountRef.current;
    if(!mount) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let width = mount.clientWidth || 1, height = mount.clientHeight || 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width/height, 0.1, 100);
    camera.position.set(0, 0.5, 5.5);

    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xffcc00, 0.8, 15);
    pointLight.position.set(-2, 2, 3);
    scene.add(pointLight);

    const group = new THREE.Group();
    scene.add(group);

    // === BAG BODY ===
    // Main bag body - slightly tapered cylinder
    const bagGeo = new THREE.CylinderGeometry(1.05, 0.85, 2.0, 32, 1);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold/Yellow
      roughness: 0.45,
      metalness: 0.15,
    });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.y = 0;
    group.add(bag);

    // Bag bottom - flat disc
    const bottomGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.05, 32);
    const bottomMat = new THREE.MeshStandardMaterial({ color: 0xDAA520, roughness: 0.5, metalness: 0.2 });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = -1.02;
    group.add(bottom);

    // Bag top rim
    const rimGeo = new THREE.TorusGeometry(1.05, 0.05, 8, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.4 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 1.0;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    // === BAG HANDLES ===
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 1.0, 0),
      new THREE.Vector3(-0.5, 1.55, 0),
      new THREE.Vector3(-0.25, 1.8, 0),
      new THREE.Vector3(0, 1.9, 0),
      new THREE.Vector3(0.25, 1.8, 0),
      new THREE.Vector3(0.5, 1.55, 0),
      new THREE.Vector3(0.55, 1.0, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 32, 0.04, 8, false);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.5 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    group.add(handle);

    // === TEXT ON BAG ===
    // NEXUS text on front of bag
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Transparent background
    ctx.clearRect(0, 0, 512, 512);

    // NEXUS logo on bag - a stylish N in a circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(256, 120, 50, 0, Math.PI * 2);
    ctx.fillStyle = "#B8860B";
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 256, 122);
    ctx.restore();

    // "NEXUS" text
    ctx.fillStyle = "#5C3D00";
    ctx.font = "bold 72px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NEXUS", 256, 240);

    // "Happy Shopping" text
    ctx.fillStyle = "#7A5A00";
    ctx.font = "italic 28px Georgia, serif";
    ctx.fillText("Happy Shopping", 256, 310);

    // Small decorative line
    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(156, 275);
    ctx.lineTo(356, 275);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create a plane with the text, positioned on the front of the bag
    const textGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const textMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const textPlane = new THREE.Mesh(textGeo, textMat);
    textPlane.position.set(0, 0.05, 1.06);
    group.add(textPlane);

    // Back of bag text (mirrored)
    const canvas2 = document.createElement("canvas");
    canvas2.width = 512; canvas2.height = 512;
    const ctx2 = canvas2.getContext("2d");
    ctx2.clearRect(0, 0, 512, 512);
    ctx2.save();
    ctx2.beginPath();
    ctx2.arc(256, 120, 50, 0, Math.PI * 2);
    ctx2.fillStyle = "#B8860B";
    ctx2.fill();
    ctx2.fillStyle = "#FFFFFF";
    ctx2.font = "bold 52px Arial, sans-serif";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText("N", 256, 122);
    ctx2.restore();
    ctx2.fillStyle = "#5C3D00";
    ctx2.font = "bold 72px Arial, sans-serif";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText("NEXUS", 256, 240);
    ctx2.fillStyle = "#7A5A00";
    ctx2.font = "italic 28px Georgia, serif";
    ctx2.fillText("Happy Shopping", 256, 310);
    ctx2.strokeStyle = "#B8860B";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(156, 275);
    ctx2.lineTo(356, 275);
    ctx2.stroke();

    const texture2 = new THREE.CanvasTexture(canvas2);
    const textPlaneBack = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: texture2, transparent: true, side: THREE.BackSide, depthWrite: false })
    );
    textPlaneBack.position.set(0, 0.05, -1.06);
    group.add(textPlaneBack);

    // Side panels with subtle NEXUS branding
    for (let side = -1; side <= 1; side += 2) {
      const c3 = document.createElement("canvas");
      c3.width = 256; c3.height = 256;
      const ctx3 = c3.getContext("2d");
      ctx3.clearRect(0, 0, 256, 256);
      ctx3.fillStyle = "#7A5A00";
      ctx3.font = "bold 36px Arial";
      ctx3.textAlign = "center";
      ctx3.textBaseline = "middle";
      ctx3.fillText("N", 128, 128);
      const tex3 = new THREE.CanvasTexture(c3);
      const sidePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.2),
        new THREE.MeshBasicMaterial({ map: tex3, transparent: true, depthWrite: false })
      );
      sidePlane.position.set(side * 1.06, 0.05, 0);
      sidePlane.rotation.y = side * Math.PI / 2;
      group.add(sidePlane);
    }

    // === FLOATING PARTICLES around bag ===
    const particleCount = 40;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 1.5;
      const y = (Math.random() - 0.5) * 3;
      particlePositions[i*3] = Math.cos(angle) * radius;
      particlePositions[i*3+1] = y;
      particlePositions[i*3+2] = Math.sin(angle) * radius;
      particleSpeeds.push({ angle, radius, y, speed: 0.2 + Math.random() * 0.3, ySpeed: 0.1 + Math.random() * 0.2 });
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xFFD700, size: 0.04, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // Mouse interaction
    let targetX = 0, targetY = 0;
    const onMove = e => {
      const r = mount.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width) - 0.5;
      targetY = ((e.clientY - r.top) / r.height) - 0.5;
    };
    window.addEventListener("mousemove", onMove);

    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        // Gentle rotation
        group.rotation.y += 0.004 + targetX * 0.002;
        group.rotation.x += (targetY * 0.2 - group.rotation.x) * 0.03;

        // Floating animation for the bag
        bag.position.y = Math.sin(t * 1.2) * 0.08;
        handle.position.y = Math.sin(t * 1.2) * 0.08;
        textPlane.position.y = 0.05 + Math.sin(t * 1.2) * 0.08;
        textPlaneBack.position.y = 0.05 + Math.sin(t * 1.2) * 0.08;
        rim.position.y = 1.0 + Math.sin(t * 1.2) * 0.08;

        // Animate particles
        const positions = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const s = particleSpeeds[i];
          s.angle += s.speed * 0.01;
          positions[i*3] = Math.cos(s.angle) * s.radius;
          positions[i*3+1] = s.y + Math.sin(t * s.ySpeed + i) * 0.3;
          positions[i*3+2] = Math.sin(s.angle) * s.radius;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Pulsing point light
        pointLight.intensity = 0.6 + Math.sin(t * 2) * 0.2;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      width = mount.clientWidth || 1; height = mount.clientHeight || 1;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      bagGeo.dispose(); bagMat.dispose(); handleGeo.dispose(); handleMat.dispose;
      particleGeo.dispose(); particleMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="hero3d" aria-hidden="true"/>;
}
