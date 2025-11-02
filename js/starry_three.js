// starry_three.js — Three.js adaptation of the CodePen “Starry Night” point cloud
// No external tween lib; smooth transitions via lerp in RAF
// Export: initStarryThree()

import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

const url = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/223954/StarryNight2.jpg';
const extrusionTarget = { h: 1.25, s: 0, v: 0 };
const mouseExtrusion = 1.0; // multiplier

function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
function lerp(a,b,t){ return a + (b-a) * t; }

export function initStarryThree(){
  const width = window.innerWidth;
  const height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(width, height);
  renderer.domElement.className = 'webgl-starry';
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(renderer.domElement);

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = '';

  // uniforms / state
  const currentExtrusion = { h: 0, s: 0, v: 0 };
  const mouse = new THREE.Vector2(); // NDC
  const raycaster = new THREE.Raycaster();

  let mesh, mouseDetectionPlane;

  const shaders = {
    fragment: `
      varying vec4 vColor;
      void main(){ gl_FragColor = vColor; }
    `,
    vertex: `
      uniform sampler2D texture;
      uniform vec2 resolution;
      uniform vec3 hsv;
      uniform vec3 mouse;
      uniform float mouseMult;

      varying vec4 vColor;

      vec4 distanceTo(vec3 p1, vec3 p2){
        vec3 d = vec3(p2.x - p1.x, p2.y - p1.y, 0.);
        return vec4(abs(d.x), abs(d.y), abs(d.z), sqrt(d.x*d.x + d.y*d.y + d.z*d.z));
      }

      float getBrilliance(vec3 color){
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        return luminance / max(luminance, 1.0);
      }

      void main(){
        vec2 vUv = vec2(resolution.x - position.x, position.y)/resolution;
        vec3 p = position;
        p.x = p.x - resolution.x / 2.; 
        p.y = p.y - resolution.y / 2.;

        vec4 d = distanceTo(vec3(-p.x, -p.y, p.z), mouse);
        vColor = texture2D(texture, vUv);

        float extrusion = (vColor.x * hsv.x) + (vColor.y * hsv.y) + (vColor.z * hsv.z);
        extrusion = getBrilliance(vColor.xyz);

        float dm = (pow(2., (40.-d.w) * 0.1) * 0.2 - 1.) * mouseMult;
        extrusion = extrusion + extrusion * dm;

        gl_PointSize = 2.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(p.x, p.y, extrusion), 1.0);
      }
    `
  };

  loader.load(url, (texture) => {
    const imageScale = 0.01;
    const pointDist = 1 * imageScale;
    const imageHeight = texture.image.height * imageScale;
    const imageWidth = texture.image.width * imageScale;

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];

    for (let x = 0; x + pointDist < imageWidth; x += pointDist){
      for (let y = 0; y + pointDist < imageHeight; y += pointDist){
        positions.push(x, y, 0);
        sizes.push(1);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        texture: { value: texture },
        resolution: { value: new THREE.Vector2(imageWidth, imageHeight) },
        mouse: { value: new THREE.Vector3(0,0,0) },
        hsv: { value: new THREE.Vector3(currentExtrusion.h, currentExtrusion.s, currentExtrusion.v) },
        mouseMult: { value: mouseExtrusion }
      },
      vertexShader: shaders.vertex,
      fragmentShader: shaders.fragment,
      transparent: true,
      depthTest: false
    });

    mesh = new THREE.Points(geometry, material);
    mesh.rotation.y = Math.PI; mesh.rotation.x = Math.PI;
    scene.add(mesh);

    mouseDetectionPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(imageWidth + 50, imageHeight + 50, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 0, transparent: true, depthWrite: false })
    );
    scene.add(mouseDetectionPlane);

    camera.position.z = Math.max(imageWidth, imageHeight) * 0.2;

    // animate in (lerp to targets)
    const targetZ = Math.max(imageWidth, imageHeight) * 0.6;

    function animate(time){
      requestAnimationFrame(animate);

      if (mesh){
        // easing
        camera.position.z = lerp(camera.position.z, targetZ, 0.02);
        currentExtrusion.h = lerp(currentExtrusion.h, extrusionTarget.h, 0.02);
        currentExtrusion.s = lerp(currentExtrusion.s, extrusionTarget.s, 0.02);
        currentExtrusion.v = lerp(currentExtrusion.v, extrusionTarget.v, 0.02);
        mesh.material.uniforms.hsv.value.set(currentExtrusion.h, currentExtrusion.s, currentExtrusion.v);

        // subtle rotations on the detection plane
        const t = performance.now()*0.001;
        const half_PI = Math.PI/2;
        mouseDetectionPlane.rotation.x = Math.PI + Math.cos(t*0.25 + 14) * (half_PI * 0.25);
        mouseDetectionPlane.rotation.y = Math.PI + Math.sin(t*0.15 - 1) * (half_PI * 0.25);
      }

      renderer.render(scene, camera);
    }
    animate();
  });

  function onResize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // mouse raycasting on whole window
  document.addEventListener('mousemove', (e)=>{
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (!mesh || !mouseDetectionPlane) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mouseDetectionPlane);
    const p = intersects.length ? intersects[0].point : new THREE.Vector3(0,0,0);
    mesh.material.uniforms.mouse.value.set(p.x, p.y, p.z);
  }, { passive: true });
}
