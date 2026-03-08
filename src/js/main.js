/**
 * MACFOR — Main JavaScript
 * Animations, Smooth Scroll, Custom Cursor, WebGL Orb
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// ============================================
// PRELOADER
// ============================================
class Preloader {
  constructor() {
    this.el = document.getElementById('preloader')
    this.bar = this.el.querySelector('.preloader__bar-fill')
    this.counter = this.el.querySelector('.preloader__counter')
    this.logo = this.el.querySelector('.preloader__logo')
    this.barWrap = this.el.querySelector('.preloader__bar')
    this.progress = 0
    this.init()
  }

  init() {
    // Animate preloader elements in
    gsap.to(this.logo, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2
    })

    gsap.to([this.barWrap, this.counter], {
      opacity: 1,
      duration: 0.5,
      delay: 0.5
    })

    // Simulate loading
    this.animate()
  }

  animate() {
    const obj = { val: 0 }
    const self = this

    gsap.to(obj, {
      val: 100,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate() {
        const p = Math.round(obj.val)
        self.counter.textContent = `${p}%`
        self.bar.style.width = `${p}%`
      },
      onComplete() {
        self.hide()
      }
    })
  }

  hide() {
    gsap.to(this.el, {
      opacity: 0,
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: () => {
        this.el.classList.add('is-hidden')
        document.body.style.overflow = ''
        // Trigger hero animations
        window.dispatchEvent(new CustomEvent('preloaderComplete'))
      }
    })
  }
}

// ============================================
// SMOOTH SCROLL (Lenis)
// ============================================
class SmoothScroll {
  constructor() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    this.init()
  }

  init() {
    const raf = (time) => {
      this.lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Sync with GSAP ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault()
        const target = document.querySelector(anchor.getAttribute('href'))
        if (target) {
          this.lenis.scrollTo(target, { offset: -80 })
          // Close mobile menu if open
          const mobileMenu = document.getElementById('mobileMenu')
          const hamburger = document.getElementById('hamburger')
          if (mobileMenu?.classList.contains('is-open')) {
            mobileMenu.classList.remove('is-open')
            hamburger?.classList.remove('is-active')
            this.lenis.start()
          }
        }
      })
    })
  }

  stop() { this.lenis.stop() }
  start() { this.lenis.start() }
}

// ============================================
// CUSTOM CURSOR
// ============================================
class CustomCursor {
  constructor() {
    this.cursor = document.getElementById('cursor')
    if (!this.cursor || window.innerWidth < 768) return

    this.pos = { x: 0, y: 0 }
    this.target = { x: 0, y: 0 }
    this.speed = 0.15
    this.init()
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.target.x = e.clientX
      this.target.y = e.clientY
    })

    // Hover detection
    const interactiveElements = 'a, button, [data-magnetic], input, textarea, .case-card, .service-card, .insight-card'

    document.querySelectorAll(interactiveElements).forEach(el => {
      el.addEventListener('mouseenter', () => this.cursor.classList.add('is-hovering'))
      el.addEventListener('mouseleave', () => this.cursor.classList.remove('is-hovering'))
    })

    this.render()
  }

  render() {
    this.pos.x += (this.target.x - this.pos.x) * this.speed
    this.pos.y += (this.target.y - this.pos.y) * this.speed

    this.cursor.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`

    requestAnimationFrame(() => this.render())
  }
}

// ============================================
// MAGNETIC BUTTONS
// ============================================
class MagneticButtons {
  constructor() {
    if (window.innerWidth < 768) return
    this.buttons = document.querySelectorAll('[data-magnetic]')
    this.init()
  }

  init() {
    this.buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.4,
          ease: 'power2.out'
        })
      })

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)'
        })
      })
    })
  }
}

// ============================================
// WEBGL ORB (Three.js)
// ============================================
class WebGLOrb {
  constructor() {
    this.canvas = document.getElementById('heroCanvas')
    if (!this.canvas) return

    this.scene = new THREE.Scene()
    this.startTime = performance.now()
    this.mouse = { x: 0, y: 0 }
    this.init()
  }

  init() {
    const { width, height } = this.canvas.parentElement.getBoundingClientRect()

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    this.camera.position.z = 5

    // Create gradient orb
    this.createOrb()
    this.createParticles()

    // Events
    window.addEventListener('resize', () => this.onResize())
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })

    this.animate()
  }

  createOrb() {
    const geometry = new THREE.IcosahedronGeometry(1.5, 64)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#00d6b5') },
        uColor2: { value: new THREE.Color('#00abff') },
        uColor3: { value: new THREE.Color('#814aff') },
        uColor4: { value: new THREE.Color('#ca07a4') },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform vec2 uMouse;

        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          vPosition = position;

          vec3 pos = position;
          float noise = snoise(pos * 0.8 + uTime * 0.3) * 0.25;
          float mouseInfluence = snoise(pos * 1.2 + vec3(uMouse * 2.0, uTime * 0.2)) * 0.1;
          pos += normal * (noise + mouseInfluence);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;

        void main() {
          float t = uTime * 0.15;
          float mixFactor1 = sin(vPosition.x * 2.0 + t) * 0.5 + 0.5;
          float mixFactor2 = cos(vPosition.y * 2.0 + t * 1.3) * 0.5 + 0.5;
          float mixFactor3 = sin(vPosition.z * 1.5 + t * 0.7) * 0.5 + 0.5;

          vec3 color = mix(uColor1, uColor2, mixFactor1);
          color = mix(color, uColor3, mixFactor2);
          color = mix(color, uColor4, mixFactor3 * 0.5);

          // Fresnel
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
          color += fresnel * 0.3;

          // Subtle glow
          float glow = fresnel * 0.15;
          float alpha = 0.85 + glow;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    })

    this.orb = new THREE.Mesh(geometry, material)
    this.orb.position.set(1.5, 0, 0)
    this.scene.add(this.orb)
  }

  createParticles() {
    const count = 200
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 12
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x00abff,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    })

    this.particles = new THREE.Points(geometry, material)
    this.scene.add(this.particles)
  }

  animate() {
    const time = (performance.now() - this.startTime) / 1000

    if (this.orb) {
      this.orb.material.uniforms.uTime.value = time
      this.orb.material.uniforms.uMouse.value.set(
        this.mouse.x * 0.5,
        this.mouse.y * 0.5
      )
      this.orb.rotation.y = time * 0.1
      this.orb.rotation.x = Math.sin(time * 0.15) * 0.1
    }

    if (this.particles) {
      this.particles.rotation.y = time * 0.02
      this.particles.rotation.x = time * 0.01
    }

    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(() => this.animate())
  }

  onResize() {
    const { width, height } = this.canvas.parentElement.getBoundingClientRect()
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }
}

// ============================================
// ANIMATIONS (itsoffbrand.com-style scroll effects)
// ============================================
class Animations {
  constructor() {
    this.init()
  }

  init() {
    window.addEventListener('preloaderComplete', () => {
      this.heroAnimations()
      this.setupGlobalOrbs()
      this.setupWordReveals()
      this.setupFadeUpAnimations()
      this.setupParallaxEffects()
      this.setupSectionDividers()
      this.setupCounters()
      this.setupHorizontalScroll()
      this.setupCaseCards()
      this.setupInsightCards()
      this.setupDiferencialCards()
      this.setupMarqueeScrollSpeed()
      this.setupNavScrollState()
      this.setupSectionGlows()
    })
  }

  // ---- HERO ENTRANCE ----
  heroAnimations() {
    const tl = gsap.timeline({ delay: 0.3 })

    tl.to('.hero__title-word', {
      y: 0,
      duration: 1.2,
      ease: 'power4.out',
      stagger: 0.08,
    })

    tl.to('.hero__eyebrow', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.6')

    tl.to('.hero__description', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.4')

    tl.to('.hero__bottom .btn', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.4')

    tl.to('.hero__scroll-indicator', {
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.4')

    // Hero exit: scale down + fade as you scroll past
    gsap.to('.hero__content', {
      scale: 0.9,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '70% top',
        scrub: true,
      }
    })

    // Parallax on hero canvas
    gsap.to('.hero__canvas', {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    })
  }

  // ---- GLOBAL FLOATING ORBS with parallax ----
  setupGlobalOrbs() {
    const orbs = document.querySelectorAll('.global-orb')
    if (!orbs.length) return

    // Each orb moves at different speed creating depth
    const speeds = [0.3, -0.5, 0.2, -0.4, 0.6, -0.3]
    const xSpeeds = [15, -20, 10, -15, 25, -10]

    orbs.forEach((orb, i) => {
      gsap.to(orb, {
        yPercent: speeds[i] * 100,
        xPercent: xSpeeds[i],
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        }
      })
    })
  }

  // ---- WORD-BY-WORD REVEAL with scrub ----
  setupWordReveals() {
    gsap.utils.toArray('[data-anim="word-reveal"]').forEach(el => {
      const words = el.querySelectorAll('.word')
      if (!words.length) return

      // Set initial state
      gsap.set(words, { opacity: 0.15, y: 20, filter: 'blur(4px)' })

      // Scrub-based word reveal tied to scroll progress
      gsap.to(words, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.8,
        }
      })
    })
  }

  // ---- FADE UP with stagger (scrub-based) ----
  setupFadeUpAnimations() {
    gsap.utils.toArray('[data-anim="fade-up"]').forEach(el => {
      if (el.closest('.hero')) return

      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            end: 'top 60%',
            scrub: 0.6,
          }
        }
      )
    })
  }

  // ---- PARALLAX on various elements ----
  setupParallaxEffects() {
    // About section parallax
    const aboutStats = document.querySelector('.about__stats')
    if (aboutStats) {
      gsap.fromTo(aboutStats, { y: 60 }, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: aboutStats,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      })
    }

    // Impact orbs parallax
    gsap.utils.toArray('.impact__orb').forEach((orb, i) => {
      gsap.fromTo(orb,
        { scale: 0.6, opacity: 0 },
        {
          scale: 1.2,
          opacity: 0.6,
          ease: 'none',
          scrollTrigger: {
            trigger: '.impact',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      )
    })

    // CTA orbs parallax
    gsap.utils.toArray('.cta-section__orb').forEach((orb, i) => {
      gsap.fromTo(orb,
        { scale: 0.5, opacity: 0, rotation: i * 30 },
        {
          scale: 1.3,
          opacity: 0.5,
          rotation: i * 30 + 60,
          ease: 'none',
          scrollTrigger: {
            trigger: '.cta-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      )
    })

    // Eyebrow lines parallax
    gsap.utils.toArray('.eyebrow').forEach(eyebrow => {
      gsap.fromTo(eyebrow,
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: eyebrow,
            start: 'top 88%',
            end: 'top 65%',
            scrub: 0.5,
          }
        }
      )
    })
  }

  // ---- SECTION DIVIDERS animation ----
  setupSectionDividers() {
    gsap.utils.toArray('.section-divider').forEach(divider => {
      const line = divider.querySelector('.section-divider__line')
      const dot = divider.querySelector('.section-divider__dot')

      gsap.fromTo(line,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: divider,
            start: 'top 85%',
            end: 'top 50%',
            scrub: 0.5,
          }
        }
      )

      gsap.fromTo(dot,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: 'back.out(3)',
          scrollTrigger: {
            trigger: divider,
            start: 'top 70%',
            end: 'top 45%',
            scrub: 0.5,
          }
        }
      )
    })
  }

  // ---- COUNTERS ----
  setupCounters() {
    gsap.utils.toArray('[data-count]').forEach(counter => {
      const target = parseInt(counter.dataset.count)

      ScrollTrigger.create({
        trigger: counter,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(counter, {
            textContent: target,
            duration: 2,
            ease: 'power2.out',
            snap: { textContent: 1 },
            onUpdate: function () {
              counter.textContent = Math.round(gsap.getProperty(counter, 'textContent'))
            }
          })
        },
        once: true,
      })
    })
  }

  // ---- HORIZONTAL SCROLL with card reveals ----
  setupHorizontalScroll() {
    const track = document.getElementById('servicesTrack')
    if (!track) return

    const cards = track.querySelectorAll('.service-card')
    if (cards.length === 0) return

    const getScrollWidth = () => track.scrollWidth - window.innerWidth + 100

    // Main horizontal scroll
    gsap.to(track, {
      x: () => -getScrollWidth(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.services',
        start: 'top top',
        end: () => `+=${getScrollWidth()}`,
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      }
    })

    // Cards stagger with scale + rotation on entry
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 80, scale: 0.9, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.services',
            start: `top ${85 - i * 4}%`,
            once: true,
          }
        }
      )
    })
  }

  // ---- CASE CARDS with staggered scroll reveal ----
  setupCaseCards() {
    gsap.utils.toArray('.case-card').forEach((card, i) => {
      gsap.fromTo(card,
        {
          opacity: 0,
          y: 80,
          scale: 0.92,
          rotateY: i % 2 === 0 ? -3 : 3,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateY: 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'top 55%',
            scrub: 0.6,
          }
        }
      )
    })
  }

  // ---- INSIGHT CARDS with staggered reveal ----
  setupInsightCards() {
    gsap.utils.toArray('.insight-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'top 60%',
            scrub: 0.5,
          }
        }
      )
    })
  }

  // ---- DIFERENCIAL CARDS with stagger ----
  setupDiferencialCards() {
    gsap.utils.toArray('.diferencial__card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 50, scale: 0.93 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            end: 'top 65%',
            scrub: 0.5,
          }
        }
      )
    })
  }

  // ---- MARQUEE speed variation on scroll ----
  setupMarqueeScrollSpeed() {
    // Speed up marquee based on scroll velocity
    const marquees = document.querySelectorAll('.marquee__track')
    let currentSpeed = 1

    ScrollTrigger.create({
      trigger: '.marquee-section',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const velocity = Math.abs(self.getVelocity()) / 1000
        const speedMultiplier = 1 + Math.min(velocity, 5)

        marquees.forEach(track => {
          gsap.to(track, {
            timeScale: speedMultiplier,
            duration: 0.3,
            overwrite: true,
          })
        })
      }
    })

    // Skew marquee based on scroll direction
    ScrollTrigger.create({
      trigger: '.marquee-section',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const skew = Math.min(Math.max(self.getVelocity() / 300, -5), 5)
        gsap.to('.marquee-section', {
          skewX: skew,
          duration: 0.3,
          ease: 'power2.out',
        })
      },
      onLeave: () => {
        gsap.to('.marquee-section', { skewX: 0, duration: 0.5 })
      },
      onLeaveBack: () => {
        gsap.to('.marquee-section', { skewX: 0, duration: 0.5 })
      }
    })
  }

  // ---- NAV scroll state ----
  setupNavScrollState() {
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate: (self) => {
        const nav = document.getElementById('nav')
        if (self.direction === 1 && self.scroll() > 80) {
          nav.classList.add('is-scrolled')
        } else if (self.scroll() <= 80) {
          nav.classList.remove('is-scrolled')
        }
      }
    })
  }

  // ---- SECTION GLOW transitions ----
  setupSectionGlows() {
    // About section: gentle glow appear on enter
    const aboutSection = document.querySelector('.about')
    if (aboutSection) {
      gsap.fromTo(aboutSection,
        { '--glow-opacity': 0 },
        {
          '--glow-opacity': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: aboutSection,
            start: 'top 80%',
            end: 'top 20%',
            scrub: true,
          }
        }
      )
    }

    // Contact section scale-up entrance
    const contactSection = document.querySelector('.contact')
    if (contactSection) {
      gsap.fromTo('.contact__content',
        { scale: 0.85, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contactSection,
            start: 'top 80%',
            end: 'top 35%',
            scrub: 0.8,
          }
        }
      )
    }
  }
}

// ============================================
// NAVIGATION
// ============================================
class Navigation {
  constructor(smoothScroll) {
    this.smoothScroll = smoothScroll
    this.hamburger = document.getElementById('hamburger')
    this.mobileMenu = document.getElementById('mobileMenu')
    this.themeToggle = document.getElementById('themeToggle')
    this.isDark = true
    this.init()
  }

  init() {
    // Hamburger toggle
    this.hamburger?.addEventListener('click', () => {
      const isOpen = this.mobileMenu.classList.toggle('is-open')
      this.hamburger.classList.toggle('is-active')

      if (isOpen) {
        this.smoothScroll.stop()
        // Animate links in
        gsap.fromTo('.mobile-menu__link', {
          opacity: 0,
          y: 40
        }, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
          delay: 0.2
        })
      } else {
        this.smoothScroll.start()
      }
    })

    // Theme toggle
    this.themeToggle?.addEventListener('click', () => {
      this.isDark = !this.isDark
      document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light')
      this.themeToggle.querySelector('.nav__theme-icon').textContent = this.isDark ? '◐' : '◑'
    })
  }
}

// ============================================
// TAB TITLE ANIMATION
// ============================================
class TabTitle {
  constructor() {
    this.originalTitle = document.title
    this.init()
  }

  init() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = 'Voltamos logo! — Macfor'
      } else {
        document.title = this.originalTitle
      }
    })
  }
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================
function init() {
  const preloader = new Preloader()
  const smoothScroll = new SmoothScroll()
  const cursor = new CustomCursor()
  const magnetic = new MagneticButtons()
  const orb = new WebGLOrb()
  const animations = new Animations()
  const navigation = new Navigation(smoothScroll)
  const tabTitle = new TabTitle()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
