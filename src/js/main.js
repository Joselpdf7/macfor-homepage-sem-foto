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
// ANIMATIONS
// ============================================
class Animations {
  constructor() {
    this.init()
  }

  init() {
    window.addEventListener('preloaderComplete', () => {
      this.heroAnimations()
      this.setupScrollAnimations()
      this.setupTextReveals()
      this.setupCounters()
      this.setupHorizontalScroll()
    })
  }

  heroAnimations() {
    const tl = gsap.timeline({ delay: 0.3 })

    // Reveal hero title words
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
  }

  setupScrollAnimations() {
    // Fade up animations
    gsap.utils.toArray('[data-anim="fade-up"]').forEach(el => {
      // Skip hero elements (already animated)
      if (el.closest('.hero')) return

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
          })
        },
        once: true,
      })
    })

    // Nav scroll state
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

    // Parallax on orb
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

  setupTextReveals() {
    gsap.utils.toArray('[data-anim="text-reveal"]').forEach(el => {
      // Skip hero elements
      if (el.closest('.hero')) return

      const lines = el.querySelectorAll('.impact__line, .cta-section__line, span')
      if (lines.length === 0) {
        // Animate the element itself
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          onEnter: () => {
            gsap.fromTo(el, { opacity: 0, y: 60 }, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: 'power4.out',
            })
          },
          once: true,
        })
      } else {
        // Animate each line
        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          onEnter: () => {
            gsap.fromTo(lines, { opacity: 0, y: 60 }, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: 'power4.out',
              stagger: 0.15,
            })
          },
          once: true,
        })
      }
    })
  }

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
            onUpdate: function() {
              counter.textContent = Math.round(gsap.getProperty(counter, 'textContent'))
            }
          })
        },
        once: true,
      })
    })
  }

  setupHorizontalScroll() {
    const track = document.getElementById('servicesTrack')
    if (!track) return

    const cards = track.querySelectorAll('.service-card')
    if (cards.length === 0) return

    // Calculate scroll distance
    const getScrollWidth = () => track.scrollWidth - window.innerWidth + 100

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

    // Stagger card appearance
    cards.forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 60 }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.services',
          start: `top ${80 - i * 5}%`,
          once: true,
        }
      })
    })
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
