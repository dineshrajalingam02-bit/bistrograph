import * as THREE from './assets/vendor/three.module.js';

const container = document.querySelector('#coffee-scene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches || document.documentElement.classList.contains('animations-paused');
let visible = true;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 60);
  camera.position.set(0, 5.8, 8.1);
  camera.lookAt(0, .35, 0);
  scene.add(new THREE.HemisphereLight(0xfff7e4, 0x5b6354, 2.5));
  const key = new THREE.DirectionalLight(0xfff1d8, 3.5);
  key.position.set(-3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe7ab77, 2.8);
  rim.position.set(3, 3, -3); scene.add(rim);
  const fill = new THREE.PointLight(0xf9e5bd, 18, 12);
  fill.position.set(0, 3, 4); scene.add(fill);

  const group = new THREE.Group();
  group.rotation.set(.03, 0, -.16);
  group.position.y = -.05;
  scene.add(group);
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xe8dbc0, roughness: .22, metalness: .025, clearcoat: .65, clearcoatRoughness: .16 });
  const edgeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc2aa82, roughness: .27, metalness: .1, clearcoat: .4 });
  const saucerPoints = [[0,0],[.3,0],[.9,.01],[1.3,.055],[1.65,.14],[1.92,.22],[1.95,.27],[1.9,.3],[1.65,.23],[1.3,.14],[.9,.08],[.3,.07],[0,.07]].map(([x,y]) => new THREE.Vector2(x,y));
  const saucer = new THREE.Mesh(new THREE.LatheGeometry(saucerPoints, 96), ceramic);
  saucer.position.y = -.4; group.add(saucer);
  const foot = new THREE.Mesh(new THREE.TorusGeometry(.72,.035,12,80), edgeMaterial);
  foot.rotation.x = Math.PI/2; foot.position.y = -.29; group.add(foot);
  const cupPoints = [[.44,0],[.5,.04],[.58,.12],[.68,.28],[.82,.56],[.97,.88],[1.015,1.12],[1.015,1.19],[.975,1.21],[.94,1.17],[.91,.95],[.78,.62],[.64,.34],[.49,.16],[.44,.14]].map(([x,y]) => new THREE.Vector2(x,y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPoints, 96), ceramic);
  cup.position.y = -.29; group.add(cup);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.987,.025,12,96), ceramic);
  lip.rotation.x = Math.PI/2; lip.position.y = .9; group.add(lip);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.47,.12,20,64,Math.PI*1.58), ceramic);
  handle.position.set(1.04,.31,0); handle.rotation.z = -Math.PI*.79; handle.scale.set(1, .9, 1); group.add(handle);

  const coffeeTextureCanvas = document.createElement('canvas');
  coffeeTextureCanvas.width = coffeeTextureCanvas.height = 1024;
  const context = coffeeTextureCanvas.getContext('2d');
  const coffeeGradient = context.createRadialGradient(440,420,30,512,512,515);
  coffeeGradient.addColorStop(0,'#c38a48'); coffeeGradient.addColorStop(.7,'#ad6c30'); coffeeGradient.addColorStop(.94,'#81491e'); coffeeGradient.addColorStop(1,'#e9bf76');
  context.fillStyle = coffeeGradient; context.fillRect(0,0,1024,1024);
  let seed = 39;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i=0;i<1800;i++) {
    const x=random()*1024,y=random()*1024,r=random()*2.5+.5;
    context.fillStyle=`rgba(250,220,170,${random()*.2})`;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill();
  }
  // A rosetta poured in milk: paired leaves and a tapered central stem.
  context.fillStyle='#f7e9c6';
  for(let i=0;i<12;i++) {
    const y=350+i*25,w=30+i*9;
    context.beginPath();context.ellipse(507-w*.65,y,w,7+i*.25,.2,0,Math.PI*2);context.fill();
    context.beginPath();context.ellipse(517+w*.65,y,w,7+i*.25,-.2,0,Math.PI*2);context.fill();
  }
  context.beginPath();context.moveTo(509,320);context.bezierCurveTo(495,430,500,600,520,720);context.lineTo(538,720);context.bezierCurveTo(524,580,522,430,520,320);context.closePath();context.fill();
  context.beginPath();context.moveTo(514,365);context.bezierCurveTo(405,325,440,256,487,284);context.bezierCurveTo(512,300,514,317,514,317);context.bezierCurveTo(540,260,610,278,581,324);context.bezierCurveTo(560,350,536,356,514,365);context.fill();
  const coffeeTexture = new THREE.CanvasTexture(coffeeTextureCanvas); coffeeTexture.colorSpace = THREE.SRGBColorSpace;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(.943,96), new THREE.MeshPhysicalMaterial({ map: coffeeTexture, roughness: .36, clearcoat: .32, side: THREE.DoubleSide }));
  coffee.rotation.x = -Math.PI/2;coffee.position.y = .825;group.add(coffee);

  const spoonMaterial = new THREE.MeshStandardMaterial({ color: 0xc5b699, metalness: .85, roughness: .24 });
  const spoon = new THREE.Group();
  const spoonStem = new THREE.Mesh(new THREE.CapsuleGeometry(.038,.95,5,12), spoonMaterial);
  spoonStem.rotation.z = Math.PI/2; spoon.add(spoonStem);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1,24,16), spoonMaterial);
  bowl.scale.set(.28,.035,.18);bowl.position.x = -.65;spoon.add(bowl);
  spoon.position.set(.45,-.13,1.17);spoon.rotation.y = -.3;group.add(spoon);

  const beanMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2c1b, roughness: .6 });
  const grooveMaterial = new THREE.MeshStandardMaterial({ color: 0x22150d, roughness: .85 });
  [[-1.7,-.18,.5,.6],[-1.45,-.13,1.08,1.7],[1.7,-.1,-.6,.2]].forEach(([x,y,z,rotation])=> {
    const bean = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1,20,14),beanMaterial);shell.scale.set(.14,.08,.22);bean.add(shell);
    const groove = new THREE.Mesh(new THREE.CapsuleGeometry(.012,.28,4,8),grooveMaterial);groove.rotation.x = Math.PI/2;groove.position.y=.079;bean.add(groove);
    bean.position.set(x,y,z);bean.rotation.y=rotation;group.add(bean);
  });
  // Soft contact shadow stays transparent so the scene blends into the page.
  const shadowCanvas = document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const shadowContext = shadowCanvas.getContext('2d');const gradient=shadowContext.createRadialGradient(64,64,5,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.42)');gradient.addColorStop(.6,'rgba(0,0,0,.2)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.8,5.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.98;scene.add(shadow);

  const target = { x:0,y:0 }; const current = { x:0,y:0 };
  container.addEventListener('pointermove',event=> {
    if(paused || event.pointerType !== 'mouse') return;
    const rect=container.getBoundingClientRect();target.x=((event.clientX-rect.left)/rect.width-.5)*.5;target.y=((event.clientY-rect.top)/rect.height-.5)*.18;
  });
  container.addEventListener('pointerleave',()=>{target.x=target.y=0;});
  let renderFrame;
  let elapsed=0;
  let previous=performance.now();
  function frame(time) {
    const delta=Math.min((time-previous)/1000,.05); previous=time;
    if(!paused && visible && !document.hidden) {
      elapsed+=delta;current.x+=(target.x-current.x)*.06;current.y+=(target.y-current.y)*.06;
      group.rotation.y=current.x+Math.sin(elapsed*.28)*.055;
      group.rotation.x=.03+current.y;group.position.y=-.05+Math.sin(elapsed*.85)*.065;
      renderer.render(scene,camera);
    }
    renderFrame=requestAnimationFrame(frame);
  }
  function resize() {
    const width=container.clientWidth,height=container.clientHeight;
    if(!width || !height) return;
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera);
  }
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'80px'}).observe(container);
  window.addEventListener('bistro-motion',event=>{
    paused=event.detail.paused;
    if(paused) {group.rotation.set(.03,0,-.16);group.position.y=-.05;renderer.render(scene,camera);}
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(renderFrame);container.classList.remove('scene-ready');});
  resize();container.classList.add('scene-ready');renderFrame=requestAnimationFrame(frame);
} catch(error) {
  renderer?.domElement.remove();
  container.classList.remove('scene-ready');
  console.info('3D preview unavailable. Showing the coffee illustration instead.');
}
