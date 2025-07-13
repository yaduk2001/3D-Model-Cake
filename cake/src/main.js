import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setupCounter } from './counter.js'

// Global variables for Three.js
let scene, camera, renderer, cake, controls;
let isRotating = false;
let cakeContainer = null;

// Set up the HTML with an embedded script for the button handler
document.querySelector('#app').innerHTML = `
  <div class="cake-showcase">
    <h1>✨ Cake Visualizer ✨</h1>
    
    <div class="cake-details">
      <div class="cake-card">
        <h2>Custom Cake Designer</h2>
        <p>Design your dream cake! Describe your perfect cake and see it come to life in 3D.</p>
        <p><small>Try keywords like: chocolate, strawberry, wedding, birthday, roses, etc.</small></p>
        <button id="visualize-btn" class="primary-btn" onclick="document.getElementById('cake-prompt-modal').classList.remove('hidden');">✨ Visualize Your Cake</button>
      </div>
      
      <div class="featured-cakes">
        <h2>Popular Cake Designs</h2>
        <div class="cake-grid">
          <div class="cake-item" data-prompt="Classic strawberry cake with white frosting and fresh strawberries">
            <h3>Classic Strawberry</h3>
            <p>Fresh strawberries with cream frosting</p>
          </div>
          <div class="cake-item" data-prompt="Rich chocolate cake with chocolate ganache and chocolate shavings">
            <h3>Chocolate Dream</h3>
            <p>Rich chocolate layers with ganache</p>
          </div>
          <div class="cake-item" data-prompt="Elegant three-tiered wedding cake with white frosting and rose decorations">
            <h3>Wedding Special</h3>
            <p>Elegant tiered cake with floral decorations</p>
          </div>
        </div>
      </div>
    </div>

    <div id="visualization-container" class="hidden">
      <div id="cake-3d-view"></div>
    </div>
  </div>

  <!-- Custom modal for cake prompt -->
  <div id="cake-prompt-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-modal" onclick="document.getElementById('cake-prompt-modal').classList.add('hidden');">&times;</span>
      <h2>Describe Your Perfect Cake</h2>
      <p>Tell us what your dream cake looks like and we'll create it in 3D!</p>
      
      <div class="prompt-form">
        <textarea id="cake-prompt-input" placeholder="Example: Chocolate cake with pink frosting and birthday candles..." rows="3"></textarea>
        <div class="suggestion-chips">
          <span class="chip" data-value="chocolate">Chocolate</span>
          <span class="chip" data-value="strawberry">Strawberry</span>
          <span class="chip" data-value="wedding cake">Wedding</span>
          <span class="chip" data-value="with candles">Birthday</span>
          <span class="chip" data-value="with roses">Roses</span>
        </div>
        <button id="create-cake-btn" class="primary-btn">Create My Cake</button>
      </div>
    </div>
  </div>
`

// Add direct event handlers after the HTML is created
document.getElementById('create-cake-btn').addEventListener('click', function() {
  const userPrompt = document.getElementById('cake-prompt-input').value.trim();
  
  if (userPrompt) {
    console.log("Creating cake with prompt:", userPrompt);
    // Hide modal
    document.getElementById('cake-prompt-modal').classList.add('hidden');
    
    // Show cake visualization
    showCakeVisualization(userPrompt);
    
    // Scroll to the visualization
    document.getElementById('visualization-container').scrollIntoView({ behavior: 'smooth' });
  }
});

setupCounter(document.querySelector('#counter'))

// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, setting up event handlers");
  
  // Close modal when clicking X
  const closeModal = document.querySelector('.close-modal');
  if (closeModal) {
    closeModal.onclick = function() {
      document.getElementById('cake-prompt-modal').classList.add('hidden');
    };
  }

  // Close modal when clicking outside
  window.onclick = function(event) {
    const modal = document.getElementById('cake-prompt-modal');
    if (event.target === modal) {
      modal.classList.add('hidden');
    }
  };

  // Add event listener for suggestion chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('cake-prompt-input');
      const chipValue = chip.getAttribute('data-value');
      
      // If input already has text, add to it, otherwise set it
      if (input.value.trim() !== '') {
        if (!input.value.toLowerCase().includes(chipValue.toLowerCase())) {
          input.value += ` ${chipValue}`;
        }
      } else {
        input.value = chipValue;
      }
      
      input.focus();
    });
  });

  // Handle Enter key in textarea
  const promptInput = document.getElementById('cake-prompt-input');
  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('create-cake-btn').click();
      }
    });
  }

  // Add click handlers for featured cake examples
  document.querySelectorAll('.cake-item').forEach(item => {
    item.addEventListener('click', () => {
      const prompt = item.getAttribute('data-prompt');
      if (prompt) {
        showCakeVisualization(prompt);
        // Scroll to the visualization
        document.getElementById('visualization-container').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

function showCakeVisualization(prompt) {
  console.log("Starting cake visualization for:", prompt);
  const container = document.querySelector('#visualization-container');
  container.classList.remove('hidden');
  
  // Show loading state
  document.querySelector('#cake-3d-view').innerHTML = `
    <div class="visualization-result">
      <h3>Designing Your Cake</h3>
      <p>Prompt: "${prompt}"</p>
      <div class="loading"></div>
    </div>
  `;
  
  // Simulate a slight delay to show loading
  setTimeout(() => {
    console.log("Rendering 3D cake view");
    // Update with the real 3D view
    document.querySelector('#cake-3d-view').innerHTML = `
      <div class="visualization-result">
        <h3>Your Cake Design</h3>
        <p>Prompt: "${prompt}"</p>
        <div id="cake-3d-container"></div>
        <div class="controls">
          <button id="rotate-btn" onclick="startRotation()">🔄 Rotate 360°</button>
          <button id="stop-btn" style="display:none;" onclick="stopRotation()">⏹️ Stop Rotation</button>
        </div>
      </div>
    `;
    
    // Initialize the 3D scene
    initThreeJS();
    
    // Create the cake based on the prompt
    createCakeFromPrompt(prompt);
  }, 1000);
}

function initThreeJS() {
  cakeContainer = document.getElementById('cake-3d-container');
  
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Create camera
  camera = new THREE.PerspectiveCamera(
    75, 
    cakeContainer.clientWidth / cakeContainer.clientHeight, 
    0.1, 
    1000
  );
  camera.position.z = 5;
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(cakeContainer.clientWidth, cakeContainer.clientHeight);
  cakeContainer.appendChild(renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Add controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
}

function onWindowResize() {
  if (!cakeContainer) return;
  
  camera.aspect = cakeContainer.clientWidth / cakeContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(cakeContainer.clientWidth, cakeContainer.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  
  if (isRotating && cake) {
    cake.rotation.y += 0.01;
  }
  
  controls.update();
  renderer.render(scene, camera);
}

function createCakeFromPrompt(prompt) {
  console.log("Creating cake from prompt:", prompt);
  
  try {
    // Remove previous cake if exists
    if (cake) {
      scene.remove(cake);
    }
    
    cake = new THREE.Group();
    
    // Parse the prompt to customize the cake
    const lowercasePrompt = prompt.toLowerCase();
    console.log("Analyzing prompt:", lowercasePrompt);
    
    // --------------- CAKE PROPERTIES ---------------
    // Default properties
    let cakeType = 'vanilla';
    let cakeColor = 0xf7d795;  // Default vanilla color
    let frostingColor = null;  // Will be set based on cake type if not specified
    let layers = 2;
    let hasCandles = false;
    let hasSprinkles = false;
    let hasExplicitFrosting = false; // Track if frosting is explicitly mentioned
    let isWedding = false;
    let hasFlowers = false;
    
    // ---------- STEP 1: DETERMINE CAKE TYPE ----------
    console.log("Step 1: Determining cake type");
    
    // ENHANCED CAKE COLOR MAPPING
    // Check for chocolate cake
    if (lowercasePrompt.includes('chocolate cake') || 
        (lowercasePrompt.includes('chocolate') && 
         !lowercasePrompt.includes('chocolate frosting'))) {
      console.log("Detected chocolate cake");
      cakeType = 'chocolate';
      cakeColor = 0x3c1803; // Rich dark chocolate color
    }
    // Check for strawberry cake - FIXED DETECTION
    else if (lowercasePrompt.includes('strawberry') || 
             lowercasePrompt.includes('pink cake')) {
      console.log("Detected strawberry cake");
      cakeType = 'strawberry';
      cakeColor = 0xff6b8a; // Brighter pink strawberry color
    }
    // Check for blueberry cake
    else if (lowercasePrompt.includes('blueberry') || 
             lowercasePrompt.includes('blue cake') ||
             lowercasePrompt.includes('blue berry')) {
      console.log("Detected blueberry cake");
      cakeType = 'blueberry';
      cakeColor = 0x0000cd; // Deeper blue color
    }
    // Check for red velvet cake
    else if (lowercasePrompt.includes('red velvet') || 
             lowercasePrompt.includes('redvelvet')) {
      console.log("Detected red velvet cake");
      cakeType = 'redvelvet';
      cakeColor = 0xb30000; // Deep red color for red velvet
    }
    // Check for lemon cake
    else if (lowercasePrompt.includes('lemon cake') ||
             lowercasePrompt.includes('lemon')) {
      console.log("Detected lemon cake");
      cakeType = 'lemon';
      cakeColor = 0xfff9a6; // Yellow lemon color
    }
    // Check for vanilla cake (explicit mention)
    else if (lowercasePrompt.includes('vanilla cake') ||
             lowercasePrompt.includes('vanilla')) {
      console.log("Detected vanilla cake");
      cakeType = 'vanilla';
      cakeColor = 0xf7d795; // Vanilla color
    }
    
    console.log(`Selected cake type: ${cakeType}, color: #${cakeColor.toString(16)}`);
    
    // ---------- STEP 2: DETERMINE FROSTING COLOR ----------
    console.log("Step 2: Determining frosting color");
    
    if (lowercasePrompt.includes('pink frosting') || 
        lowercasePrompt.includes('pink frostings')) {
      console.log("Detected pink frosting");
      frostingColor = 0xff69b4; // Pink frosting
      hasExplicitFrosting = true;
    }
    else if (lowercasePrompt.includes('chocolate frosting')) {
      console.log("Detected chocolate frosting");
      frostingColor = 0x4a2c0f; // Chocolate frosting
      hasExplicitFrosting = true;
    }
    else if (lowercasePrompt.includes('blue frosting')) {
      console.log("Detected blue frosting");
      frostingColor = 0x1e90ff; // Blue frosting
      hasExplicitFrosting = true;
    }
    else if (lowercasePrompt.includes('white frosting')) {
      console.log("Detected white frosting");
      frostingColor = 0xf8f8f0; // White frosting
      hasExplicitFrosting = true;
    }
    else if (lowercasePrompt.includes('green frosting')) {
      console.log("Detected green frosting");
      frostingColor = 0x00cc44; // Green frosting
      hasExplicitFrosting = true;
    }
    else if (lowercasePrompt.includes('yellow frosting')) {
      console.log("Detected yellow frosting");
      frostingColor = 0xffff00; // Yellow frosting
      hasExplicitFrosting = true;
    }
    else if (lowercasePrompt.includes('red frosting')) {
      console.log("Detected red frosting");
      frostingColor = 0xff0000; // Red frosting
      hasExplicitFrosting = true;
    }
    
    // If no explicit frosting color was specified, use appropriate defaults based on cake type
    if (!hasExplicitFrosting) {
      console.log("No explicit frosting detected, using default for cake type");
      
      // Default frosting colors based on cake type
      if (cakeType === 'chocolate') {
        frostingColor = 0x4a2c0f; // Slightly lighter chocolate for frosting
      } 
      else if (cakeType === 'redvelvet') {
        frostingColor = 0xf8f8f0; // Traditional cream cheese frosting (white) for red velvet
      }
      else {
        // For other cake types, match the frosting to the cake color
        frostingColor = cakeColor;
      }
    }
    
    // ---------- STEP 3: DETERMINE SPECIAL CAKE TYPES & DECORATIONS ----------
    console.log("Step 3: Determining special cake types and decorations");
    
    // Check for wedding cake
    if (lowercasePrompt.includes('wedding') || 
        lowercasePrompt.includes('bride') || 
        lowercasePrompt.includes('marriage')) {
      console.log("Detected wedding cake");
      isWedding = true;
      layers = 3; // Wedding cakes typically have more layers
      
      // Add flowers to wedding cakes by default unless explicitly mentioned not to
      if (!lowercasePrompt.includes('no flowers') && !lowercasePrompt.includes('without flowers')) {
        hasFlowers = true;
      }
    }
    
    // Check for birthday cake
    if (lowercasePrompt.includes('candle') || 
        lowercasePrompt.includes('candles') || 
        lowercasePrompt.includes('birthday')) {
      console.log("Detected candles/birthday");
      hasCandles = true;
    }
    
    // Check for sprinkles
    if (lowercasePrompt.includes('sprinkle') || 
        lowercasePrompt.includes('sprinkles')) {
      console.log("Detected sprinkles");
      hasSprinkles = true;
    }
    
    // Check for flowers
    if (lowercasePrompt.includes('flower') || 
        lowercasePrompt.includes('flowers') || 
        lowercasePrompt.includes('rose') || 
        lowercasePrompt.includes('roses')) {
      console.log("Detected flowers");
      hasFlowers = true;
    }
    
    // ---------- STEP 4: BUILD THE CAKE ----------
    console.log("Step 4: Building cake");
    console.log(`Cake type: ${cakeType}, Cake color: ${cakeColor.toString(16)}, Frosting color: ${frostingColor.toString(16)}`);
    console.log(`Special properties: Wedding: ${isWedding}, Layers: ${layers}, Flowers: ${hasFlowers}`);
    
    // Create cake layers
    for (let i = 0; i < layers; i++) {
      // For wedding cakes, make the layers more distinct in size
      const layerSizeReduction = isWedding ? 0.4 : 0.3;
      const layerSize = 1.5 - (i * layerSizeReduction);
      const layerHeight = 0.5;
      const yPos = i * layerHeight + layerHeight/2;
      
      // Create cake interior (the actual cake part)
      const cakeGeometry = new THREE.CylinderGeometry(layerSize, layerSize, layerHeight, 32);
      const cakeMaterial = new THREE.MeshPhongMaterial({ 
        color: cakeColor,
        shininess: 30
      });
      const cakeLayer = new THREE.Mesh(cakeGeometry, cakeMaterial);
      cakeLayer.position.y = yPos;
      cake.add(cakeLayer);
      
      // Create frosting on top
      const topFrostingGeometry = new THREE.CylinderGeometry(layerSize + 0.05, layerSize + 0.05, 0.1, 32);
      const frostingMaterial = new THREE.MeshPhongMaterial({ 
        color: frostingColor,
        shininess: 50
      });
      const topFrosting = new THREE.Mesh(topFrostingGeometry, frostingMaterial);
      topFrosting.position.y = yPos + layerHeight/2;
      cake.add(topFrosting);
      
      // Create frosting on sides
      const sideFrostingGeometry = new THREE.CylinderGeometry(layerSize + 0.05, layerSize + 0.05, layerHeight, 32, 1, true);
      const sideFrosting = new THREE.Mesh(sideFrostingGeometry, frostingMaterial);
      sideFrosting.position.y = yPos;
      cake.add(sideFrosting);
      
      // Add decorative piping with contrasting color
      const pipingColor = getContrastingColor(frostingColor);
      
      // Add piping around the top edge
      const numPipingDots = 16;
      for (let j = 0; j < numPipingDots; j++) {
        const angle = (j / numPipingDots) * Math.PI * 2;
        const pipingGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const pipingMaterial = new THREE.MeshPhongMaterial({ 
          color: pipingColor,
          shininess: 70
        });
        const pipingDot = new THREE.Mesh(pipingGeometry, pipingMaterial);
        
        pipingDot.position.x = Math.cos(angle) * (layerSize + 0.05);
        pipingDot.position.z = Math.sin(angle) * (layerSize + 0.05);
        pipingDot.position.y = yPos + layerHeight/2;
        
        cake.add(pipingDot);
      }
      
      // For wedding cakes, add decorative patterns on each layer
      if (isWedding) {
        addWeddingLayerDecoration(cake, layerSize, yPos, layerHeight, frostingColor, cakeType);
      }
    }
    
    // ---------- STEP 5: ADD DECORATIONS ----------
    console.log("Step 5: Adding decorations");
    
    // Add candles if needed
    if (hasCandles) {
      console.log("Adding candles");
      const topY = (layers - 1) * 0.5 + 0.5;
      
      // Add a few candles on top
      const numCandles = 5;
      for (let i = 0; i < numCandles; i++) {
        const angle = (i / numCandles) * Math.PI * 2;
        const radius = 0.6;
        
        // Create candle
        const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
        const candleColor = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff][i % 5]; // Different colors
        const candleMaterial = new THREE.MeshPhongMaterial({ color: candleColor });
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
        
        candle.position.x = Math.cos(angle) * radius;
        candle.position.z = Math.sin(angle) * radius;
        candle.position.y = topY + 0.2;
        
        // Add flame
        const flameGeometry = new THREE.SphereGeometry(0.07, 8, 8);
        const flameMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xffcc00,
          emissive: 0xff6600,
          shininess: 100
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 0.25;
        flame.scale.y = 1.5;
        candle.add(flame);
        
        cake.add(candle);
      }
    }
    
    // Add sprinkles if needed
    if (hasSprinkles) {
      console.log("Adding sprinkles");
      const topY = (layers - 1) * 0.5 + 0.5;
      const topLayerSize = 1.5 - ((layers - 1) * (isWedding ? 0.4 : 0.3));
      
      // Add colorful sprinkles on top
      const numSprinkles = 50;
      const sprinkleColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
      
      for (let i = 0; i < numSprinkles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * topLayerSize * 0.8;
        
        const sprinkleGeometry = new THREE.BoxGeometry(0.05, 0.02, 0.02);
        const sprinkleMaterial = new THREE.MeshPhongMaterial({ 
          color: sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
          shininess: 80
        });
        const sprinkle = new THREE.Mesh(sprinkleGeometry, sprinkleMaterial);
        
        sprinkle.position.x = Math.cos(angle) * radius;
        sprinkle.position.z = Math.sin(angle) * radius;
        sprinkle.position.y = topY + 0.06;
        
        // Random rotation
        sprinkle.rotation.x = Math.random() * Math.PI;
        sprinkle.rotation.y = Math.random() * Math.PI;
        sprinkle.rotation.z = Math.random() * Math.PI;
        
        cake.add(sprinkle);
      }
    }
    
    // Add flowers if needed
    if (hasFlowers) {
      console.log("Adding flowers");
      addFlowersToTop(cake, layers, cakeType, isWedding);
      
      // For wedding cakes, also add flowers cascading down the side
      if (isWedding) {
        addCascadingFlowers(cake, layers, cakeType);
      }
    }
    
    // Add flavor-specific decorations
    addFlavorSpecificDecorations(cake, cakeType, layers);
    
    // Add wedding cake topper if it's a wedding cake
    if (isWedding) {
      console.log("Adding wedding cake topper");
      addWeddingCakeTopper(cake, layers);
    }
    
    // Add to scene
    scene.add(cake);
    console.log("Cake successfully added to scene");
    
  } catch (error) {
    console.error("Error creating cake:", error);
    // Create a simple fallback cake
    createFallbackCake();
  }
}

// Add wedding-specific layer decorations
function addWeddingLayerDecoration(cakeObj, layerSize, yPos, layerHeight, frostingColor, cakeType) {
  // Add elegant patterns based on the cake type
  const numPatterns = 12;
  
  for (let i = 0; i < numPatterns; i++) {
    const angle = (i / numPatterns) * Math.PI * 2;
    
    // Create decorative pattern
    let patternGeometry, patternMaterial;
    
    // Different patterns based on cake type
    if (cakeType === 'chocolate') {
      // Chocolate swirls
      patternGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 12, Math.PI);
      patternMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c1608, // Dark chocolate
        shininess: 60
      });
    } else if (cakeType === 'strawberry') {
      // Heart shapes for strawberry
      patternGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      patternMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff3366, // Strawberry red
        shininess: 70
      });
    } else if (cakeType === 'blueberry') {
      // Blueberry dots
      patternGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      patternMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4169e1, // Blueberry blue
        shininess: 70
      });
    } else {
      // Default elegant swirls
      patternGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI);
      patternMaterial = new THREE.MeshPhongMaterial({ 
        color: getContrastingColor(frostingColor),
        shininess: 70
      });
    }
    
    const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
    
    // Position on the side of the cake
    pattern.position.x = Math.cos(angle) * (layerSize + 0.05);
    pattern.position.z = Math.sin(angle) * (layerSize + 0.05);
    pattern.position.y = yPos;
    
    // Rotate to face outward
    pattern.rotation.y = angle + Math.PI/2;
    
    cakeObj.add(pattern);
  }
}

// Add flowers to the top of the cake
function addFlowersToTop(cakeObj, layers, cakeType, isWedding) {
  const topY = (layers - 1) * 0.5 + 0.5;
  const layerSizeReduction = isWedding ? 0.4 : 0.3;
  const topLayerSize = 1.5 - ((layers - 1) * layerSizeReduction);
  
  // Number of flowers depends on if it's a wedding cake
  const numFlowers = isWedding ? 12 : 6;
  
  // Flower colors based on cake type
  let petalColor, centerColor;
  
  if (cakeType === 'chocolate') {
    petalColor = 0xffffff; // White flowers look good on chocolate
    centerColor = 0xffcc00; // Gold centers
  } else if (cakeType === 'strawberry') {
    petalColor = 0xff8fa3; // Pink flowers
    centerColor = 0xffcc00; // Gold centers
  } else if (cakeType === 'blueberry') {
    petalColor = 0xadd8e6; // Light blue flowers
    centerColor = 0xffcc00; // Gold centers
  } else {
    petalColor = 0xffffff; // White flowers
    centerColor = 0xffcc00; // Gold centers
  }
  
  // Create flowers around the edge
  for (let i = 0; i < numFlowers; i++) {
    const angle = (i / numFlowers) * Math.PI * 2;
    const radius = topLayerSize * 0.7;
    
    // Create flower
    const flower = createFlower(petalColor, centerColor);
    
    // Position flower
    flower.position.x = Math.cos(angle) * radius;
    flower.position.z = Math.sin(angle) * radius;
    flower.position.y = topY + 0.05;
    
    // Random rotation for natural look
    flower.rotation.y = Math.random() * Math.PI * 2;
    
    cakeObj.add(flower);
  }
  
  // For wedding cakes, add a central flower arrangement
  if (isWedding) {
    const centerArrangement = new THREE.Group();
    
    // Create a cluster of flowers in the center
    for (let i = 0; i < 5; i++) {
      const flower = createFlower(petalColor, centerColor);
      
      // Position in a small cluster
      const angle = (i / 5) * Math.PI * 2;
      const clusterRadius = 0.15;
      
      flower.position.x = Math.cos(angle) * clusterRadius;
      flower.position.z = Math.sin(angle) * clusterRadius;
      flower.position.y = Math.random() * 0.1;
      
      // Random rotation
      flower.rotation.y = Math.random() * Math.PI * 2;
      
      centerArrangement.add(flower);
    }
    
    centerArrangement.position.y = topY + 0.05;
    cakeObj.add(centerArrangement);
  }
}

// Create a flower mesh
function createFlower(petalColor, centerColor) {
  const flower = new THREE.Group();
  
  // Create petals
  const numPetals = 5;
  for (let i = 0; i < numPetals; i++) {
    const angle = (i / numPetals) * Math.PI * 2;
    
    const petalGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const petalMaterial = new THREE.MeshPhongMaterial({ 
      color: petalColor,
      shininess: 70
    });
    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
    
    // Position petal around center
    petal.position.x = Math.cos(angle) * 0.08;
    petal.position.z = Math.sin(angle) * 0.08;
    
    // Scale to make it more petal-like
    petal.scale.set(1, 0.5, 1);
    
    flower.add(petal);
  }
  
  // Create flower center
  const centerGeometry = new THREE.SphereGeometry(0.06, 8, 8);
  const centerMaterial = new THREE.MeshPhongMaterial({ 
    color: centerColor,
    shininess: 80
  });
  const center = new THREE.Mesh(centerGeometry, centerMaterial);
  center.position.y = 0.02;
  flower.add(center);
  
  return flower;
}

// Add cascading flowers down the side of wedding cakes
function addCascadingFlowers(cakeObj, layers, cakeType) {
  // Determine flower colors based on cake type
  let petalColor, centerColor;
  
  if (cakeType === 'chocolate') {
    petalColor = 0xffffff; // White flowers look good on chocolate
    centerColor = 0xffcc00; // Gold centers
  } else if (cakeType === 'strawberry') {
    petalColor = 0xff8fa3; // Pink flowers
    centerColor = 0xffcc00; // Gold centers
  } else if (cakeType === 'blueberry') {
    petalColor = 0xadd8e6; // Light blue flowers
    centerColor = 0xffcc00; // Gold centers
  } else {
    petalColor = 0xffffff; // White flowers
    centerColor = 0xffcc00; // Gold centers
  }
  
  // Create a cascade of flowers down one side
  const cascadeAngle = Math.PI / 4; // Position of the cascade
  const numFlowers = 12;
  
  for (let i = 0; i < numFlowers; i++) {
    // Distribute flowers from top to bottom
    const heightPercent = i / numFlowers;
    const yPos = (layers - 1) * 0.5 + 0.5 - (heightPercent * layers * 0.5);
    
    // Vary the angle slightly for a natural look
    const angle = cascadeAngle + (Math.random() - 0.5) * 0.5;
    
    // Calculate radius based on which layer the flower is on
    const layerIndex = Math.floor((layers * 0.5 - yPos) / 0.5);
    const layerSizeReduction = 0.4; // Wedding cake layer size reduction
    const layerSize = 1.5 - (layerIndex * layerSizeReduction);
    
    // Create flower
    const flower = createFlower(petalColor, centerColor);
    
    // Position flower
    flower.position.x = Math.cos(angle) * (layerSize + 0.05);
    flower.position.z = Math.sin(angle) * (layerSize + 0.05);
    flower.position.y = yPos;
    
    // Rotate to face outward
    flower.rotation.y = angle + Math.PI;
    flower.rotation.x = Math.PI / 2;
    
    // Random scaling for variety
    const scale = 0.7 + Math.random() * 0.6;
    flower.scale.set(scale, scale, scale);
    
    cakeObj.add(flower);
  }
}

// Add a wedding cake topper
function addWeddingCakeTopper(cakeObj, layers) {
  const topY = (layers - 1) * 0.5 + 0.5;
  
  // Create a simple wedding cake topper
  const topperGroup = new THREE.Group();
  
  // Create base
  const baseGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
  const baseMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    shininess: 70
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  topperGroup.add(base);
  
  // Create two figures
  const figure1 = createFigure(0x333333); // Dark figure
  figure1.position.x = -0.05;
  figure1.position.y = 0.15;
  topperGroup.add(figure1);
  
  const figure2 = createFigure(0xffffff); // Light figure
  figure2.position.x = 0.05;
  figure2.position.y = 0.15;
  topperGroup.add(figure2);
  
  // Position topper on cake
  topperGroup.position.y = topY + 0.1;
  cakeObj.add(topperGroup);
}

// Create a simple figure for the cake topper
function createFigure(color) {
  const figure = new THREE.Group();
  
  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.1, 8);
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: color,
    shininess: 70
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  figure.add(body);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.03, 8, 8);
  const headMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xffdbac, // Skin tone
    shininess: 70
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 0.08;
  figure.add(head);
  
  return figure;
}

// Helper function to get a contrasting color
function getContrastingColor(color) {
  // Convert hex to RGB
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  
  // Calculate luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // Return white for dark colors, dark for light colors
  return luminance < 128 ? 0xffffff : 0x333333;
}

// Add flavor-specific decorations
function addFlavorSpecificDecorations(cakeObj, cakeType, layers) {
  const topY = (layers - 1) * 0.5 + 0.5;
  const topLayerSize = 1.5 - ((layers - 1) * 0.3);
  
  if (cakeType === 'chocolate') {
    console.log("Adding chocolate decorations");
    
    // Add chocolate curls on top
    const numCurls = 10;
    for (let i = 0; i < numCurls; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * topLayerSize * 0.7;
      
      // Create chocolate curl
      const curlGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 20, Math.PI * 1.5);
      const curlMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3c1803, // Dark chocolate
        shininess: 60
      });
      const curl = new THREE.Mesh(curlGeometry, curlMaterial);
      
      curl.position.x = Math.cos(angle) * radius;
      curl.position.z = Math.sin(angle) * radius;
      curl.position.y = topY + 0.05;
      
      // Random rotation
      curl.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      curl.rotation.y = Math.random() * Math.PI * 2;
      
      cakeObj.add(curl);
    }
    
    // Add chocolate drips down the sides
    const numDrips = 8;
    for (let i = 0; i < numDrips; i++) {
      const angle = (i / numDrips) * Math.PI * 2;
      const dripHeight = 0.2 + Math.random() * 0.2;
      
      const dripGeometry = new THREE.CylinderGeometry(0.03, 0.01, dripHeight, 8);
      const dripMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c1608, // Dark chocolate drip
        shininess: 60
      });
      const drip = new THREE.Mesh(dripGeometry, dripMaterial);
      
      drip.position.x = Math.cos(angle) * (topLayerSize + 0.05);
      drip.position.z = Math.sin(angle) * (topLayerSize + 0.05);
      drip.position.y = topY + 0.05 - dripHeight/2;
      
      // Rotate to point down
      drip.rotation.x = Math.PI / 2;
      drip.rotation.z = angle;
      
      cakeObj.add(drip);
    }
  }
  else if (cakeType === 'strawberry') {
    console.log("Adding strawberry decorations");
    
    // Add strawberries on top
    const numStrawberries = 8;
    for (let i = 0; i < numStrawberries; i++) {
      const angle = (i / numStrawberries) * Math.PI * 2;
      const radius = topLayerSize * 0.6;
      
      // Create strawberry
      const strawberryGroup = new THREE.Group();
      
      // Strawberry body
      const bodyGeometry = new THREE.ConeGeometry(0.1, 0.2, 16);
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff3366, // Strawberry red
        shininess: 70
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.x = Math.PI; // Flip cone upside down
      strawberryGroup.add(body);
      
      // Strawberry green top
      const topGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
      const topMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00cc44, // Green
        shininess: 60
      });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 0.1;
      strawberryGroup.add(top);
      
      // Position the strawberry
      strawberryGroup.position.x = Math.cos(angle) * radius;
      strawberryGroup.position.z = Math.sin(angle) * radius;
      strawberryGroup.position.y = topY + 0.1;
      
      cakeObj.add(strawberryGroup);
    }
  }
  else if (cakeType === 'blueberry') {
    console.log("Adding blueberry decorations");
    
    // Add blueberries on top
    const numBlueberries = 20;
    for (let i = 0; i < numBlueberries; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * topLayerSize * 0.7;
      
      // Create blueberry
      const blueberryGeometry = new THREE.SphereGeometry(0.07, 12, 12);
      const blueberryMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4169e1, // Blueberry blue
        shininess: 80
      });
      const blueberry = new THREE.Mesh(blueberryGeometry, blueberryMaterial);
      
      blueberry.position.x = Math.cos(angle) * radius;
      blueberry.position.z = Math.sin(angle) * radius;
      blueberry.position.y = topY + 0.07;
      
      cakeObj.add(blueberry);
    }
  }
  else if (cakeType === 'lemon') {
    console.log("Adding lemon decorations");
    
    // Add lemon slices on top
    const numLemonSlices = 6;
    for (let i = 0; i < numLemonSlices; i++) {
      const angle = (i / numLemonSlices) * Math.PI * 2;
      const radius = topLayerSize * 0.6;
      
      // Create lemon slice
      const sliceGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16);
      const sliceMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffff00, // Bright yellow
        shininess: 60
      });
      const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
      
      slice.position.x = Math.cos(angle) * radius;
      slice.position.z = Math.sin(angle) * radius;
      slice.position.y = topY + 0.03;
      
      // Rotate to lay flat
      slice.rotation.x = Math.PI / 2;
      
      cakeObj.add(slice);
    }
  }
}

// Fallback cake if something goes wrong
function createFallbackCake() {
  console.log("Creating fallback cake");
  const fallbackCake = new THREE.Group();
  
  // Simple cake
  const cakeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
  const cakeMaterial = new THREE.MeshPhongMaterial({ color: 0xf7d795 });
  const cakeLayer = new THREE.Mesh(cakeGeometry, cakeMaterial);
  cakeLayer.position.y = 0.25;
  
  // Simple frosting
  const frostingGeometry = new THREE.CylinderGeometry(1.55, 1.55, 0.1, 32);
  const frostingMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const frostingLayer = new THREE.Mesh(frostingGeometry, frostingMaterial);
  frostingLayer.position.y = 0.5;
  
  fallbackCake.add(cakeLayer);
  fallbackCake.add(frostingLayer);
  
  // Add a simple candle
  const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
  const candleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const candle = new THREE.Mesh(candleGeometry, candleMaterial);
  candle.position.set(0, 0.7, 0);
  fallbackCake.add(candle);
  
  scene.add(fallbackCake);
  cake = fallbackCake;
}

// Add this to your CSS to ensure the modal is visible when not hidden
document.head.insertAdjacentHTML('beforeend', `
  <style>
    #cake-prompt-modal.hidden { 
      display: none !important; 
    }
    
    #cake-prompt-modal:not(.hidden) {
      display: flex !important;
    }
  </style>
`);
